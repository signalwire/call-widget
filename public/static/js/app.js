/**
 * SignalWire Video Chat Widget
 * A modular implementation for embedding video chat functionality
 */

// Self-executing function to avoid polluting global namespace
(function() {
  'use strict';

// Configuration
const CONFIG = {
  // Guest restricted token
  TOKEN: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiY2giOiJwdWMuc2lnbmFsd2lyZS5jb20iLCJ0eXAiOiJTQVQifQ..QYHghlPEOE4HjtJb.1WKLEg09c05-g3RujrS0io5h6AJ4mfpKMWtykpMIERJlMuomtOLHrU8picaFHeppbb_-593GjxHfeZiVmYdPZiIPYuNw2znqBuySuPArPfb2NMvXtZHEgfl3sXAdy5xpqSpphxFKStXwylo0EGeC91cVQgn3_lmSBcp13JvwArnu5ULltGmjPJogRbE1PrBsBbEJJioumVSZuuMH5lo7am-wE37Q5GXgou1a9iJWBiBtgk5ysmW4HTvbZ7pZHL5VcnWVy4V0OJL3J4WXl-m47L6bgFmHUijvVWxoFDu4Z7aUfx551OEhefr04F5NuJaHzTWUpgNzQ_VgWho04K96MK--wH_dEyIxtbfUHJSZyk1-Ef_dDCgFK6Rlnl2H5HM4G05gEKWcSjXGGk4tN0g6YvHsrUrAgsZiQeVQ-ggCHHRcmYX1OeXYbv1vEPml8i5JPUHAak5VvOQLYoG2ydb5kVv3WdM0oWKGHzTFPLFmjTaRxSC2b378BGbR7hCxbY9NdaLFnSn45KDkv1_a-saR9gDCBa2ZCPbkFmWRKLtGORFoiN-mLYAPTugidqZx40Ue4hav-jX178udYpVgSmun_rMHoN81t0Sb4xqMovs2i47-WLyzTwaGBK2CgLeHohGBvB9aWsFOV7F_YrZlcn7ptKo7RdNSrfBkiw7F6Sf8oIOz.426h9VZWDSVYDUIL9a1wDg',
  DEBUG: {
    logWsTraffic: false,
    logEvents: true,
    logStateChanges: true,
    logErrors: true
  },
  UI: {
    backgroundImage: 'https://deploy-preview-29--signalwire-docs.netlify.app/img/call-widget/sw_background.webp',
    colors: {
      primary: '#044ef4',
      secondary: '#f72a72',
      error: '#FF3B30',
      background: 'rgba(7, 12, 45, 0.95)'
    }
  },
  ENDPOINTS: {
    'demo-1': {
      path: '/private/demo-1',
      supportsVideo: true,
      supportsAudio: true,
      label: 'Video & Audio Demo'
    },
    'demo-2': {
      path: '/private/demo-2',
      supportsVideo: false,
      supportsAudio: true,
      label: 'Audio Only Demo'
    },
    'demo-3': {
      path: '/private/demo-3',
      supportsVideo: false,
      supportsAudio: true,
      label: 'Audio Demo 2'
    },
    'demo-4': {
      path: '/private/demo-4',
      supportsVideo: false,
      supportsAudio: true,
      label: 'Audio Demo 3'
    }
  }
};

  /**
   * Logger - Enhanced logging utility for debugging
   */
  class Logger {
    constructor(config) {
      this.config = config;
    }
    
    log(type, ...args) {
      if (this.config.DEBUG[`log${type}`]) {
        console.log(`[SignalWire ${type}]`, ...args);
      }
    }
    
    error(message, error) {
      if (this.config.DEBUG.logErrors) {
        console.error(`[SignalWire Error] ${message}`, error);
      }
    }
    
    event(event, ...data) {
      this.log('Events', `Event: ${event}`, ...data);
    }
    
    stateChange(path, value, oldValue) {
      this.log('StateChanges', `State changed: ${path}`, { from: oldValue, to: value });
    }
  }

  /**
   * EventEmitter - Simple pub/sub implementation for inter-module communication
   */
  class EventEmitter {
    constructor(logger) {
      this.events = {};
      this.logger = logger;
    }

    on(event, listener) {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(listener);
      return () => this.off(event, listener);
    }

    off(event, listener) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
      if (this.logger) {
        this.logger.event(event, ...args);
      }
      
      if (!this.events[event]) return;
      this.events[event].forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          if (this.logger) {
            this.logger.error(`Error in event listener for ${event}`, error);
          }
        }
      });
    }

    once(event, listener) {
      const remove = this.on(event, (...args) => {
        remove();
        listener(...args);
      });
    }
  }

  /**
   * AppState - Centralized state management with responsive state tracking
   */
  class AppState {
    constructor(events, logger) {
      this.events = events;
      this.logger = logger;
      this.state = {
        client: null,
        currentCall: null,
        localStream: null,
        isActive: false,
        isChatOpen: false,
        unreadMessages: 0,
        currentPartialMessageDiv: null,
        ui: {
          elements: null,
          initialized: false,
          orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
          isMobile: window.innerWidth < 768,
          isTablet: window.innerWidth >= 768 && window.innerWidth < 992
        },
        devices: {
          loaded: false,
          audioInput: [],
          audioOutput: [],
          videoInput: []
        },
        aiMessageInProgress: false
      };
      
      // Listen for orientation and size changes
      window.addEventListener('resize', this._handleResize.bind(this));
    }
    
    _handleResize() {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      const newIsMobile = window.innerWidth < 768;
      const newIsTablet = window.innerWidth >= 768 && window.innerWidth < 992;
      
      if (newOrientation !== this.state.ui.orientation) {
        this.set('ui.orientation', newOrientation);
      }
      
      if (newIsMobile !== this.state.ui.isMobile) {
        this.set('ui.isMobile', newIsMobile);
      }
      
      if (newIsTablet !== this.state.ui.isTablet) {
        this.set('ui.isTablet', newIsTablet);
      }
    }

    get(path) {
      return this._getNestedProperty(this.state, path);
    }

    set(path, value) {
      const oldValue = this._getNestedProperty(this.state, path);
      if (oldValue === value) return;
      
      this._setNestedProperty(this.state, path, value);
      
      if (this.logger) {
        this.logger.stateChange(path, value, oldValue);
      }
      
      this.events.emit('state:changed', path, value, oldValue);
    }

    _getNestedProperty(obj, path) {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      
      return current;
    }

    _setNestedProperty(obj, path, value) {
      const parts = path.split('.');
      let current = obj;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
    }
  }

  /**
   * UIManager - Handles creating and updating the UI
   */
  class UIManager {
    constructor(events, state, logger) {
      this.events = events;
      this.state = state;
      this.logger = logger;
      this.elements = null;
    }

    initialize() {
      this._createVideoModal();
      this._initializeElements();
      this._applyDynamicStyles();
      this._initializeEventListeners();
      this.state.set('ui.initialized', true);
    }

    _createVideoModal() {
      // Create container
      const modal = document.createElement('div');
      modal.className = 'signalwire-widget-container';
      modal.id = 'video-modal';
      
      // Create shadow DOM
      const shadow = modal.attachShadow({mode: 'open'});
      
      // Add required stylesheets
      shadow.innerHTML = `
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
        <link rel="stylesheet" href="/static/css/video-modal.css">
        <div class="modal" id="shadow-video-modal">
          <div class="modal-content">
            <div class="video-layout">
              <!-- Video container -->
              <div class="video-container">
                <div id="root-element"></div>
                <video id="local-video" class="hidden" autoplay playsinline muted></video>
                <div id="video-placeholder" class="video-placeholder">
                  <div class="connecting-spinner"></div>
                  <div class="connecting-text">Connecting to agent...</div>
                </div>
              </div>
              
              <!-- Controls overlay -->
              <div class="controls-overlay">
                <!-- Device selectors -->
                <div class="device-selectors">
                  <div class="select-header">
                    <h4>Device Settings</h4>
                    <button class="close-settings">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div class="select-wrapper">
                    <i class="fas fa-microphone"></i>
                    <select id="audioInput"></select>
                  </div>
                  <div class="select-wrapper">
                    <i class="fas fa-volume-up"></i>
                    <select id="audioOutput"></select>
                  </div>
                  <div class="select-wrapper">
                    <i class="fas fa-video"></i>
                    <select id="videoInput"></select>
                  </div>
                </div>
                
                <!-- Call controls -->
                <div class="call-controls-container">
                  <div class="call-controls">
                    <div class="left-controls">
                      <button id="settingsButton" type="button" class="left-button">
                        <i class="fas fa-cog"></i>
                      </button>
                    </div>
                    <div class="main-controls">
                      <button id="hangup-button" class="main-button hangup-button">
                        <i class="fas fa-phone-slash"></i>
                      </button>
                    </div>
                    <div class="right-controls">
                      <button id="chat-button" class="right-button chat-button">
                        <i class="fas fa-comment-alt"></i>
                        <span class="notification-badge hidden">0</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Chat panel - MOVED OUTSIDE video-layout -->
            <div id="chat-panel" class="chat-panel">
              <div class="chat-header">
                <h3>Chat</h3>
                <button class="chat-close" id="chat-close">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div id="messagesContainer" class="messages-container"></div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    }

    _initializeElements() {
      const container = document.getElementById('video-modal');
      const shadow = container.shadowRoot;
      
      this.elements = {
        modal: shadow.getElementById('shadow-video-modal'),
        root: shadow.getElementById('root-element'),
        localVideo: shadow.getElementById('local-video'),
        hangupButton: shadow.getElementById('hangup-button'),
        placeholder: shadow.getElementById('video-placeholder'),
        settingsButton: shadow.getElementById('settingsButton'),
        audioInput: shadow.getElementById('audioInput'),
        audioOutput: shadow.getElementById('audioOutput'),
        videoInput: shadow.getElementById('videoInput'),
        deviceSelectors: shadow.querySelector('.device-selectors'),
        closeSettings: shadow.querySelector('.close-settings'),
        chatButton: shadow.getElementById('chat-button'),
        chatPanel: shadow.getElementById('chat-panel'),
        chatClose: shadow.getElementById('chat-close'),
        messagesContainer: shadow.getElementById('messagesContainer'),
        notificationBadge: shadow.querySelector('.notification-badge'),
        shadow: shadow
      };

      this.state.set('ui.elements', this.elements);
    }

    _applyDynamicStyles() {
      const styleElement = document.createElement('style');
      
      // Create dynamic CSS that uses the configuration values for colors and background
      styleElement.textContent = `
        :host {
          --video-bg-image: url('${CONFIG.UI.backgroundImage}');
          --primary-color: ${CONFIG.UI.colors.primary};
          --secondary-color: ${CONFIG.UI.colors.secondary};
          --error-color: ${CONFIG.UI.colors.error};
          --background-color: ${CONFIG.UI.colors.background};
        }
      `;
      
      this.elements.shadow.appendChild(styleElement);
      
      // Initial responsive class application
      this._handleResize();
    }

    _handleResize() {
      // Update responsive classes based on window size
      const elements = this.elements;
      if (!elements.modal) return;
      
      // Use fixed breakpoints instead of configuration
      const mobileBreakpoint = 768;
      const tabletBreakpoint = 992;
      
      if (window.innerWidth < 500) {
        elements.modal.classList.add('xs-size');
      } else {
        elements.modal.classList.remove('xs-size');
      }
      
      if (window.innerWidth < mobileBreakpoint) {
        elements.modal.classList.add('sm-size');
      } else {
        elements.modal.classList.remove('sm-size');
      }
      
      if (window.innerWidth >= mobileBreakpoint && window.innerWidth < tabletBreakpoint) {
        elements.modal.classList.add('md-size');
      } else {
        elements.modal.classList.remove('md-size');
      }
    }

    _initializeEventListeners() {
      const elements = this.elements;
      
      // Hangup button
      elements.hangupButton?.addEventListener('click', () => 
        this.events.emit('call:end'));
        
      // Settings button
      elements.settingsButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Toggle the settings panel based on its current state
        this._toggleSettings();
      });
      
      // Close settings button
      elements.closeSettings?.addEventListener('click', () => {
        this._toggleSettings(false);
      });
      
      // Chat button event listener
      elements.chatButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.events.emit('chat:toggle');
        // Reset unread count when opening chat
        if (!this.state.get('isChatOpen')) {
          this.state.set('unreadMessages', 0);
          this._updateNotificationBadge();
        }
      });
      
      // Chat close button event listener
      elements.chatClose?.addEventListener('click', () => {
        this.events.emit('chat:toggle', false);
      });
      
      // Add stopPropagation to prevent closing when selecting from dropdowns
      elements.audioInput?.addEventListener('click', (e) => e.stopPropagation());
      elements.videoInput?.addEventListener('click', (e) => e.stopPropagation());
      elements.audioOutput?.addEventListener('click', (e) => e.stopPropagation());
      
      // Close settings when clicking outside
      document.addEventListener('click', (event) => {
        if (elements.deviceSelectors?.classList.contains('show') &&
            !elements.settingsButton?.contains(event.target) &&
            !elements.deviceSelectors?.contains(event.target)) {
          this._toggleSettings(false);
        }
      });

      // Device change listeners with device type and preference saving
      ['audioInput', 'videoInput', 'audioOutput'].forEach(type => {
        elements[type]?.addEventListener('change', async (e) => {
          // Stop propagation to prevent immediate closing
          e.stopPropagation();
          // Save preference
          localStorage.setItem(`selected${type}`, e.target.value);
          this.events.emit('device:changed', type, e.target.value);
        });
      });
      
      // Listen for orientation changes
      window.addEventListener('resize', this._handleResize.bind(this));
    }

    _toggleSettings() {
      const elements = this.elements;
      
      // Toggle the settings panel based on its current state
      elements.deviceSelectors?.classList.toggle('show');
    }

    _updateNotificationBadge() {
      const count = this.state.get('unreadMessages');
      const badge = this.elements.notificationBadge;
      
      if (!badge) {
        console.error('Notification badge element not found');
        return;
      }
      
      console.log('Updating notification badge:', count);
      
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    updateDeviceSelectors(devices) {
      const selectors = {
        audioinput: this.elements.audioInput,
        audiooutput: this.elements.audioOutput,
        videoinput: this.elements.videoInput
      };

      Object.entries(selectors).forEach(([kind, selector]) => {
        if (!selector) return;
        
        selector.innerHTML = `<option value="default">Default ${kind.replace('input', ' Input').replace('output', ' Output')}</option>`;
        
        devices.filter(device => device.kind === kind).forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `${device.kind} (${device.deviceId.slice(0,5)}...)`;
          selector.appendChild(option);
        });
      });
    }

    restoreDevicePreferences() {
      ['audioInput', 'audioOutput', 'videoInput'].forEach(type => {
        const saved = localStorage.getItem(`selected${type}`);
        const element = this.elements[type];
        if (element?.options.length > 0) {
          element.value = saved || element.options[0].value;
        }
      });
    }

    updateUI(isShowing) {
      const elements = this.elements;
      const isCallActive = isShowing && this.state.get('currentCall')?.state === 'active';
      
      if (elements.modal) {
        elements.modal.style.display = isShowing ? 'flex' : 'none';
      }
      
      if (elements.placeholder) {
        elements.placeholder.style.display = isShowing && !isCallActive ? 'flex' : 'none';
      }
      
      // Make sure the settings button is visible during active calls
      if (elements.settingsButton) {
        elements.settingsButton.style.display = isCallActive ? 'block' : 'none';
      }
      
      if (elements.hangupButton) {
        elements.hangupButton.style.display = isCallActive ? 'block' : 'none';
      }
      
      if (elements.chatButton) {
        elements.chatButton.style.display = isCallActive ? 'block' : 'none';
      }

      // Control container visibility
      const controlsContainer = elements.shadow.querySelector('.call-controls-container');
      if (controlsContainer) {
        // Always make it visible when call is active, don't rely on the class
        if (isCallActive) {
          controlsContainer.style.opacity = '1';
          controlsContainer.classList.add('visible');
        } else {
          controlsContainer.style.opacity = '0';
          controlsContainer.classList.remove('visible');
        }
      }
      
      // Ensure the left controls section is visible
      const leftControls = elements.shadow.querySelector('.left-controls');
      if (leftControls) {
        leftControls.style.display = isCallActive ? 'flex' : 'none';
      }
      
      if (elements.root) {
        elements.root.classList.toggle('active', isCallActive);
      }
      
      // Hide chat panel when call is not active
      if (!isCallActive) {
        this.toggleChatPanel(false);
      }
      
      if (!isShowing && elements.localVideo) {
        elements.localVideo.srcObject = null;
        elements.localVideo.classList.add('hidden');
      }
    }

    toggleChatPanel(forceState) {
      const elements = this.elements;
      const isOpen = forceState !== undefined ? forceState : !this.state.get('isChatOpen');
      this.state.set('isChatOpen', isOpen);
      
      if (isOpen) {
        elements.chatPanel.classList.add('open');
        elements.chatButton.classList.add('active');
        
        // Add chat-open class to the modal content for centering
        elements.modal.classList.add('chat-open');
        
        // Reset unread messages when opening chat
        this.state.set('unreadMessages', 0);
        this._updateNotificationBadge();
        
        // Scroll to bottom of messages
        if (elements.messagesContainer) {
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }
      } else {
        elements.chatPanel.classList.remove('open');
        elements.chatButton.classList.remove('active');
        
        // Remove chat-open class from modal content when closing
        elements.modal.classList.remove('chat-open');
      }
    }

    clearChatMessages() {
      if (this.elements.messagesContainer) {
        this.elements.messagesContainer.innerHTML = '';
      }
      this.state.set('currentPartialMessageDiv', null);
      this.state.set('unreadMessages', 0);
      this._updateNotificationBadge();
    }

    appendMessage(text, sender) {
      const messagesContainer = this.elements.messagesContainer;
      if (!messagesContainer) return;
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}-message`;
      messageDiv.textContent = text;
      messagesContainer.appendChild(messageDiv);
      
      // Auto-scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Increment unread messages if chat is closed and this is an AI message
      if (sender === 'ai' && !this.state.get('isChatOpen') && !this.state.get('aiMessageInProgress')) {
        const currentCount = this.state.get('unreadMessages');
        this.state.set('unreadMessages', currentCount + 1);
        this._updateNotificationBadge();
      }
    }

    updatePartialMessage(text) {
      let currentDiv = this.state.get('currentPartialMessageDiv');
      if (!currentDiv) {
        currentDiv = document.createElement('div');
        currentDiv.className = 'message user-message partial';
        this.elements.messagesContainer.appendChild(currentDiv);
        this.state.set('currentPartialMessageDiv', currentDiv);
      }
      
      currentDiv.textContent = text;
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    showError(error) {
      console.error('Error:', error);
      
      const errorMessages = {
        NotAllowedError: 'Camera/Microphone access denied. Please check your browser permissions.',
        PermissionDeniedError: 'Camera/Microphone access denied. Please check your browser permissions.',
        NotFoundError: 'Camera/Microphone not found. Please check your device connections.',
        NotReadableError: 'Could not access your camera/microphone. They might be in use by another application.',
        TrackStartError: 'Could not access your camera/microphone. They might be in use by another application.',
        OverconstrainedError: 'The requested camera/microphone settings are not supported by your device.',
        TypeError: 'Invalid media constraints. Please check your device settings.'
      };
      
      alert(errorMessages[error.name] || `${error.name}: ${error.message}` || 'An error occurred');
    }
  }

  /**
   * DeviceManager - Handles media device enumeration and management
   */
  class DeviceManager {
    constructor(events, state) {
      this.events = events;
      this.state = state;
      
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.loadDevices();
      });
    }

    async loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.events.emit('devices:loaded', devices);
        return devices;
      } catch (error) {
        console.error('Failed to load devices:', error);
        this.events.emit('error', error);
        return [];
      }
    }

    async getMediaConstraints() {
      const elements = this.state.get('ui.elements');
      if (!elements) return { audio: true, video: true };
      
      const audioId = elements.audioInput?.value;
      const videoId = elements.videoInput?.value;
      
      return {
        audio: audioId && audioId !== 'default' ? { deviceId: { ideal: audioId } } : true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(videoId && videoId !== 'default' ? { deviceId: { ideal: videoId } } : {})
        }
      };
    }

    async updateMediaStream(changedDeviceType) {
      if (!this.state.get('isActive')) return;
      
      try {
        const constraints = await this.getMediaConstraints();
      const mediaConstraints = {
        audio: changedDeviceType === 'audioInput' ? constraints.audio : false,
        video: changedDeviceType === 'videoInput' ? constraints.video : false
      };

      // Get new stream before cleaning up old one to avoid flickering
      const newStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      const newTrack = changedDeviceType === 'audioInput' ? 
        newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];
      
      if (!newTrack) {
        // Clean up the new stream if we didn't get the track we wanted
        newStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
        });
        return;
      }

        const localStream = this.state.get('localStream');
        const elements = this.state.get('ui.elements');
        
        if (localStream) {
        const oldTrack = changedDeviceType === 'audioInput' ? 
            localStream.getAudioTracks()[0] : localStream.getVideoTracks()[0];
        
        if (oldTrack) {
          oldTrack.enabled = false;
          oldTrack.stop();
            localStream.removeTrack(oldTrack);
        }
        
          localStream.addTrack(newTrack);

        if (changedDeviceType === 'videoInput') {
          if (newTrack) {
            // Allow time for video to start playing before showing
            requestAnimationFrame(() => {
                elements.localVideo.classList.remove('hidden');
            });
          } else {
              elements.localVideo.classList.add('hidden');
          }
        }

        // Update the call if active
          const currentCall = this.state.get('currentCall');
          if (currentCall) {
          await (changedDeviceType === 'audioInput' ? 
              currentCall.updateMicrophone(constraints.audio) : 
              currentCall.updateCamera(constraints.video));
        }

        // Refresh video element
          elements.localVideo.srcObject = null;
          elements.localVideo.srcObject = localStream;
      } else {
          this.state.set('localStream', newStream);
          elements.localVideo.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error updating media stream:', error);
        this.events.emit('error', error);
    }
  }

    async updateAudioOutput(deviceId) {
      const currentCall = this.state.get('currentCall');
      if (!currentCall) return;
    
    try {
        await currentCall.updateSpeaker({
        deviceId: deviceId
      });
    } catch (error) {
      console.error('Error setting audio output:', error);
        this.events.emit('error', error);
      }
    }
  }

  /**
   * CallManager - Handles call initialization and management
   */
  class CallManager {
    constructor(events, state, deviceManager) {
      this.events = events;
      this.state = state;
      this.deviceManager = deviceManager;
  }

  async startDemo(demoType) {
    const endpoint = CONFIG.ENDPOINTS[demoType];
      if (!endpoint) {
        this.events.emit('error', new Error('Invalid demo type'));
        return;
      }
      
    await this.makeCall(endpoint.path, endpoint.supportsVideo, endpoint.supportsAudio);
  }

  async makeCall(destination, videoEnabled, audioEnabled) {
      if (!destination) {
        this.events.emit('error', new Error('Destination is required'));
        return;
      }
    
    try {
      if (!window.isSecureContext) {
        throw new Error('WebRTC requires a secure context (HTTPS or localhost). Please use HTTPS.');
      }

        if (this.state.get('currentCall')) {
        await this.endCall();
      }

        this.state.set('isActive', true);
        this.events.emit('ui:update', true);
      // Clear chat messages when starting a new call
        this.events.emit('chat:clear');

      // Get devices first without requesting media
      const devices = await navigator.mediaDevices.enumerateDevices();
      let initialStream;
      if (!devices.some(device => device.label)) {
        // Only request the media types we'll actually use
        initialStream = await navigator.mediaDevices.getUserMedia({
          audio: audioEnabled,
          video: videoEnabled
        });
      }
        await this.deviceManager.loadDevices();

        let client = this.state.get('client');
        if (!client) {
          client = await SignalWire.SignalWire({
          token: CONFIG.TOKEN,
          debug: CONFIG.DEBUG
        });
        
          this.state.set('client', client);
          this.events.emit('client:created', client);
      }

        const constraints = await this.deviceManager.getMediaConstraints();
      try {
        // Ensure any existing stream is fully cleaned up before requesting a new one
          let localStream = this.state.get('localStream');
          if (localStream) {
            localStream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
            this.state.set('localStream', null);
        }
        
        // Use the initial stream if we have it, otherwise request a new one
        if (initialStream) {
            localStream = initialStream;
        } else {
            localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled && constraints.audio,
            video: videoEnabled && constraints.video
          });
        }
          
          this.state.set('localStream', localStream);
      } catch (streamError) {
        console.log('Stream error:', streamError);
        if (streamError.name === 'OverconstrainedError') {
          // Fallback to default devices
            const localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled,
            video: videoEnabled && {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
            this.state.set('localStream', localStream);
        } else {
          throw streamError;
        }
      }

        const elements = this.state.get('ui.elements');
        const localStream = this.state.get('localStream');
        elements.localVideo.srcObject = localStream;
        
      // Show local video when we have a stream
        if (videoEnabled && localStream.getVideoTracks().length > 0) {
        // Allow time for video to start playing before showing
          elements.localVideo.addEventListener('loadedmetadata', () => {
          requestAnimationFrame(() => {
              elements.localVideo.classList.remove('hidden');
          });
        }, { once: true });
      }

        const currentCall = await client.dial({
        to: destination,
          rootElement: elements.root,
        audio: audioEnabled,
        video: videoEnabled ? constraints.video : false,
        negotiateVideo: videoEnabled
      });

        this.state.set('currentCall', currentCall);
        this._setupCallEventListeners(currentCall);
        await currentCall.start();

    } catch (error) {
      console.error('Call failed:', error);
      await this.endCall();
        this.events.emit('error', error);
    }
  }

    _setupCallEventListeners(call) {
      if (!call) return;

      call.on('active', () => {
        if (!this.state.get('isActive')) {
        this.endCall();
        return;
      }
        this.events.emit('ui:update', true);
        const elements = this.state.get('ui.elements');
        elements.root.classList.add('active');
        elements.placeholder.style.display = 'none';
      });

      call.on('destroy', () => this.endCall());
      call.on('error', (error) => {
      console.error('Call error:', error);
      this.endCall();
        this.events.emit('error', error);
    });
  }

  async endCall() {
      this.state.set('isActive', false);

    try {
        const currentCall = this.state.get('currentCall');
        if (currentCall?.state === 'active') {
        console.log('Hanging up call - currently active...');
          await currentCall.hangup();
      }
      
        const localStream = this.state.get('localStream');
        if (localStream) {
        // Ensure all tracks are properly stopped and cleaned up
          localStream.getTracks().forEach(track => {
          track.enabled = false;
          track.stop();
            localStream.removeTrack(track);
          });
          
          const elements = this.state.get('ui.elements');
          if (elements) {
            elements.localVideo.srcObject = null;
          }
          
          this.state.set('localStream', null);
        }

        this.events.emit('ui:update', false);
        this.state.set('currentCall', null);
    } catch (error) {
      console.error('Error ending call:', error);
        this.events.emit('ui:update', false);
      }
    }
  }

  /**
   * ChatManager - Handles chat functionality
   */
  class ChatManager {
    constructor(events, state) {
      this.events = events;
      this.state = state;
    }

    setupAIEventListeners(client) {
      if (!client) return;
      
      // AI partial result (typing indicator)
      client.on('ai.partial_result', (params) => {
        console.log('AI Partial Result:', params.text);
        this.events.emit('chat:partial', params.text);
      });

      // AI speech detection
      client.on('ai.speech_detect', (params) => {
        const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, '');
        console.log('AI Speech Detected:', cleanText);
        this.events.emit('chat:speech', cleanText);
      });

      // AI completion (final response)
      client.on('ai.completion', (params) => {
        console.log('AI Completion:', params.text);
        this.events.emit('chat:completion', params.text);
      });

      // AI response utterance (spoken response)
      client.on('ai.response_utterance', (params) => {
        console.log('AI Response Utterance:', params.utterance);
        if (params.utterance) {
          this.events.emit('chat:utterance', params.utterance);
        }
      });
    }
  }

  /**
   * App - Main application class that coordinates all modules
   */
  class App {
    constructor() {
      // Initialize event bus for inter-module communication
      this.events = new EventEmitter(new Logger(CONFIG));
      
      // Initialize central state
      this.state = new AppState(this.events, new Logger(CONFIG));
      
      // Initialize modules
      this.ui = new UIManager(this.events, this.state, new Logger(CONFIG));
      this.deviceManager = new DeviceManager(this.events, this.state);
      this.callManager = new CallManager(this.events, this.state, this.deviceManager);
      this.chatManager = new ChatManager(this.events, this.state);
      
      // Set up event handlers between modules
      this._wireUpEvents();
      
      // Initialize UI
      this.ui.initialize();
      
      // Initialize demo buttons
      this._initializeDemoButtons();
      
      // Load devices
      this.deviceManager.loadDevices();
    }

    _wireUpEvents() {
      // UI events
      this.events.on('ui:update', isShowing => this.ui.updateUI(isShowing));
      
      // Device events
      this.events.on('devices:loaded', devices => {
        this.ui.updateDeviceSelectors(devices);
        this.ui.restoreDevicePreferences();
      });
      
      this.events.on('device:changed', async (type, value) => {
        if (type === 'audioOutput') {
          await this.deviceManager.updateAudioOutput(value);
        } else {
          await this.deviceManager.updateMediaStream(type);
        }
      });
      
      // Call events
      this.events.on('call:end', () => this.callManager.endCall());
      
      // Chat events
      this.events.on('chat:toggle', forceState => this.ui.toggleChatPanel(forceState));
      this.events.on('chat:clear', () => this.ui.clearChatMessages());
      this.events.on('chat:partial', text => this.ui.updatePartialMessage(text));
      
      this.events.on('chat:speech', text => {
        const currentDiv = this.state.get('currentPartialMessageDiv');
        if (currentDiv) {
          currentDiv.textContent = text;
          currentDiv.classList.remove('partial');
          this.state.set('currentPartialMessageDiv', null);
        } else {
          this.ui.appendMessage(text, 'user');
        }
      });
      
      this.events.on('chat:completion', text => {
        const currentDiv = this.state.get('currentPartialMessageDiv');
        if (currentDiv) {
          currentDiv.textContent = text;
          currentDiv.classList.remove('partial');
          this.state.set('currentPartialMessageDiv', null);
          
          // Reset the AI message in progress flag
          this.state.set('aiMessageInProgress', false);
        } else {
          this.ui.appendMessage(text, 'ai');
          
          // Only increment unread count for new AI messages when chat is closed
          // and there wasn't already a message in progress
          if (!this.state.get('isChatOpen') && !this.state.get('aiMessageInProgress')) {
            const currentCount = this.state.get('unreadMessages');
            this.state.set('unreadMessages', currentCount + 1);
            this.ui._updateNotificationBadge();
          }
        }
      });
      
      this.events.on('chat:utterance', utterance => {
        const elements = this.state.get('ui.elements');
        let currentDiv = this.state.get('currentPartialMessageDiv');
        
        if (!currentDiv) {
          currentDiv = document.createElement('div');
          currentDiv.className = 'message ai-message partial';
          elements.messagesContainer.appendChild(currentDiv);
          this.state.set('currentPartialMessageDiv', currentDiv);
          
          // Set flag that an AI message is in progress
          this.state.set('aiMessageInProgress', true);
          
          // Only increment unread count when a new AI message starts and chat is closed
          if (!this.state.get('isChatOpen')) {
            const currentCount = this.state.get('unreadMessages');
            this.state.set('unreadMessages', currentCount + 1);
            this.ui._updateNotificationBadge();
          }
        }
        
        currentDiv.textContent += " " + utterance;
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
      });
      
      // Client events
      this.events.on('client:created', client => this.chatManager.setupAIEventListeners(client));
      
      // Error handling
      this.events.on('error', error => this.ui.showError(error));
    }

    _initializeDemoButtons() {
      document.querySelectorAll('.demo-button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const demoType = button.getAttribute('data-demo-type');
          if (demoType) {
            this.callManager.startDemo(demoType);
          }
        });
      });
    }

    cleanup() {
      this.callManager.endCall();
      this.state.set('client', null);
    }
}

// Initialize the application
  const app = new App();
  
  // Expose app to window for external access
  window.SignalWireDemo = app;
  
  // Cleanup on unload
  window.addEventListener('unload', () => app.cleanup());
})();