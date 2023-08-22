import BlacklistController from '../../src/streaming/controllers/BlacklistController';
import EventBus from '../../src/core/EventBus';
import Settings from '../../src/core/Settings';

const chai = require('chai');
const spies = require('chai-spies');
const expect = chai.expect;

chai.use(spies);

describe('BlacklistController', function () {
    const context = {};
    const eventBus = EventBus(context).getInstance();
    const settings = Settings(context).getInstance();

    const SERVICE_LOCATION = 'testServiceLocation';
    const EVENT_NAME = 'blacklistControllerTestEvent';

    const defaultConfig = { updateEventName: '' };

    beforeEach(function () {
        settings.reset()
    })

    it('should return false when calling contains after initialisation', () => {
        const blacklistController = BlacklistController(context).create(defaultConfig);

        const contains = blacklistController.contains('test');

        expect(contains).to.be.false; // jshint ignore:line
    });

    it('should return false when calling contains with undefined', () => {
        const blacklistController = BlacklistController(context).create(defaultConfig);

        const contains = blacklistController.contains(undefined);

        expect(contains).to.be.false; // jshint ignore:line
    });

    it('should return false when calling contains with zero-length string', () => {
        const blacklistController = BlacklistController(context).create(defaultConfig);

        const contains = blacklistController.contains('');

        expect(contains).to.be.false; // jshint ignore:line
    });

    it('should return true when calling contains after calling add with same string', () => {
        const blacklistController = BlacklistController(context).create(defaultConfig);

        blacklistController.add(SERVICE_LOCATION);

        const contains = blacklistController.contains(SERVICE_LOCATION);

        expect(contains).to.be.true; // jshint ignore:line
    });

    it('should trigger an update event after calling add', () => {
        const spy = chai.spy();
        const config = { updateEventName: EVENT_NAME };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.on(EVENT_NAME, spy);

        blacklistController.add(SERVICE_LOCATION);

        expect(spy).to.have.been.called.once; // jshint ignore:line

        eventBus.off(EVENT_NAME, spy);
    });

    it('should add an entry to the blacklist on receiving load failed event', () => {
        const config = {
            updateEventName: '',
            addBlacklistEventName: EVENT_NAME
        };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.trigger(EVENT_NAME, {
            entry: SERVICE_LOCATION
        });

        const contains = blacklistController.contains(SERVICE_LOCATION);

        expect(contains).to.be.true; // jshint ignore:line
    });

    it('should not trigger an update event if a duplicate entry is added', () => {
        const spy = chai.spy();
        const config = { updateEventName: EVENT_NAME };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.on(EVENT_NAME, spy);

        blacklistController.add(SERVICE_LOCATION);
        blacklistController.add(SERVICE_LOCATION);

        expect(spy).to.have.been.called.once; // jshint ignore:line

        eventBus.off(EVENT_NAME, spy);
    });

    it('should trigger a remove event when blacklist expiry time has passed', function (done) {
        const spy = chai.spy();
        settings.update({streaming: { blacklistExpiryTime: 200 }});

        const config = { removeBlacklistEventName: EVENT_NAME, settings: settings };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.on(EVENT_NAME, spy);

        blacklistController.add(SERVICE_LOCATION);
        
        setTimeout(function () {
            expect(spy).to.have.been.called.once; // jshint ignore:line
            
            eventBus.off(EVENT_NAME, spy);
            done();
        }, 250)
    })

    it('should not trigger a remove event when blacklist expiry time has not been set', function (done) {
        const spy = chai.spy();
        const config = { removeBlacklistEventName: EVENT_NAME, settings: settings };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.on(EVENT_NAME, spy);

        blacklistController.add(SERVICE_LOCATION);
        
        setTimeout(function () {
            expect(spy).not.to.have.been.called.once; // jshint ignore:line
            
            eventBus.off(EVENT_NAME, spy);
            done();
        }, 250)
    })

    it('should not call blacklist expiry timers on reset', function (done) {
        const spy = chai.spy();
        settings.update({streaming: { blacklistExpiryTime: 200 }});

        const config = { removeBlacklistEventName: EVENT_NAME, settings: settings };
        const blacklistController = BlacklistController(context).create(config);

        eventBus.on(EVENT_NAME, spy);

        blacklistController.add(SERVICE_LOCATION);

        blacklistController.reset();
        
        setTimeout(function () {
            expect(spy).not.to.have.been.called.once; // jshint ignore:line
            
            eventBus.off(EVENT_NAME, spy);
            done();
        }, 250)
    })

    it('should not contain an entry after reset', () => {
        const config = { updateEventName: '' };
        const blacklistController = BlacklistController(context).create(config);

        blacklistController.add(SERVICE_LOCATION);
        const containsBeforeReset = blacklistController.contains(SERVICE_LOCATION);
        blacklistController.reset();
        const containsAfterReset = blacklistController.contains(SERVICE_LOCATION);

        expect(containsBeforeReset).to.be.true; // jshint ignore:line
        expect(containsAfterReset).to.be.false; // jshint ignore:line
    });
});
