/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};

loop.sidebar = (function(mozL10n) {
  "use strict";

  var ROOM_STATES = loop.store.ROOM_STATES;
  var sharedActions = loop.shared.actions;
  var sharedUtils = loop.shared.utils;

  var SidebarControllerView = React.createClass({
    mixins: [
      Backbone.Events,
      loop.store.StoreMixin("activeRoomStore")
    ],

    propTypes: {
      cursorStore: React.PropTypes.instanceOf(loop.store.RemoteCursorStore).isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      participantStore: React.PropTypes.instanceOf(loop.store.ParticipantStore).isRequired
    },

    componentWillMount: function() {
      this.listenTo(this.props.cursorStore, "change:remoteCursorPosition",
                    this._onRemoteCursorPositionChange);
      this.listenTo(this.props.cursorStore, "change:remoteCursorClick",
                    this._onRemoteCursorClick);
    },

    _onRemoteCursorPositionChange: function() {
      loop.request("AddRemoteCursorOverlay",
                   this.props.cursorStore.getStoreState("remoteCursorPosition"));
    },

    _onRemoteCursorClick: function() {
      let click = this.props.cursorStore.getStoreState("remoteCursorClick");
      // If the click is 'false', assume it is a storeState reset,
      // so don't do anything.
      if (!click) {
        return;
      }

      this.props.cursorStore.setStoreState({
        remoteCursorClick: false
      });

      loop.request("ClickRemoteCursor", click);
    },

    getInitialState: function() {
      return this.getStoreState();
    },

    render: function() {
      if (this.state.roomState === ROOM_STATES.GATHER) {
        return null;
      }

      return (
         <DesktopSidebarView
           dispatcher={this.props.dispatcher}
           participantStore={this.props.participantStore} />
      );
    }
  });

  var DesktopSidebarView = React.createClass({
    mixins: [loop.store.StoreMixin("activeRoomStore")],

    propTypes: {
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      participantStore: React.PropTypes.instanceOf(loop.store.ParticipantStore).isRequired
    },

    getInitialState: function() {
      return this.getStoreState();
    },

    leaveRoom: function() {
      this.props.dispatcher.dispatch(new sharedActions.LeaveRoom());
    },

    /**
     * Checks if current room is active.
     *
     * @return {Boolean}
     */
    _roomIsActive: function() {
      return this.state.roomState === ROOM_STATES.JOINED ||
             this.state.roomState === ROOM_STATES.SESSION_CONNECTED ||
             this.state.roomState === ROOM_STATES.HAS_PARTICIPANTS;
    },

    render: function() {
      return (
        <loop.shared.toc.SidebarView
          activeRoomStore={this.getStore()}
          audio={{ enabled: !this.state.audioMuted,
                   visible: this._roomIsActive() }}
          dispatcher={this.props.dispatcher}
          introSeen={true}
          isFirefox={true}
          leaveRoom={this.leaveRoom}
          participantStore={this.props.participantStore}
          video={{ enabled: !this.state.videoMuted,
                   visible: this._roomIsActive() }} />
      );
    }
  });

  function init() {
    // Obtain the windowId and pass it through
    var locationHash = sharedUtils.locationData().hash;
    var roomToken;

    var hash = locationHash.match(/#(.*)/);
    if (hash) {
      roomToken = hash[1];
    }

    var requests = [
      ["GetAllConstants"],
      ["GetAllStrings"],
      ["GetLocale"],
      ["GetLoopPref", "ot.guid"]
    ];

    return loop.requestMulti.apply(null, requests).then(function(results) {
      // `requestIdx` is keyed off the order of the `requests` and `prefetch`
      // arrays. Be careful to update both when making changes.
      var requestIdx = 0;
      var constants = results[requestIdx];

      // Do the initial L10n setup, we do this before anything
      // else to ensure the L10n environment is setup correctly.
      var stringBundle = results[++requestIdx];
      var locale = results[++requestIdx];
      mozL10n.initialize({
        locale: locale,
        getStrings: function(key) {
          if (!(key in stringBundle)) {
            console.error("No string found for key: ", key);
            return JSON.stringify({ textContent: "foo" });
          }

          return JSON.stringify({ textContent: stringBundle[key] });
        }
      });

      // Plug in an alternate client ID mechanism, as localStorage and cookies
      // don't work in about:pages
      var currGuid = results[++requestIdx];
      window.OT.overrideGuidStorage({
        get: function(callback) {
          callback(null, currGuid);
        },
        set: function(guid, callback) {
          // See nsIPrefBranch
          var PREF_STRING = 32;
          currGuid = guid;
          loop.request("SetLoopPref", "ot.guid", guid, PREF_STRING);
          callback(null);
        }
      });

      var dispatcher = new loop.Dispatcher();
      var sdkDriver = new loop.OTSdkDriver({
        constants: constants,
        isDesktop: true,
        useDataChannels: true,
        dispatcher: dispatcher,
        sdk: OT
      });
      let dataDriver = new loop.DataDriver({ dispatcher });

      // expose for functional tests
      loop.sidebar._sdkDriver = sdkDriver;

      var activeRoomStore = new loop.store.ActiveRoomStore(dispatcher, {
        sdkDriver: sdkDriver
      });

      var serverConnectionStore = new loop.store.ServerConnectionStore(dispatcher, {});

      let participantStore = new loop.store.ParticipantStore(dispatcher, {
        dataDriver,
        updateParticipant: true
      });

      var textChatStore = new loop.store.TextChatStore(dispatcher, {
        dataDriver: dataDriver
      });
      let remoteCursorStore = new loop.store.RemoteCursorStore(dispatcher, {
        sdkDriver
      });
      let pageStore = new loop.store.PageStore(dispatcher, {
        dataDriver
      });

      // Load the username from storage, or fallback to "Room Owner"
      loop.request("GetLoopPref", "username").then(storedName => {
          let username = storedName || "Room Owner"; // XXX akita localize this
          dispatcher.dispatch(
            new sharedActions.SetOwnDisplayName({
              displayName: username
            }));
        });

      loop.store.StoreMixin.register({
        activeRoomStore,
        pageStore,
        participantStore,
        remoteCursorStore,
        serverConnectionStore,
        textChatStore
      });

      window.addEventListener("unload", function() {
        dispatcher.dispatch(new sharedActions.WindowUnload());
      });

      ReactDOM.render(<SidebarControllerView
                        cursorStore={remoteCursorStore}
                        dispatcher={dispatcher}
                        participantStore={participantStore} />, document.querySelector("#main"));

      dispatcher.dispatch(new sharedActions.SetupWindowData({
        roomToken: roomToken
      }));

      loop.request("TelemetryAddValue", "LOOP_ACTIVITY_COUNTER", constants.LOOP_MAU_TYPE.OPEN_CONVERSATION);
    });
  }

  return {
    DesktopSidebarView: DesktopSidebarView,
    init: init,
    SidebarControllerView: SidebarControllerView
  };
})(document.mozL10n);

document.addEventListener("DOMContentLoaded", loop.sidebar.init);
