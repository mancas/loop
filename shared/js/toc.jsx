/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};
loop.shared = loop.shared || {};

// XXX akita: fix hard-code string
loop.shared.toc = (function(mozL10n) {
  "use strict";

  var ROOM_INFO_FAILURES = loop.shared.utils.ROOM_INFO_FAILURES;
  var ROOM_STATES = loop.store.ROOM_STATES;
  var sharedActions = loop.shared.actions;
  var sharedMixins = loop.shared.mixins;
  var sharedViews = loop.shared.views;
  var SCREEN_SHARE_STATES = loop.shared.utils.SCREEN_SHARE_STATES;

  // XXX akita: to store mixin
  // XXX akita: make activeRoomStore just handle the A/V connections.
  var TableOfContentView = React.createClass({
    propTypes: {
      activeRoomStore: React.PropTypes.instanceOf(loop.store.ActiveRoomStore).isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      isScreenShareActive: React.PropTypes.bool.isRequired
    },

    getInitialState: function() {
      return this.props.activeRoomStore.getStoreState();
    },

    componentWillMount: function() {
      this.props.activeRoomStore.on("change", this.onStoreChange);
      // Force onStoreChange
      this.onStoreChange();
    },

    componentWillUnmount: function() {
      this.props.activeRoomStore.off("change", this.onStoreChange);
    },

    onStoreChange: function() {
      var newState = this.props.activeRoomStore.getStoreState();
      // We haven't decrypted data yet
      if (!newState.roomContextUrls) {
        return;
      }

      var tiles = [newState.roomContextUrls[0]];
      newState.tiles = tiles;
      this.setState(newState);
    },

    // XXX akita: add jsdoc
    addTile: function(url) {
      var tiles = this.state.tiles;
      tiles.push({
        location: url,
        description: url
      });

      this.setState({
        tiles: tiles
      });
    },

    render: function() {
      var cssClasses = classNames({
        "toc-wrapper": true,
        "receiving-screen-share": this.props.isScreenShareActive
      });

      return (
        <div className={cssClasses}>
          <RoomInfoBarView
            addUrlTile={this.addTile}
            dispatcher={this.props.dispatcher}
            roomName={this.state.roomName ? this.state.roomName
              : "BUG: NO NAME SPECIFIED"}
            roomToken={this.state.roomToken} />
          <RoomContentView
            tiles={this.state.tiles} />
        </div>
      );
    }
  });

  var RoomInfoBarView = React.createClass({
    propTypes: {
      addUrlTile: React.PropTypes.func.isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      roomName: React.PropTypes.string.isRequired,
      roomToken: React.PropTypes.string.isRequired
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({
        roomName: nextProps.roomName || "#ROOM NAME"
      });
    },

    componentDidUpdate: function() {
      if (this.state.editMode) {
        ReactDOM.findDOMNode(this).querySelector(".edit-room-name").focus();
      }
    },

    getInitialState: function() {
      return {
        editMode: false,
        roomName: this.props.roomName || "#ROOM NAME"
      };
    },

    // XXX akita: add jsdoc
    toggleEditMode: function() {
      this.setState({
        editMode: true
      });
    },

    /**
     * Handles a key being pressed - looking for the return key for saving
     * the new room name.
     */
    handleKeyDown: function(event) {
      if (event.which === 13) {
        this.exitEditMode();
      }
    },

    // XXX akita: add jsdoc
    exitEditMode: function() {
      this.props.dispatcher.dispatch(
        new sharedActions.UpdateRoomContext({
          roomToken: this.props.roomToken,
          newRoomName: this.state.roomName
        })
      );
      this.setState({ editMode: false });
    },

    // XXX akita: add jsdoc
    handleEditInputChange: function(event) {
      this.setState({ roomName: event.target.value });
    },

    render: function() {
      return (
        <div className="toc-room-info-bar">
          <div className="room-name">
            {
              !this.state.editMode ?
              <h1 onClick={this.toggleEditMode}>{this.state.roomName}</h1> :
              <input
                className="edit-room-name"
                onBlur={this.exitEditMode}
                onChange={this.handleEditInputChange}
                onKeyDown={this.handleKeyDown}
                type="text"
                value={this.state.roomName} />
            }
          </div>
          <RoomPresenceView />
          <RoomActionsView
            addUrlTile={this.props.addUrlTile} />
        </div>
      );
    }
  });

  // XXX akita: Make this work
  var RoomPresenceView = React.createClass({
    propTypes: {},

    render: function() {
      return (
        <div className="room-active-users">
          <div className="room-user" data-name="Pau Masiá">
            <span>{'P'}</span>
          </div>
          <div className="room-user" data-name="Manu">
            <span>{'M'}</span>
          </div>
        </div>
      );
    }
  });

  var RoomActionsView = React.createClass({
    propTypes: {
      addUrlTile: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
      return {
        showAddUrlPanel: false
      };
    },

    // XXX akita: add jsdoc
    toggleAddUrlPanel: function() {
      this.setState({
        showAddUrlPanel: !this.state.showAddUrlPanel
      });
    },

    handleAddUrlClick: function(url) {
      this.toggleAddUrlPanel();
      this.props.addUrlTile(url);
    },

    render: function() {
      return (
        <div className="room-actions-buttons">
          <div className="room-action-add-url">
            <button className="add-url" onClick={this.toggleAddUrlPanel} />
            {
              this.state.showAddUrlPanel ?
                <AddUrlPanelView
                  handleAddUrlClick={this.handleAddUrlClick} /> : null
            }
          </div>
          <div className="room-action-settings">
            <button className="settings" />
          </div>
        </div>
      );
    }
  });

  var AddUrlPanelView = React.createClass({
    propTypes: {
      handleAddUrlClick: React.PropTypes.func.isRequired
    },

    handleClick: function(event) {
      event.preventDefault();
      var input = this.refs.siteUrl;
      input.value && this.props.handleAddUrlClick(input.value);
    },

    render: function() {
      return (
        <div className="room-panel-add-url">
          <h2>{'Add a site to the room'}</h2>
          <input placeholder="http://..." ref="siteUrl" type="text" />
          <button onClick={this.handleClick}>{'Add site'}</button>
        </div>
      );
    }
  });

  var RoomContentView = React.createClass({
    propTypes: {
      tiles: React.PropTypes.array
    },

    getDefaultProps: function() {
      return {
        tiles: []
      };
    },

    render: function() {
      return (
        <div className="room-toc">
          {
            this.props.tiles.map(function(tile, index) {
              return (
                <TileView
                  key={index}
                  tile={tile} />
              );
            }, this)
          }
        </div>
      );
    }
  });

  var TileView = React.createClass({
    propTypes: {
      tile: React.PropTypes.object.isRequired
    },

    // XXX akita: add tile screenshot
    // XXX akita: follow-up -> how presence is handled on the UI
    render: function() {
      return (
        <div className="toc-tile">
          <div className="room-user" data-name="Pau Masiá">
            <span>{'P'}</span>
          </div>
          <img className="tile-screenshot" src="" />
          <div className="tile-info">
            <a
              className="tile-name"
              href={this.props.tile.location}
              title={this.props.tile.description}>
                {this.props.tile.description}
            </a>
            <h3 className="tile-url">{this.props.tile.location}</h3>
          </div>
        </div>
      );
    }
  });

  /* XXX akita-sidebar This is currently a fork of the standaloneRoomView.
   * As per discussion comments in the PR, we need to decide what,
   * if anything, to do about that.
   */
  var SidebarView = React.createClass({
    mixins: [
      Backbone.Events,
      sharedMixins.MediaSetupMixin,
      sharedMixins.RoomsAudioMixin,
      sharedMixins.DocumentTitleMixin
    ],

    propTypes: {
      // We pass conversationStore here rather than use the mixin, to allow
      // easy configurability for the ui-showcase.
      activeRoomStore: React.PropTypes.instanceOf(loop.store.ActiveRoomStore).isRequired,
      audio: React.PropTypes.object.isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      introSeen: React.PropTypes.bool,
      isFirefox: React.PropTypes.bool.isRequired,
      leaveRoom: React.PropTypes.func.isRequired,
      // The poster URLs are for UI-showcase testing and development
      localPosterUrl: React.PropTypes.string,
      remotePosterUrl: React.PropTypes.string,
      roomState: React.PropTypes.string,
      video: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
      // Uncomment this line to see the slideshow every time while developing:
      // localStorage.removeItem("introSeen");

      // Used by the UI showcase to override localStorage value to hide or show FTU slideshow.
      // localStorage sourced data is always string or null
      var introSeen = false;
      if (this.props.introSeen !== undefined) {
        if (this.props.introSeen) {
          introSeen = true;
        }
      } else if (localStorage.getItem("introSeen") !== null) {
        introSeen = true;
      }
      var storeState = this.props.activeRoomStore.getStoreState();
      return _.extend({}, storeState, {
        // Used by the UI showcase.
        roomState: this.props.roomState || storeState.roomState,
        introSeen: introSeen
      });
    },

    componentWillMount: function() {
      this.props.activeRoomStore.on("change", function() {
        this.setState(this.props.activeRoomStore.getStoreState());
      }, this);
    },

    componentWillUnmount: function() {
      this.props.activeRoomStore.off("change", null, this);
    },

    /**
     * Watches for when we transition to MEDIA_WAIT room state, so we can request
     * user media access.
     *
     * @param  {Object} nextProps (Unused)
     * @param  {Object} nextState Next state object.
     */
    componentWillUpdate: function(nextProps, nextState) {
      if (this.state.roomState !== ROOM_STATES.READY &&
          nextState.roomState === ROOM_STATES.READY) {
        var roomName = nextState.roomName;
        if (!roomName && nextState.roomContextUrls) {
          roomName = nextState.roomContextUrls[0].description ||
              nextState.roomContextUrls[0].location;
        }
        if (!roomName) {
          this.setTitle(mozL10n.get("clientShortname2"));
        } else {
          this.setTitle(mozL10n.get("standalone_title_with_room_name", {
            roomName: roomName,
            clientShortname: mozL10n.get("clientShortname2")
          }));
        }
      }

      if (this.state.roomState !== ROOM_STATES.MEDIA_WAIT &&
          nextState.roomState === ROOM_STATES.MEDIA_WAIT) {
        this.props.dispatcher.dispatch(new sharedActions.SetupStreamElements({
          publisherConfig: this.getDefaultPublisherConfig({ publishVideo: true })
        }));
      }

      // UX don't want to surface these errors (as they would imply the user
      // needs to do something to fix them, when if they're having a conversation
      // they just need to connect). However, we do want there to be somewhere to
      // find reasonably easily, in case there's issues raised.
      if (!this.state.roomInfoFailure && nextState.roomInfoFailure) {
        if (nextState.roomInfoFailure === ROOM_INFO_FAILURES.WEB_CRYPTO_UNSUPPORTED) {
          console.error(mozL10n.get("room_information_failure_unsupported_browser"));
        } else {
          console.error(mozL10n.get("room_information_failure_not_available"));
        }
      }
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

    /**
     * Works out if remote video should be rended or not, depending on the
     * room state and other flags.
     *
     * @return {Boolean} True if remote video should be rended.
     *
     * XXX Refactor shouldRenderRemoteVideo & shouldRenderLoading to remove
     *     overlapping cases.
     */
    shouldRenderRemoteVideo: function() {
      switch (this.state.roomState) {
        case ROOM_STATES.HAS_PARTICIPANTS:
          if (this.state.remoteVideoEnabled) {
            return true;
          }

          if (this.state.mediaConnected) {
            // since the remoteVideo hasn't yet been enabled, if the
            // media is connected, then we should be displaying an avatar.
            return false;
          }

          return true;

        case ROOM_STATES.READY:
        case ROOM_STATES.GATHER:
        case ROOM_STATES.INIT:
        case ROOM_STATES.JOINING:
        case ROOM_STATES.SESSION_CONNECTED:
        case ROOM_STATES.JOINED:
        case ROOM_STATES.MEDIA_WAIT:
          // this case is so that we don't show an avatar while waiting for
          // the other party to connect
          return true;

        case ROOM_STATES.FAILED:
        case ROOM_STATES.CLOSING:
        case ROOM_STATES.FULL:
        case ROOM_STATES.ENDED:
          // the other person has shown up, so we don't want to show an avatar
          return true;

        default:
          console.warn("StandaloneRoomView.shouldRenderRemoteVideo:" +
            " unexpected roomState: ", this.state.roomState);
          return true;

      }
    },

    /**
     * Should we render a visual cue to the user (e.g. a spinner) that a local
     * stream is on its way from the camera?
     *
     * @returns {boolean}
     * @private
     */
    _isLocalLoading: function() {
      return this.state.roomState === ROOM_STATES.MEDIA_WAIT &&
             !this.state.localSrcMediaElement;
    },

    /**
     * Should we render a visual cue to the user (e.g. a spinner) that a remote
     * stream is on its way from the other user?
     *
     * @returns {boolean}
     * @private
     */
    _isRemoteLoading: function() {
      return !!(this.state.roomState === ROOM_STATES.HAS_PARTICIPANTS &&
                !this.state.remoteSrcMediaElement &&
                !this.state.mediaConnected);
    },

    // XXX akita display MediaLayoutView only if room has participants
    render: function() {
      return (
        <div className="sidebar-wrapper">
          <sharedViews.MediaLayoutView
            audio={this.props.audio}
            dispatcher={this.props.dispatcher}
            isLocalLoading={this._isLocalLoading()}
            isRemoteLoading={this._isRemoteLoading()}
            leaveRoom={this.props.leaveRoom}
            localPosterUrl={this.props.localPosterUrl}
            localSrcMediaElement={this.state.localSrcMediaElement}
            localVideoMuted={this.state.videoMuted}
            matchMedia={this.state.matchMedia || window.matchMedia.bind(window)}
            remotePosterUrl={this.props.remotePosterUrl}
            remoteSrcMediaElement={this.state.remoteSrcMediaElement}
            renderRemoteVideo={this.shouldRenderRemoteVideo()}
            screen={{ enabled: this.state.screenSharingState !== SCREEN_SHARE_STATES.INACTIVE }}
            showMediaWait={this.state.roomState === ROOM_STATES.MEDIA_WAIT}
            video={this.props.video} />
          <loop.shared.views.chat.TextChatView
            dispatcher={this.props.dispatcher}
            showInitialContext={true} />
        </div>
      );
    }
  });


  return {
    SidebarView: SidebarView,
    TableOfContentView: TableOfContentView
  };
})(navigator.mozL10n || document.mozL10n);
