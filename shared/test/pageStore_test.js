/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

describe("loop.store.PageStore", () => {
  "use strict";

  let { expect } = chai;
  let { actions } = loop.shared;
  let dispatcher, fakeDataDriver, sandbox, store;

  beforeEach(() => {
    sandbox = LoopMochaUtils.createSandbox();

    dispatcher = new loop.Dispatcher();
    sandbox.stub(dispatcher, "dispatch");

    fakeDataDriver = {
      addPage: sinon.stub(),
      deletePage: sinon.stub()
    };

    store = new loop.store.ParticipantStore(dispatcher, {
      dataDriver: fakeDataDriver,
      updateParticipant: true
    });
  });

  afterEach(() => {
    sandbox.restore();
    LoopMochaUtils.restore();
  });

  describe("#getInitialStoreState", () => {
    it("should return an object with a property called pages", () => {
      let initialState = store.getInitialStoreState();

      expect(initialState.pages).not.eql(null);
    });
  });
});
