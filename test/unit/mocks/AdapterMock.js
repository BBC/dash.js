function AdapterMock () {
    this.metricsList = {
        BUFFER_STATE: 'BUFFER_STATE'
    };

    this.getSuggestedPresentationDelay = function () {
        return null;
    };

    this.getAvailabilityStartTime = function () {
        return null;
    };

    this.getRealAdaptation = function () {
        return null;
    };

    this.getEventsFor = function () {
        return [];
    };

    this.getAllMediaInfoForType = function () {
        return [{codec: 'audio/mp4;codecs="mp4a.40.2"', id: undefined, index: 0, isText: false, lang: 'eng',mimeType: 'audio/mp4', roles: ['main']},
                {codec: 'audio/mp4;codecs="mp4a.40.2"', id: undefined, index: 1, isText: false, lang: 'deu',mimeType: 'audio/mp4', roles: ['main']}];
    };

    this.getDataForMedia = function () {
        return {};
    };

    this.getMediaInfoForType = function () {
        return {};
    };

    this.getStreamsInfo = function () {
        return [];
    };

    this.setRepresentation = function (res) {
        this.representation = res;
    };

    this.getVoRepresentations = function () {
        if (this.representation) {
            return [this.representation];
        } else {
            return [];
        }
    };

    this.getAdaptationForType = function () {
        return {
            Representation: [
                {
                    width: 500,
                    bandwidth: 1000
                },
                {
                    width: 750,
                    bandwidth: 2000
                },
                {
                    width: 900,
                    bandwidth: 3000
                },
                {
                    width: 900,
                    bandwidth: 3500
                },
                {
                    width: 900,
                    bandwidth: 4000
                }
            ]
        };
    };

    this.getIsTextTrack = function () {
        return false;
    };

    this.getBaseURLsFromElement = function () {
        return [];
    };

    this.getRepresentationSortFunction = function () {
        // Return a silly sort function
        return function () { return 0; };
    };

    this.getManifestUpdatePeriod = function () {
        return 0;
    };

    this.updatePeriods = function () {
    };

    this.getUseCalculatedLiveEdgeTimeForMediaInfo = function () {
        return false;
    };

    this.getUTCTimingSources = function () {
        return [];
    };

    this.getIsDynamic = function () {
        return false;
    };

    this.getIsDVB = function () {
        return false;
    };

    this.convertDataToRepresentationInfo = function () {
        return null;
    };

    this._mockDuration = NaN;

    this.getDuration = function () {
        return this._mockDuration;
    };
}

export default AdapterMock;
