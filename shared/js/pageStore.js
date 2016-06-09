/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};
loop.store = loop.store || {};

loop.store.PageStore = function() {
  "use strict";

  /**
   * Page store.
   *
   * @param {loop.Dispatcher} dispatcher  The dispatcher for dispatching actions
   *                                      and registering to consume actions.
   * @param {Object}          options     Options object:
   * - {DataDriver} dataDriver The driver to use for adding or removing the pages.
   */
  var PageStore = loop.store.createStore({
    initialize(options = {}) {
      if (!options.dataDriver) {
        throw new Error("Missing option dataDriver");
      }

      this._dataDriver = options.dataDriver;
    },

    getInitialStoreState() {
      return {
        pages: []
      };
    },

    actions: [
      "addPage",
      "addedPage",
      "deletePage",
      "deletedPage",
      "updateRoomInfo"
    ],

    /**
     * Handle UpdateRoomInfo action by saving the id for the current user.
     */
    updateRoomInfo({ userId }) {
      this._currentUserId = userId;
    },

    /**
     * Handle AddPage action by saving the specific page.
     */
    addPage(actionData) {
      let pageRecord = {
        userId: actionData.userId,
        metadata: actionData.metadata
      };

      this._dataDriver.addPage(pageRecord);
    },

    /**
     * Handle AddedPage action by updating the store state.
     */
    addedPage(actionData) {
      let page = {
        id: actionData.pageId,
        title: actionData.title,
        description: actionData.description,
        favicon_url: actionData.favicon_url,
        images: actionData.images,
        url: actionData.url,
        userId: actionData.userId
      };

      this._storeState.pages.push(page);
      this.setStoreState({
        pages: this._storeState.pages
      });
    },

    /**
     * Handle DeletePage action by deleting the specific page.
     */
    deletePage(actionData) {
      this._dataDriver.deletedPage(actionData.pageId);
    },

    /**
     * Handle DeletedPage action by updating the stroe state.
     */
    deletedPage(actionData) {
      let pages = this._storeState.pages;
      pages = pages.filter(page => page.id !== actionData.pageId);
console.info(pages);
      this.setStoreState({ pages });
    }
  });

  return PageStore;
}();
