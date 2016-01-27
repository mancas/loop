/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};
loop.store = loop.store || {};

loop.store.RemoteCursorStore = (function() {
  "use strict";

  var CURSOR_MESSAGE_TYPES = loop.shared.utils.CURSOR_MESSAGE_TYPES;

  /**
   * A store to handle remote cursors events.
   */
  var RemoteCursorStore = loop.store.createStore({
    actions: [],

    /**
     * Initializes the store.
     *
     * @param  {Object} options An object containing options for this store.
     *                          It should consist of:
     *                          - sdkDriver: The sdkDriver to use for sending
     *                                       the cursor events.
     */
    initialize: function(options) {
      options = options || {};

      if (!options.sdkDriver) {
        throw new Error("Missing option sdkDriver");
      }

      this._sdkDriver = options.sdkDriver;
      loop.subscribe("CursorPositionChange", this._cursorPositionChangeListener.bind(this));
    },

    /**
     * Sends cursor position through the sdk.
     *
     * @param {Object} event An object containing the cursor position in percentage
     *                       It should contains:
     *                       - deltaX: Left position
     *                       - deltaY: Top position
     *                       - width: Real width of the video stream
     *                       - height: Real height of the video stream
     */
    _cursorPositionChangeListener: function(event) {
      // TODO: send data through sdk
    }
  });

  return RemoteCursorStore;
})();
