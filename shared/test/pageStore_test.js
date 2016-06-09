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

    store = new loop.store.PageStore(dispatcher, {
      dataDriver: fakeDataDriver
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

  describe("updateRoomInfo", () => {
    it("should update userId", () => {
      let action = new actions.UpdateRoomInfo({
        roomUrl: "fakeurl",
        userId: "theUserId"
      });
      store.updateRoomInfo(action);

      expect(store._currentUserId).eql("theUserId");
    });
  });

  describe("AddPage", () => {
    beforeEach(() => {
      store._currentUserId = "theUserId";
    });

    it("should include the userId in page data", () => {
      let metadata = {
        description: "fakeDescription",
        favicon_url: "fakeFavicon",
        images: [{
          url: "fakeUrl"
        }],
        title: "fakeTitle",
        url: "fakeUrl"
      };
      let action = new actions.AddPage(metadata);
      store.addPage(action);

      sinon.assert.calledOnce(fakeDataDriver.addPage);
      sinon.assert.calledWithExactly(fakeDataDriver.addPage, {
        userId: "theUserId",
        metadata: metadata
      });
    });
  });
});
