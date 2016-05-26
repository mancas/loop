/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};
loop.store = loop.store || {};

loop.store.ParticipantStore = (function() {
  "use strict";

  const PARTICIPANT_SCHEMA = {
    name: "",
    isHere: false,
    localPingTime: null
  };

  /**
   * Participant store.
   *
   * @param {loop.Dispatcher} dispatcher  The dispatcher for dispatching actions
   *                                      and registering to consume actions.
   */
  var ParticipantStore = loop.store.createStore({
    getInitialStoreState: function() {
      return {
        participants: new Map()
      };
    },

    actions: [
      "updatedParticipant",
      "updatedPresence"
    ],

    /**
     * Checks if the room is empty or has participants.
     */
    _hasParticipants: function() {
      return this._storeState.participants.size > 0;
    },

    updatedParticipant: function(actionData) {
      this._updateParticipantData(actionData.userId, {
        name: actionData.name
      });
    },

    updatedPresence: function(actionData) {
      this._updateParticipantData(actionData.userId, {
        isHere: actionData.isHere,
        localPingTime: Date.now() - actionData.pingedAgo
      });
    },

    _updateParticipantData: function(userId, updatedData) {
      let updatedParticipant = this._storeState.participants.get(userId);
      if (!updatedParticipant) {
        updatedParticipant = _.extend({}, PARTICIPANT_SCHEMA);
      }

      for (let key in updatedData) {
        if (updatedParticipant.hasOwnProperty(key)) {
          updatedParticipant[key] = updatedData[key];
        }
      }

      this.setStoreState({
        participants: this._storeState.participants.set(userId, updatedParticipant)
      });
    },

    /*
     * Gets the online participants in the room taking into account
     * unexpected disconnects/leaves
     */
    getOnlineParticipants: function() {
      let participants = this._storeState.participants;
      let onlineParticipants = [];
      participants.forEach(function(participant) {
        // XXX akita: Max ping time allowed is not defined yet (1 minute by default)
        // If you change the timeout, don't forget to update the test
        if (participant.isHere && Date.now() - participant.localPingTime <= 60000) {
          onlineParticipants.push(participant);
        }
      });

      return onlineParticipants;
    }
  });

  return ParticipantStore;

})();
