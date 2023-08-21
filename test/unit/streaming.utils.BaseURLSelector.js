import BaseURLSelector from '../../src/streaming/utils/BaseURLSelector';
import Constants from '../../src/streaming/constants/Constants';
import EventBus from '../../src/core/EventBus';
import BaseURL from '../../src/dash/vo/BaseURL';
import Settings from '../../src/core/Settings';
import Events from '../../src/core/events/Events';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;

chai.use(spies);

const context = {};
const baseURLSelector = BaseURLSelector(context).create();
const eventBus = EventBus(context).getInstance();
const settings = Settings(context).getInstance();

describe('BaseURLSelector', function () {
    it('should throw an error when chooseSelector is called and parameter is not a boolean', function () {
        expect(baseURLSelector.chooseSelector.bind()).to.be.throw(Constants.BAD_ARGUMENT_ERROR);
    });

    it('should return an undefined selector when select is called with no data parameter', function () {
        const selector = baseURLSelector.select();

        expect(selector).to.be.undefined; // jshint ignore:line
    });

    it('should trigger an event when a base url has been selected with no content steering', function () {
        const spy = chai.spy();
        settings.update({streaming: { applyContentSteering: false }});
        const data = {
            baseUrls: [
                new BaseURL('http://www.example.com/', 'SERVICE_LOCATION')
            ],
            selectedIdx: NaN
        }

        eventBus.on(Events.BASEURL_SELECTED, spy);

        baseURLSelector.select(data)

        expect(spy).to.have.been.called.once;

        eventBus.off(Events.BASEURL_SELECTED, spy);
    })
});