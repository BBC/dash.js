/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
import XHRLoader from './XHRLoader';
import FetchLoader from './FetchLoader';
import { HTTPRequest } from '../vo/metrics/HTTPRequest';
import FactoryMaker from '../../core/FactoryMaker';
import Errors from '../../core/errors/Errors';
import DashJSError from '../vo/DashJSError';
import Debug from '../../core/Debug';

/**
 * @module HTTPLoader
 * @description Manages download of resources via HTTP.
 * @param {Object} cfg - dependancies from parent
 */
function HTTPLoader(cfg) {

    cfg = cfg || {};

    const context = this.context;
    const errHandler = cfg.errHandler;
    const metricsModel = cfg.metricsModel;
    const mediaPlayerModel = cfg.mediaPlayerModel;
    const requestModifier = cfg.requestModifier;
    const boxParser = cfg.boxParser;
    const useFetch = cfg.useFetch || false;
    const requestTimeout = cfg.requestTimeout || 0;

    let logger,
        instance,
        requests,
        delayedRequests,
        retryRequests,
        downloadErrorToRequestTypeMap,
        newDownloadErrorToRequestTypeMap;

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
        requests = [];
        delayedRequests = [];
        retryRequests = [];

        downloadErrorToRequestTypeMap = {
            [HTTPRequest.MPD_TYPE]: Errors.DOWNLOAD_ERROR_ID_MANIFEST,
            [HTTPRequest.XLINK_EXPANSION_TYPE]: Errors.DOWNLOAD_ERROR_ID_XLINK,
            [HTTPRequest.INIT_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_INITIALIZATION,
            [HTTPRequest.MEDIA_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT,
            [HTTPRequest.INDEX_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT,
            [HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT,
            [HTTPRequest.OTHER_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT
        };

        newDownloadErrorToRequestTypeMap = {
            [HTTPRequest.MPD_TYPE]: Errors.DOWNLOAD_ERROR_ID_MANIFEST_CODE,
            [HTTPRequest.XLINK_EXPANSION_TYPE]: Errors.DOWNLOAD_ERROR_ID_XLINK_CODE,
            [HTTPRequest.INIT_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_INITIALIZATION_CODE,
            [HTTPRequest.MEDIA_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT_CODE,
            [HTTPRequest.INDEX_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT_CODE,
            [HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT_CODE,
            [HTTPRequest.OTHER_TYPE]: Errors.DOWNLOAD_ERROR_ID_CONTENT_CODE
        };
    }

    function scheduleRetry(config, remainingAttempts, request) {
        const retryRequest = { config: config };
        retryRequests.push(retryRequest);
        retryRequest.timeout = setTimeout(function () {
            if (retryRequests.indexOf(retryRequest) === -1) {
                return;
            } else {
                retryRequests.splice(retryRequests.indexOf(retryRequest), 1);
            }
            internalLoad(config, remainingAttempts);
        }, mediaPlayerModel.getRetryIntervalForType(request.type));
    }

    function internalLoad(config, remainingAttempts) {
        const request = config.request;
        const traces = [];
        let firstProgress = true;
        let needFailureReport = true;
        let requestStartTime = new Date();
        let lastTraceTime = requestStartTime;
        let lastTraceReceivedCount = 0;
        let httpRequest;

        if (!requestModifier || !metricsModel || !errHandler) {
            throw new Error('config object is not correct or missing');
        }

        const handleLoaded = function (success) {
            needFailureReport = false;

            request.requestStartDate = requestStartTime;
            request.requestEndDate = new Date();
            request.firstByteDate = request.firstByteDate || requestStartTime;

            if (!request.checkExistenceOnly) {
                metricsModel.addHttpRequest(
                    request.mediaType,
                    null,
                    request.type,
                    request.url,
                    httpRequest.response ? httpRequest.response.responseURL : null,
                    request.serviceLocation || null,
                    request.range || null,
                    request.requestStartDate,
                    request.firstByteDate,
                    request.requestEndDate,
                    httpRequest.response ? httpRequest.response.status : null,
                    request.duration,
                    httpRequest.response && httpRequest.response.getAllResponseHeaders ? httpRequest.response.getAllResponseHeaders() :
                        httpRequest.response ? httpRequest.response.responseHeaders : [],
                    success ? traces : null,
                    request.quality
                );

                if (request.type === HTTPRequest.MPD_TYPE) {
                    metricsModel.addManifestUpdate('stream', request.type, request.requestStartDate, request.requestEndDate);
                }
            }
        };

        const onloadend = function () {
            if (requests.indexOf(httpRequest) === -1) {
                return;
            } else {
                requests.splice(requests.indexOf(httpRequest), 1);
            }

            if (httpRequest.response.status >= 200 && httpRequest.response.status <= 299) {
                if (hasContentLengthMismatch(httpRequest.response)) {
                    handleLoaded(false);
                    if (remainingAttempts > 0) {
                        remainingAttempts--;
                        scheduleRetry(config, remainingAttempts, request);
                    } else {
                        errHandler.error(new DashJSError(Errors.DOWNLOAD_CONTENT_LENGTH_MISMATCH, request.url + ' has a content-length header that does not match its data length', {request: request, response: httpRequest.response}));
                    }
                } else {
                    handleLoaded(true);

                    if (config.success) {
                        config.success(httpRequest.response.response, httpRequest.response.statusText, httpRequest.response.responseURL);
                    }

                    if (config.complete) {
                        config.complete(request, httpRequest.response.statusText);
                    }
                }
            } else if (needFailureReport) {
                handleLoaded(false);

                if (remainingAttempts > 0) {
                    remainingAttempts--;
                    scheduleRetry(config, remainingAttempts, request);
                } else {
                    errHandler.downloadError(
                        downloadErrorToRequestTypeMap[request.type],
                        request.url,
                        request
                    );

                    errHandler.error(new DashJSError(newDownloadErrorToRequestTypeMap[request.type], request.url + ' is not available', {request: request, response: httpRequest.response}));

                    if (config.error) {
                        config.error(request, 'error', httpRequest.response.statusText);
                    }

                    if (config.complete) {
                        config.complete(request, httpRequest.response.statusText);
                    }
                }
            }
        };

        const progress = function (event) {
            const currentTime = new Date();

            if (firstProgress) {
                firstProgress = false;
                if (!event.lengthComputable ||
                    (event.lengthComputable && event.total !== event.loaded)) {
                    request.firstByteDate = currentTime;
                }
            }

            if (event.lengthComputable) {
                request.bytesLoaded = event.loaded;
                request.bytesTotal = event.total;
            }

            if (!event.noTrace) {
                traces.push({
                    s: lastTraceTime,
                    d: event.time ? event.time : currentTime.getTime() - lastTraceTime.getTime(),
                    b: [event.loaded ? event.loaded - lastTraceReceivedCount : 0]
                });

                lastTraceTime = currentTime;
                lastTraceReceivedCount = event.loaded;
            }

            if (config.progress && event) {
                config.progress(event);
            }
        };

        const onload = function () {
        };

        const onabort = function () {
            if (config.abort) {
                config.abort(request);
            }
        };

        const ontimeout = function (event) {
            let timeoutMessage;
            if (event.lengthComputable) {
                let percentageComplete = (event.loaded / event.total) * 100;
                timeoutMessage = 'Request timeout: loaded: ' + event.loaded + ', out of: ' + event.total + ' : ' + percentageComplete.toFixed(3) + '% Completed';
            } else {
                timeoutMessage = 'Request timeout: non-computable download size';
            }
            logger.warn(timeoutMessage);
        };

        let loader;
        if (useFetch && window.fetch && request.responseType === 'arraybuffer' && request.type === HTTPRequest.MEDIA_SEGMENT_TYPE) {
            loader = FetchLoader(context).create({
                requestModifier: requestModifier,
                boxParser: boxParser
            });
        } else {
            loader = XHRLoader(context).create({
                requestModifier: requestModifier,
                boxParser: boxParser
            });
        }

        const modifiedUrl = requestModifier.modifyRequestURL(request.url);
        const verb = request.checkExistenceOnly ? HTTPRequest.HEAD : HTTPRequest.GET;
        const withCredentials = mediaPlayerModel.getXHRWithCredentialsForType(request.type);

        httpRequest = {
            url: modifiedUrl,
            method: verb,
            withCredentials: withCredentials,
            request: request,
            onload: onload,
            onend: onloadend,
            onerror: onloadend,
            progress: progress,
            onabort: onabort,
            ontimeout: ontimeout,
            loader: loader,
            timeout: requestTimeout
        };

        // Adds the ability to delay single fragment loading time to control buffer.
        let now = new Date().getTime();
        if (isNaN(request.delayLoadingTime) || now >= request.delayLoadingTime) {
            // no delay - just send
            requests.push(httpRequest);
            loader.load(httpRequest);
        } else {
            // delay
            let delayedRequest = { httpRequest: httpRequest };
            delayedRequests.push(delayedRequest);
            delayedRequest.delayTimeout = setTimeout(function () {
                if (delayedRequests.indexOf(delayedRequest) === -1) {
                    return;
                } else {
                    delayedRequests.splice(delayedRequests.indexOf(delayedRequest), 1);
                }
                try {
                    requestStartTime = new Date();
                    lastTraceTime = requestStartTime;
                    requests.push(delayedRequest.httpRequest);
                    loader.load(delayedRequest.httpRequest);
                } catch (e) {
                    delayedRequest.httpRequest.onerror();
                }
            }, (request.delayLoadingTime - now));
        }
    }

    function hasContentLengthMismatch(response) {
        if (response && response.response && response.responseType === 'arraybuffer' && response.getResponseHeader) {
            const headerLength = response.getResponseHeader('content-length');
            const dataLength = response.response.byteLength;

            if (headerLength && dataLength && Math.abs(dataLength - headerLength) > headerLength * 0.25) {
                logger.warn('Content length doesn\'t match header\'s declared content-length at ' + response.responseURL + ' header: ' + headerLength + '; data: ' + dataLength);
                return true;
            }
        }

        return false;
    }

    /**
     * Initiates a download of the resource described by config.request
     * @param {Object} config - contains request (FragmentRequest or derived type), and callbacks
     * @memberof module:HTTPLoader
     * @instance
     */
    function load(config) {
        if (config.request) {
            internalLoad(
                config,
                mediaPlayerModel.getRetryAttemptsForType(
                    config.request.type
                )
            );
        }
    }

    /**
     * Aborts any inflight downloads
     * @memberof module:HTTPLoader
     * @instance
     */
    function abort() {
        retryRequests.forEach(t => {
            clearTimeout(t.timeout);
            // abort request in order to trigger LOADING_ABANDONED event
            if (t.config.request && t.config.abort) {
                t.config.abort(t.config.request);
            }
        });
        retryRequests = [];

        delayedRequests.forEach(x => clearTimeout(x.delayTimeout));
        delayedRequests = [];

        requests.forEach(x => {
            // abort will trigger onloadend which we don't want
            // when deliberately aborting inflight requests -
            // set them to undefined so they are not called
            x.onloadend = x.onerror = x.onprogress = undefined;
            x.loader.abort(x);
            x.onabort();
        });
        requests = [];
    }

    instance = {
        load: load,
        abort: abort
    };

    setup();

    return instance;
}

HTTPLoader.__dashjs_factory_name = 'HTTPLoader';

const factory = FactoryMaker.getClassFactory(HTTPLoader);
export default factory;
