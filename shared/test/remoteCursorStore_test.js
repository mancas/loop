/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

describe("loop.store.RemoteCursorStore", function() {
  "use strict";

  var expect = chai.expect;
  var sharedActions = loop.shared.actions;
  var sharedUtils = loop.shared.utils;
  var CURSOR_MESSAGE_TYPES = loop.shared.utils.CURSOR_MESSAGE_TYPES;
  var sandbox, dispatcher, store, fakeSdkDriver, requestStubs;

  beforeEach(function() {
    sandbox = LoopMochaUtils.createSandbox();

    LoopMochaUtils.stubLoopRequest(requestStubs = {
      GetLoopPref: sinon.stub(),
    });

    dispatcher = new loop.Dispatcher();
    sandbox.stub(dispatcher, "dispatch");

    fakeSdkDriver = {
      sendCursorMessage: sinon.stub(),
    };

    store = new loop.store.RemoteCursorStore(dispatcher, {
      sdkDriver: fakeSdkDriver
    });
  });

  afterEach(function() {
    sandbox.restore();
    LoopMochaUtils.restore();
  });

  describe("#constructor", function() {
    it("should throw an error if sdkDriver is missing", function() {
      expect(function() {
        new loop.store.RemoteCursorStore(dispatcher, {});
      }).to.Throw(/sdkDriver/);
    });

    it("should add a CursorPositionChange event listener", function() {
      sandbox.stub(loop, "subscribe");
      new loop.store.RemoteCursorStore(dispatcher, {sdkDriver: fakeSdkDriver});
      sinon.assert.calledOnce(loop.subscribe);
      sinon.assert.calledWith(loop.subscribe, "CursorPositionChange");
    });
  });

  describe("#_cursorPositionChangeListener", function() {
    it("should send cursor data through the sdk", function() {
      var fakeEvent = {
        deltaX: 10,
        deltaY: 10,
        width: 100,
        height: 100
      };

      LoopMochaUtils.publish("CursorPositionChange", fakeEvent);

      sinon.assert.calledOnce(fakeSdkDriver.sendCursorMessage);
      sinon.assert.calledWith(fakeSdkDriver.sendCursorMessage, {
        type: CURSOR_MESSAGE_TYPES.POSITION,
        top: fakeEvent.deltaY,
        left: fakeEvent.deltaX,
        width: fakeEvent.width,
        height: fakeEvent.height
      });
    });
  });

  describe("#receivedCursorData", function() {
    it("should save the state", function() {
      store.receivedCursorData(new sharedActions.ReceivedCursorData({
        type: CURSOR_MESSAGE_TYPES.POSITION,
        top: 10,
        left: 10,
        width: 100,
        height: 100
      }));

      expect(store.getStoreState().remoteCursorPosition).eql({
        top: 10,
        left: 10,
        width: 100,
        height: 100
      });
    });
  });
});
