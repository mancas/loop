/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
var loop = loop || {};

loop.roomToc = (function(mozL10n) {
  "use strict";
  var tocViews = loop.shared.toc;
  var sharedActions = loop.shared.actions;
  var sharedUtils = loop.shared.utils;

  function init() {
    loop.shared.utils.getBoolPreference = function foo() {};

    var requests = [
      ["GetAllConstants"],
      ["GetAllStrings"],
      ["GetLocale"],
      ["GetLoopPref", "ot.guid"]
    ];

    loop.requestMulti.apply(null, requests).then(function(results) {
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

      var dispatcher = new loop.Dispatcher();
      var sdkDriver = new loop.OTSdkDriver({
        // For the standalone, always request data channels. If they aren't
        // implemented on the client, there won't be a similar message to us, and
        // we won't display the UI.
        constants: {},
        useDataChannels: true,
        dispatcher: dispatcher,
        sdk: OT
      });

      var activeRoomStore = new loop.store.ActiveRoomStore(dispatcher, {
        sdkDriver: sdkDriver
      });

      var roomStore = new loop.store.RoomStore(dispatcher, {
        constants: constants
      });

      loop.store.StoreMixin.register({
        activeRoomStore: activeRoomStore,
        roomStore: roomStore
      });

      window.addEventListener("unload", function() {
        dispatcher.dispatch(new sharedActions.WindowUnload());
      });

      ReactDOM.render(<tocViews.TableOfContentView
                        activeRoomStore={activeRoomStore}
                        dispatcher={dispatcher}
                        isScreenShareActive={false} />, document.querySelector("#main"));

      var locationData = sharedUtils.locationData();
      var hash = locationData.hash.match(/#(.*)/);

      dispatcher.dispatch(new sharedActions.SetupWindowData({
        roomToken: hash[1]
      }));
    });
  }

  return {
    init: init
  };
})(document.mozL10n);

document.addEventListener("DOMContentLoaded", loop.roomToc.init);
