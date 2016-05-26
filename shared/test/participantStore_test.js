/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

describe("loop.store.ParticipantStore", function() {
  "use strict";

  var expect = chai.expect;
  var sandbox, dispatcher, store, now;

  beforeEach(function() {
    sandbox = LoopMochaUtils.createSandbox();

    dispatcher = new loop.Dispatcher();
    sandbox.stub(dispatcher, "dispatch");

    now = Date.now();
    sandbox.stub(Date, "now", function() {
      return now;
    });

    store = new loop.store.ParticipantStore(dispatcher);
  });

  afterEach(function() {
    sandbox.restore();
    LoopMochaUtils.restore();
  });

  describe("#getInitialStoreState", function() {
    it("should return an object with a property called participants", function() {
      let initialState = store.getInitialStoreState();

      expect(initialState.participants).not.eql(null);
    });
  });

  describe("updatedParticipant", function() {
    it("should store the participant", function() {
      let action = {
        userId: "fakeID",
        name: "fakeName"
      };

      let participants = store.getStoreState("participants");
      store.updatedParticipant(action);
      expect(participants.get("fakeID")).not.eql(undefined);
      expect(participants.get("fakeID")).eql({
        name: "fakeName",
        isHere: false,
        localPingTime: null
      });
    });
  });

  describe("_hasParticipants", function() {
    beforeEach(function() {
      let currentParticipants = store.getStoreState("participants");
      store.setStoreState({
        participants: currentParticipants.set("fakeID", {
          name: "Cool Name",
          isHere: false,
          localPingTime: null
        })
      });
    });

    it("should check if the room has participants", function() {
      let hasParticipants = store._hasParticipants();

      expect(hasParticipants).eql(true);
    });
  });

  describe("updatedPresence", function() {
    beforeEach(function() {
      let currentParticipants = store.getStoreState("participants");
      store.setStoreState({
        participants: currentParticipants.set("fakeID", {
          name: "Cool Name",
          isHere: false,
          localPingTime: null
        })
      });
    });

    it("should store the participant presence data", function() {
      let action = {
        userId: "fakeID",
        isHere: true,
        pingedAgo: now - 1000
      };

      let participants = store.getStoreState("participants");
      store.updatedPresence(action);
      expect(participants.get("fakeID").isHere).eql(true);
      expect(participants.get("fakeID").localPingTime).eql(1000);
    });
  });

  describe("getOnlineParticipants", function() {
    beforeEach(function() {
      let currentParticipants = store.getStoreState("participants");
      currentParticipants.set("fakeID", {
          name: "Cool Name",
          isHere: false,
          localPingTime: null
      });
      currentParticipants.set("fakeID2", {
        name: "Cool Name",
        isHere: true,
        localPingTime: now
      });
      store.setStoreState({
        participants: currentParticipants
      });
    });

    it("should return the participants that are online in the room", function() {
      let onlineParticipants = store.getOnlineParticipants();
      expect(onlineParticipants.length).eql(1);
    });

    it("should not return participants whose pingTime has not been updated recently", function() {
      let currentParticipants = store.getStoreState("participants");
      currentParticipants.set("fakeID2", {
        name: "Cool Name",
        isHere: true,
        localPingTime: 120000
      });

      store.setStoreState({
        participants: currentParticipants
      });

      let onlineParticipants = store.getOnlineParticipants();
      expect(onlineParticipants.length).eql(0);
    });
  });
});
