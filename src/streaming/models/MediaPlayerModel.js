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
import UTCTiming from '../../dash/vo/UTCTiming';
import FactoryMaker from '../../core/FactoryMaker';
import Constants from '../constants/Constants';
import ABRRulesCollection from '../rules/abr/ABRRulesCollection';
import Settings from '../../core/Settings';
import {checkParameterType} from '../utils/SupervisorTools';


const DEFAULT_MIN_BUFFER_TIME = 12;
const DEFAULT_MIN_BUFFER_TIME_FAST_SWITCH = 20;

const DEFAULT_LOW_LATENCY_LIVE_DELAY = 3.0;
const LOW_LATENCY_REDUCTION_FACTOR = 10;
const LOW_LATENCY_MULTIPLY_FACTOR = 5;
const DEFAULT_LIVE_LATENCY_CATCHUP_THRESHOLD_FACTOR = 4;
const MINIMUM_LIVE_LATENCY_CATCHUP = 5;

const DEFAULT_XHR_WITH_CREDENTIALS = false;

function MediaPlayerModel() {

    let instance,
        UTCTimingSources,
        xhrWithCredentials,
        customABRRule;

    const context = this.context;
    const settings = Settings(context).getInstance();

    function setup() {
        UTCTimingSources = [];
        xhrWithCredentials = {
            default: DEFAULT_XHR_WITH_CREDENTIALS
        };
        customABRRule = [];
    }

    //TODO Should we use Object.define to have setters/getters? makes more readable code on other side.
    function findABRCustomRuleIndex(rulename) {
        let i;
        for (i = 0; i < customABRRule.length; i++) {
            if (customABRRule[i].rulename === rulename) {
                return i;
            }
        }
        return -1;
    }

    function getABRCustomRules() {
        return customABRRule;
    }

    function addABRCustomRule(type, rulename, rule) {
        if (typeof type !== 'string' || (type !== ABRRulesCollection.ABANDON_FRAGMENT_RULES && type !== ABRRulesCollection.QUALITY_SWITCH_RULES) ||
            typeof rulename !== 'string') {
            throw Constants.BAD_ARGUMENT_ERROR;
        }
        let index = findABRCustomRuleIndex(rulename);
        if (index === -1) {
            // add rule
            customABRRule.push({
                type: type,
                rulename: rulename,
                rule: rule
            });
        } else {
            // update rule
            customABRRule[index].type = type;
            customABRRule[index].rule = rule;
        }
    }

<<<<<<< HEAD
    function removeABRCustomRule(rulename) {
        if (rulename) {
            let index = findABRCustomRuleIndex(rulename);
            //if no rulename custom rule has been found, do nothing
            if (index !== -1) {
                // remove rule
                customABRRule.splice(index, 1);
            }
        } else {
            //if no rulename is defined, remove all ABR custome rules
            customABRRule = [];
=======
    /**
     * Checks the supplied min playback rate is a valid vlaue and within supported limits
     * @param {number} rate - Supplied min playback rate
     * @param {boolean} log - wether to shown warning or not
     * @returns {number} corrected min playback rate
     */
    function _checkMinPlaybackRate (rate, log) {
        if (isNaN(rate)) return 0;
        if (rate > 0) {
            if (log) {
                logger.warn(`Supplied minimum playback rate is a positive value when it should be negative or 0. The supplied rate will not be applied and set to 0: 100% playback speed.`)
            }
            return 0;
        }
        if (rate < CATCHUP_PLAYBACK_RATE_MIN_LIMIT) {
            if (log) {
                logger.warn(`Supplied minimum playback rate is out of range and will be limited to ${CATCHUP_PLAYBACK_RATE_MIN_LIMIT}: ${CATCHUP_PLAYBACK_RATE_MIN_LIMIT * 100}% playback speed.`);
            }
            return CATCHUP_PLAYBACK_RATE_MIN_LIMIT;
        }
        return rate;
    };

    /**
     * Checks the supplied max playback rate is a valid vlaue and within supported limits
     * @param {number} rate - Supplied max playback rate
     * @param {boolean} log - wether to shown warning or not
     * @returns {number} corrected max playback rate
     */
    function _checkMaxPlaybackRate (rate, log) {
        if (isNaN(rate)) return 0;
        if (rate < 0) {
            if (log) {
                logger.warn(`Supplied maximum playback rate is a negative value when it should be negative or 0. The supplied rate will not be applied and set to 0: 100% playback speed.`)
            }
            return 0;
        }
        if (rate > CATCHUP_PLAYBACK_RATE_MAX_LIMIT) {
            if (log) {
                logger.warn(`Supplied maximum playback rate is out of range and will be limited to ${CATCHUP_PLAYBACK_RATE_MAX_LIMIT}: ${(1 + CATCHUP_PLAYBACK_RATE_MAX_LIMIT) * 100}% playback speed.`);
            }
            return CATCHUP_PLAYBACK_RATE_MAX_LIMIT;
        }
        return rate;
    };

    /**
     * Returns the maximum drift allowed before applying a seek back to the live edge when the catchup mode is enabled
     * @return {number}
     */
    function getCatchupMaxDrift() {
        if (!isNaN(settings.get().streaming.liveCatchup.maxDrift) && settings.get().streaming.liveCatchup.maxDrift > 0) {
            return settings.get().streaming.liveCatchup.maxDrift;
        }

        const serviceDescriptionSettings = serviceDescriptionController.getServiceDescriptionSettings();
        if (serviceDescriptionSettings && serviceDescriptionSettings.liveCatchup && !isNaN(serviceDescriptionSettings.liveCatchup.maxDrift) && serviceDescriptionSettings.liveCatchup.maxDrift > 0) {
            return serviceDescriptionSettings.liveCatchup.maxDrift;
        }

        return DEFAULT_CATCHUP_MAX_DRIFT;
    }

    /**
     * Returns the minimum and maximum playback rates to be used when applying the catchup mechanism
     * If only one of the min/max values has been set then the other will default to 0 (no playback rate change).
     * @return {number}
     */
    function getCatchupPlaybackRates(log) {
        const settingsPlaybackRate = settings.get().streaming.liveCatchup.playbackRate;

        if(!isNaN(settingsPlaybackRate.min) || !isNaN(settingsPlaybackRate.max)) {
            return {
                min: _checkMinPlaybackRate(settingsPlaybackRate.min, log),
                max: _checkMaxPlaybackRate(settingsPlaybackRate.max, log),
            }
        }

        const serviceDescriptionSettings = serviceDescriptionController.getServiceDescriptionSettings();
        if (serviceDescriptionSettings && serviceDescriptionSettings.liveCatchup && (!isNaN(serviceDescriptionSettings.liveCatchup.playbackRate.min) || !isNaN(serviceDescriptionSettings.liveCatchup.playbackRate.max))) {
            const sdPlaybackRate = serviceDescriptionSettings.liveCatchup.playbackRate;
            return {
                min: _checkMinPlaybackRate(sdPlaybackRate.min, log),
                max: _checkMaxPlaybackRate(sdPlaybackRate.max, log),
            }
        }

        return {
            min: DEFAULT_CATCHUP_PLAYBACK_RATE_MIN,
            max: DEFAULT_CATCHUP_PLAYBACK_RATE_MAX
>>>>>>> 990c1f535 (Split stableBufferTime into hybridSwitchBufferTime and stableBufferTime)
        }
    }

    function getInitialBufferLevel() {
        const initialBufferLevel = settings.get().streaming.buffer.initialBufferLevel;

        if (isNaN(initialBufferLevel) || initialBufferLevel < 0) {
            return 0;
        }

        return Math.min(getStableBufferTime(), initialBufferLevel);
    }

    function getStableBufferTime() {
        if (settings.get().streaming.lowLatencyEnabled) {
            return getLiveDelay();
        }

        const stableBufferTime = settings.get().streaming.buffer.stableBufferTime;
        return stableBufferTime > -1 ? stableBufferTime : settings.get().streaming.buffer.fastSwitchEnabled ? DEFAULT_MIN_BUFFER_TIME_FAST_SWITCH : DEFAULT_MIN_BUFFER_TIME;
    }

<<<<<<< HEAD
=======
    /**
     * Returns the buffer time that the hybrid rule will switch between throughput and BOLA at.
     * @returns {number}
     */
    function getHybridSwitchBufferTime() {
        return settings.get().streaming.hybridSwitchBufferTime || DEFAULT_HYBRID_SWITCH_TIME;
    }

    /**
     * Returns the number of retry attempts for a specific media type
     * @param type
     * @return {number}
     */
>>>>>>> 990c1f535 (Split stableBufferTime into hybridSwitchBufferTime and stableBufferTime)
    function getRetryAttemptsForType(type) {
        const lowLatencyMultiplyFactor = !isNaN(settings.get().streaming.retryAttempts.lowLatencyMultiplyFactor) ? settings.get().streaming.retryAttempts.lowLatencyMultiplyFactor : LOW_LATENCY_MULTIPLY_FACTOR;

        return settings.get().streaming.lowLatencyEnabled ? settings.get().streaming.retryAttempts[type] * lowLatencyMultiplyFactor : settings.get().streaming.retryAttempts[type];
    }

    function getRetryIntervalsForType(type) {
        const lowLatencyReductionFactor = !isNaN(settings.get().streaming.retryIntervals.lowLatencyReductionFactor) ? settings.get().streaming.retryIntervals.lowLatencyReductionFactor : LOW_LATENCY_REDUCTION_FACTOR;

        return settings.get().streaming.lowLatencyEnabled ? settings.get().streaming.retryIntervals[type] / lowLatencyReductionFactor : settings.get().streaming.retryIntervals[type];
    }

    function getLiveDelay() {
        if (settings.get().streaming.lowLatencyEnabled) {
            return settings.get().streaming.delay.liveDelay || DEFAULT_LOW_LATENCY_LIVE_DELAY;
        }
        return settings.get().streaming.delay.liveDelay;
    }

    function getLiveCatchupLatencyThreshold() {
        try {
            const liveCatchupLatencyThreshold = settings.get().streaming.liveCatchup.latencyThreshold;
            const liveDelay = getLiveDelay();

            if (liveCatchupLatencyThreshold !== null && !isNaN(liveCatchupLatencyThreshold)) {
                return Math.max(liveCatchupLatencyThreshold, liveDelay);
            }


            const liveCatchupMinDrift = settings.get().streaming.liveCatchup.minDrift;
            const maximumLiveDelay = !isNaN(liveDelay) && liveDelay ? !isNaN(liveCatchupMinDrift) ? settings.get().streaming.liveCatchup.minDrift + getLiveDelay() : getLiveDelay() : NaN;

            if (maximumLiveDelay && !isNaN(maximumLiveDelay)) {
                return Math.max(maximumLiveDelay * DEFAULT_LIVE_LATENCY_CATCHUP_THRESHOLD_FACTOR, MINIMUM_LIVE_LATENCY_CATCHUP);
            }

            return NaN;

        } catch (e) {
            return NaN;
        }
    }

    function addUTCTimingSource(schemeIdUri, value) {
        removeUTCTimingSource(schemeIdUri, value); //check if it already exists and remove if so.
        let vo = new UTCTiming();
        vo.schemeIdUri = schemeIdUri;
        vo.value = value;
        UTCTimingSources.push(vo);
    }

    function getUTCTimingSources() {
        return UTCTimingSources;
    }

    function removeUTCTimingSource(schemeIdUri, value) {
        checkParameterType(schemeIdUri, 'string');
        checkParameterType(value, 'string');
        UTCTimingSources.forEach(function (obj, idx) {
            if (obj.schemeIdUri === schemeIdUri && obj.value === value) {
                UTCTimingSources.splice(idx, 1);
            }
        });
    }

    function clearDefaultUTCTimingSources() {
        UTCTimingSources = [];
    }

    function restoreDefaultUTCTimingSources() {
        let defaultUtcTimingSource = settings.get().streaming.utcSynchronization.defaultTimingSource;
        addUTCTimingSource(defaultUtcTimingSource.scheme, defaultUtcTimingSource.value);
    }

    function setXHRWithCredentialsForType(type, value) {
        if (!type) {
            Object.keys(xhrWithCredentials).forEach(key => {
                setXHRWithCredentialsForType(key, value);
            });
        } else {
            xhrWithCredentials[type] = !!value;
        }
    }

    function getXHRWithCredentialsForType(type) {
        const useCreds = xhrWithCredentials[type];

        return useCreds === undefined ? xhrWithCredentials.default : useCreds;
    }

    function getDefaultUtcTimingSource() {
        return settings.get().streaming.utcSynchronization.defaultTimingSource;
    }

    function reset() {
        //TODO need to figure out what props to persist across sessions and which to reset if any.
        //setup();
    }

    instance = {
        getABRCustomRules,
        addABRCustomRule,
        removeABRCustomRule,
        getStableBufferTime,
        getHybridSwitchBufferTime,
        getInitialBufferLevel,
        getRetryAttemptsForType,
        getRetryIntervalsForType,
        getLiveDelay,
        getLiveCatchupLatencyThreshold,
        addUTCTimingSource,
        removeUTCTimingSource,
        getUTCTimingSources,
        clearDefaultUTCTimingSources,
        restoreDefaultUTCTimingSources,
        setXHRWithCredentialsForType,
        getXHRWithCredentialsForType,
        getDefaultUtcTimingSource,
        reset
    };

    setup();

    return instance;
}

//TODO see if you can move this and not export and just getter to get default value.
MediaPlayerModel.__dashjs_factory_name = 'MediaPlayerModel';
export default FactoryMaker.getSingletonFactory(MediaPlayerModel);
