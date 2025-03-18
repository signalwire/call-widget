/**
 * SignalWire Video Chat Widget - Improved Implementation
 * A modular implementation for embedding video chat functionality
 * Combines best practices from multiple approaches
 */

// Self-executing function to avoid polluting global namespace
(function() {
    'use strict';
  
  // Configuration
  const CONFIG = {
    // Guest restricted token
    TOKEN: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiY2giOiJwdWMuc2lnbmFsd2lyZS5jb20iLCJ0eXAiOiJTQVQifQ..QYHghlPEOE4HjtJb.1WKLEg09c05-g3RujrS0io5h6AJ4mfpKMWtykpMIERJlMuomtOLHrU8picaFHeppbb_-593GjxHfeZiVmYdPZiIPYuNw2znqBuySuPArPfb2NMvXtZHEgfl3sXAdy5xpqSpphxFKStXwylo0EGeC91cVQgn3_lmSBcp13JvwArnu5ULltGmjPJogRbE1PrBsBbEJJioumVSZuuMH5lo7am-wE37Q5GXgou1a9iJWBiBtgk5ysmW4HTvbZ7pZHL5VcnWVy4V0OJL3J4WXl-m47L6bgFmHUijvVWxoFDu4Z7aUfx551OEhefr04F5NuJaHzTWUpgNzQ_VgWho04K96MK--wH_dEyIxtbfUHJSZyk1-Ef_dDCgFK6Rlnl2H5HM4G05gEKWcSjXGGk4tN0g6YvHsrUrAgsZiQeVQ-ggCHHRcmYX1OeXYbv1vEPml8i5JPUHAak5VvOQLYoG2ydb5kVv3WdM0oWKGHzTFPLFmjTaRxSC2b378BGbR7hCxbY9NdaLFnSn45KDkv1_a-saR9gDCBa2ZCPbkFmWRKLtGORFoiN-mLYAPTugidqZx40Ue4hav-jX178udYpVgSmun_rMHoN81t0Sb4xqMovs2i47-WLyzTwaGBK2CgLeHohGBvB9aWsFOV7F_YrZlcn7ptKo7RdNSrfBkiw7F6Sf8oIOz.426h9VZWDSVYDUIL9a1wDg',
    DEBUG: {
      logEvents: true,
      logStateChanges: true,
      logErrors: true,
      SIGNALWIRE: {
        logWsTraffic: false,
      }
    },
    UI: {
      backgroundImage: 'https://developer.signalwire.com/img/call-widget/sw_background.webp',
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
     * Logger - Centralized logging with appropriate debug levels
     * Provides consistent logging across the application
     */
    class Logger {
      constructor(category, options = {}) {
        this.category = category;
        this.options = Object.assign({
          logErrors: CONFIG.DEBUG.logErrors,
          logEvents: CONFIG.DEBUG.logEvents,
          logStateChanges: CONFIG.DEBUG.logStateChanges,
          logWsTraffic: CONFIG.DEBUG.logWsTraffic
        }, options);
      }
      
      log(message, ...args) {
        console.log(`[${this.category}] ${message}`, ...args);
      }
      
      error(message, ...args) {
        if (this.options.logErrors) {
          console.error(`[${this.category}] ERROR: ${message}`, ...args);
        }
      }
      
      event(event, ...args) {
        if (this.options.logEvents) {
          console.log(`[${this.category}] EVENT: ${event}`, ...args);
        }
      }
      
      state(path, value, oldValue) {
        if (this.options.logStateChanges) {
          console.log(`[${this.category}] STATE: ${path} changed:`, { from: oldValue, to: value });
        }
      }
      
      ws(direction, data) {
        if (this.options.logWsTraffic) {
          console.log(`[${this.category}] WS ${direction}:`, data);
        }
      }
    }
  
    // Create a global logger instance for shared modules
    const logger = new Logger('SignalWireWidget');
  
    /**
     * EventRegistry - Central registry for all application events
     * Provides a single source of truth for event names
     */
    const EventRegistry = {
      // Local application events (internal to our app)
      LOCAL: {
        // UI events
        UI_UPDATE: 'ui:update',
        
        // State events
        STATE_CHANGED: 'state:changed',
        
        // Call control events
        CALL_END: 'call:end',
        
        // Chat interface events
        CHAT_TOGGLE: 'chat:toggle',
        CHAT_CLEAR: 'chat:clear',
        
        // Device events
        DEVICES_LOADED: 'devices:loaded',
        DEVICE_CHANGED: 'device:changed',
        
        // Client events
        CLIENT_CREATED: 'client:created',
        
        // Error events
        ERROR: 'error'
      },
      
      // SignalWire API events (received from or sent to SignalWire)
      SIGNALWIRE: {
        // Chat message events 
        CHAT_PARTIAL: 'chat:partial',
        CHAT_SPEECH: 'chat:speech',
        CHAT_COMPLETION: 'chat:completion',
        CHAT_UTTERANCE: 'chat:utterance'
      }
    };
  
    /**
     * EventEmitter - Simple pub/sub implementation for inter-module communication
     * Provides event-based communication between components
     */
    class EventEmitter {
      constructor(logger) {
        this.events = {};
        this.logger = logger || new Logger('EventEmitter', { logEvents: false }); // Temporary logger if none provided
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
        if (!this.events[event]) return;
        this.events[event].forEach(listener => {
          try {
            listener(...args);
          } catch (error) {
            this.logger.error(`Error in event listener for ${event}`, error);
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
     * Provides a single source of truth for application state
     */
    class AppState {
      constructor(events, logger) {
        this.events = events;
        this.logger = logger || new Logger('AppState');
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
        const newValues = {
          orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
          isMobile: window.innerWidth < 768,
          isTablet: window.innerWidth >= 768 && window.innerWidth < 992
        };
        
        // Only update values that have changed
        Object.entries(newValues).forEach(([key, value]) => {
          if (this.state.ui[key] !== value) {
            this.set(`ui.${key}`, value);
          }
        });
      }
  
      get(path) {
        return this._getNestedProperty(this.state, path);
      }
  
      set(path, value) {
        const oldValue = this._getNestedProperty(this.state, path);
        if (oldValue === value) return;
        
        this._setNestedProperty(this.state, path, value);
        
        this.logger.state(path, value, oldValue);
        this.events.emit(EventRegistry.LOCAL.STATE_CHANGED, path, value, oldValue);
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
     * Manages the visual components and user interactions
     */
    class UIManager {
      constructor(events, state, logger) {
        this.events = events;
        this.state = state;
        this.logger = logger || new Logger('UIManager');
        this.elements = null;
        
        // Listen for orientation changes
        window.addEventListener('resize', this._handleResize.bind(this));
      }
  
      async initialize() {
        // Create the modal with basic structure
        this._createVideoModal();
        this._initializeElements();
        
        // Apply styles and initialize UI components
        this._applyDynamicStyles();
        this._initializeEventListeners();
        
        this.state.set('ui.initialized', true);
        
        return Promise.resolve();
      }
  
      _createVideoModal() {
        // Create container
        const modal = document.createElement('div');
        modal.className = 'signalwire-widget-container';
        modal.id = 'video-modal';
        
        // Create shadow DOM
        modal.attachShadow({mode: 'open'});
        
        // Add CSS stylesheets using proper DOM methods
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/video-modal.css';
        modal.shadowRoot.appendChild(cssLink);
        
        // Create main modal div
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal';
        modalDiv.id = 'shadow-video-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Create video layout
        const videoLayout = document.createElement('div');
        videoLayout.className = 'video-layout';
        
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        
        // Create root element
        const rootElement = document.createElement('div');
        rootElement.id = 'root-element';
        videoContainer.appendChild(rootElement);
        
        // Create local video
        const localVideo = document.createElement('video');
        localVideo.id = 'local-video';
        localVideo.className = 'hidden';
        localVideo.autoplay = true;
        localVideo.playsInline = true;
        localVideo.muted = true;
        videoContainer.appendChild(localVideo);
        
        // Create video placeholder
        const videoPlaceholder = document.createElement('div');
        videoPlaceholder.id = 'video-placeholder';
        videoPlaceholder.className = 'video-placeholder';
        
        const connectingSpinner = document.createElement('div');
        connectingSpinner.className = 'connecting-spinner';
        videoPlaceholder.appendChild(connectingSpinner);
        
        const connectingText = document.createElement('div');
        connectingText.className = 'connecting-text';
        connectingText.textContent = 'Connecting to agent...';
        videoPlaceholder.appendChild(connectingText);
        
        videoContainer.appendChild(videoPlaceholder);
        videoLayout.appendChild(videoContainer);
        
        // Create controls overlay
        const controlsOverlay = document.createElement('div');
        controlsOverlay.className = 'controls-overlay';
        
        // Create device selectors
        const deviceSelectors = document.createElement('div');
        deviceSelectors.className = 'device-selectors';
        
        const selectHeader = document.createElement('div');
        selectHeader.className = 'select-header';
        
        const headerTitle = document.createElement('h4');
        headerTitle.textContent = 'Device Settings';
        selectHeader.appendChild(headerTitle);
        
        const closeSettingsBtn = document.createElement('button');
        closeSettingsBtn.className = 'close-settings';
        
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeSettingsBtn.appendChild(closeIcon);
        selectHeader.appendChild(closeSettingsBtn);
        
        deviceSelectors.appendChild(selectHeader);
        
        // Create audio input selector
        const audioInputWrapper = document.createElement('div');
        audioInputWrapper.className = 'select-wrapper';
        
        const micIcon = document.createElement('i');
        micIcon.className = 'fas fa-microphone';
        audioInputWrapper.appendChild(micIcon);
        
        const audioInputSelect = document.createElement('select');
        audioInputSelect.id = 'audioInput';
        audioInputWrapper.appendChild(audioInputSelect);
        
        deviceSelectors.appendChild(audioInputWrapper);
        
        // Create audio output selector
        const audioOutputWrapper = document.createElement('div');
        audioOutputWrapper.className = 'select-wrapper';
        
        const speakerIcon = document.createElement('i');
        speakerIcon.className = 'fas fa-volume-up';
        audioOutputWrapper.appendChild(speakerIcon);
        
        const audioOutputSelect = document.createElement('select');
        audioOutputSelect.id = 'audioOutput';
        audioOutputWrapper.appendChild(audioOutputSelect);
        
        deviceSelectors.appendChild(audioOutputWrapper);
        
        // Create video input selector
        const videoInputWrapper = document.createElement('div');
        videoInputWrapper.className = 'select-wrapper';
        
        const videoIcon = document.createElement('i');
        videoIcon.className = 'fas fa-video';
        videoInputWrapper.appendChild(videoIcon);
        
        const videoInputSelect = document.createElement('select');
        videoInputSelect.id = 'videoInput';
        videoInputWrapper.appendChild(videoInputSelect);
        
        deviceSelectors.appendChild(videoInputWrapper);
        
        controlsOverlay.appendChild(deviceSelectors);
        
        // Create call controls container
        const callControlsContainer = document.createElement('div');
        callControlsContainer.className = 'call-controls-container';
        
        const callControls = document.createElement('div');
        callControls.className = 'call-controls';
        
        // Create left controls
        const leftControls = document.createElement('div');
        leftControls.className = 'left-controls';
        
        const settingsButton = document.createElement('button');
        settingsButton.id = 'settingsButton';
        settingsButton.type = 'button';
        settingsButton.className = 'left-button';
        
        const settingsIcon = document.createElement('i');
        settingsIcon.className = 'fas fa-cog';
        settingsButton.appendChild(settingsIcon);
        
        leftControls.appendChild(settingsButton);
        callControls.appendChild(leftControls);
        
        // Create main controls
        const mainControls = document.createElement('div');
        mainControls.className = 'main-controls';
        
        const hangupButton = document.createElement('button');
        hangupButton.id = 'hangup-button';
        hangupButton.className = 'main-button hangup-button';
        
        const hangupIcon = document.createElement('i');
        hangupIcon.className = 'fas fa-phone-slash';
        hangupButton.appendChild(hangupIcon);
        
        mainControls.appendChild(hangupButton);
        callControls.appendChild(mainControls);
        
        // Create right controls
        const rightControls = document.createElement('div');
        rightControls.className = 'right-controls';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        const chatButton = document.createElement('button');
        chatButton.id = 'chat-button';
        chatButton.className = 'right-button chat-button';
        
        const chatIcon = document.createElement('i');
        chatIcon.className = 'fas fa-comment-alt';
        chatButton.appendChild(chatIcon);
        
        buttonContainer.appendChild(chatButton);
        
        const notificationBadge = document.createElement('span');
        notificationBadge.className = 'notification-badge hidden';
        notificationBadge.textContent = '0';
        buttonContainer.appendChild(notificationBadge);
        
        rightControls.appendChild(buttonContainer);
        callControls.appendChild(rightControls);
        
        callControlsContainer.appendChild(callControls);
        controlsOverlay.appendChild(callControlsContainer);
        
        videoLayout.appendChild(controlsOverlay);
        modalContent.appendChild(videoLayout);
        
        // Create chat panel
        const chatPanel = document.createElement('div');
        chatPanel.id = 'chat-panel';
        chatPanel.className = 'chat-panel';
        
        const chatHeader = document.createElement('div');
        chatHeader.className = 'chat-header';
        
        const chatTitle = document.createElement('h3');
        chatTitle.textContent = 'Chat';
        chatHeader.appendChild(chatTitle);
        
        const chatCloseBtn = document.createElement('button');
        chatCloseBtn.className = 'chat-close';
        chatCloseBtn.id = 'chat-close';
        
        const chatCloseIcon = document.createElement('i');
        chatCloseIcon.className = 'fas fa-times';
        chatCloseBtn.appendChild(chatCloseIcon);
        
        chatHeader.appendChild(chatCloseBtn);
        chatPanel.appendChild(chatHeader);
        
        const messagesContainer = document.createElement('div');
        messagesContainer.id = 'messagesContainer';
        messagesContainer.className = 'messages-container';
        chatPanel.appendChild(messagesContainer);
        
        modalContent.appendChild(chatPanel);
        modalDiv.appendChild(modalContent);
        modal.shadowRoot.appendChild(modalDiv);
        
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
        
        // Set initial chat panel state based on device type
        // Open by default on desktop, closed on mobile
        const isMobile = window.innerWidth < 992; // Using the tablet breakpoint from CSS
        this.state.set('isChatOpen', !isMobile);
        
        // Apply the initial state to the UI
        if (!isMobile && this.elements.chatPanel) {
          this.elements.chatPanel.classList.add('open');
          this.elements.chatButton.classList.add('active');
          this.elements.modal.classList.add('chat-open');
        }
      }
  
      _applyDynamicStyles() {
        // Helper functions to manipulate colors
        const hexToRgb = (hex) => {
          const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
          hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const rgbToHex = (r, g, b) => {
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        const adjustColor = (color, amount) => {
          const rgb = hexToRgb(color);
          if (!rgb) return color;
          
          return rgbToHex(
            Math.max(0, Math.min(255, rgb.r + amount)),
            Math.max(0, Math.min(255, rgb.g + amount)),
            Math.max(0, Math.min(255, rgb.b + amount))
          );
        };
        
        const hexToRgba = (hex, alpha) => {
          const rgb = hexToRgb(hex);
          if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        };
        
        // Generate color variations from config
        const primaryColor = CONFIG.UI.colors.primary;
        const secondaryColor = CONFIG.UI.colors.secondary;
        const errorColor = CONFIG.UI.colors.error;
        const bgColor = CONFIG.UI.colors.background;
        
        // Create dynamic CSS with derived colors
        const cssText = `
          :host {
            --video-bg-image: url('${CONFIG.UI.backgroundImage}');
            
            /* Primary color and variations */
            --primary-color: ${primaryColor};
            --primary-hover: ${adjustColor(primaryColor, -15)};
            --primary-active: ${adjustColor(primaryColor, -30)};
            --primary-translucent: ${hexToRgba(primaryColor, 0.15)};
            
            /* Secondary color and variations */
            --secondary-color: ${secondaryColor};
            --secondary-hover: ${adjustColor(secondaryColor, -15)};
            --secondary-active: ${adjustColor(secondaryColor, -30)};
            --secondary-translucent: ${hexToRgba(secondaryColor, 0.15)};
            
            /* Error color and variations */
            --error-color: ${errorColor};
            --error-hover: ${adjustColor(errorColor, -15)};
            --error-translucent: ${hexToRgba(errorColor, 0.15)};
          
            
            /* Background colors */
            --background-color: ${bgColor};
            --background-gradient: linear-gradient(135deg, 
              ${hexToRgba(adjustColor(bgColor, 5), 0.97)}, 
              ${hexToRgba(adjustColor(bgColor, -10), 0.97)}
            );
            --controls-gradient: linear-gradient(to bottom, 
              ${hexToRgba(adjustColor(bgColor, 5), 0.2)}, 
              ${hexToRgba(adjustColor(bgColor, -5), 0.95)}
            );
            
            /* Primary and secondary with opacity for gradients */
            --primary-30: ${hexToRgba(primaryColor, 0.3)};
            --secondary-30: ${hexToRgba(secondaryColor, 0.3)};
          }
        `;
        
        const applyStyleViaElement = () => {
          const styleElement = document.createElement('style');
          styleElement.textContent = cssText;
          this.elements.shadow.appendChild(styleElement);
        };
        
        try {
          // Use CSSStyleSheet constructor for modern browsers
          if (window.CSSStyleSheet.prototype.replaceSync) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            this.elements.shadow.adoptedStyleSheets = [
              ...this.elements.shadow.adoptedStyleSheets || [], 
              sheet
            ];
          } else {
            // Fallback for browsers that don't support Constructable Stylesheets
            applyStyleViaElement();
          }
        } catch (error) {
          if (CONFIG.DEBUG.logErrors) {
            console.error('Error applying dynamic styles:', error);
          }
          // Apply fallback method
          applyStyleViaElement();
        }
        
        // Initial responsive class application
        this._handleResize();
      }
  
      _handleResize() {
        // Update responsive classes based on window size and state
        const elements = this.elements;
        if (!elements?.modal) return;
        
        // Apply responsive classes based on screen size
        elements.modal.classList.toggle('xs-size', window.innerWidth < 500);
        elements.modal.classList.toggle('sm-size', window.innerWidth < 768);
        elements.modal.classList.toggle('md-size', window.innerWidth >= 768 && window.innerWidth < 992);
        
        // React to changes between mobile and desktop modes by using the state values
        const isMobile = this.state.get('ui.isMobile');
        const wasTablet = this.state.get('ui.isTablet');
        const isActive = this.state.get('isActive');
        
        // If we're on mobile, ensure chat is closed
        if (isMobile && isActive) {
          this.toggleChatPanel(false);
        } 
        // If we're switching from mobile to desktop during an active call, open chat
        else if (!isMobile && wasTablet && isActive) {
          this.toggleChatPanel(true);
        }
      }
  
      _initializeEventListeners() {
        const elements = this.elements;
        
        // Hangup button
        elements.hangupButton?.addEventListener('click', () => 
          this.events.emit(EventRegistry.LOCAL.CALL_END));
          
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
          this.events.emit(EventRegistry.LOCAL.CHAT_TOGGLE);
          // Reset unread count when opening chat
          if (!this.state.get('isChatOpen')) {
            this.state.set('unreadMessages', 0);
            this._updateNotificationBadge();
          }
        });
        
        // Chat close button event listener
        elements.chatClose?.addEventListener('click', () => {
          this.events.emit(EventRegistry.LOCAL.CHAT_TOGGLE, false);
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
            this.events.emit(EventRegistry.LOCAL.DEVICE_CHANGED, type, e.target.value);
          });
        });
      }
  
      _toggleSettings(forceState) {
        const elements = this.elements;
        const shouldShow = forceState !== undefined ? forceState : !elements.deviceSelectors?.classList.contains('show');
        
        if (shouldShow) {
          elements.deviceSelectors?.classList.add('show');
        } else {
          elements.deviceSelectors?.classList.remove('show');
        }
      }
  
      _updateNotificationBadge() {
        const count = this.state.get('unreadMessages');
        const badge = this.elements.notificationBadge;
        
        if (!badge) {
          // Silently fail if badge element not found
          return;
        }
        
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
        
        // Get the container element
        const container = document.getElementById('video-modal');
        
        if (container) {
          // Toggle the active class based on visibility
          container.classList.toggle('active', isShowing);
        }
        
        if (elements.modal) {
          elements.modal.classList.toggle('show', isShowing);
          // Use display flex through CSS instead of JavaScript
          elements.modal.style.display = isShowing ? 'flex' : 'none';
        }
        
        if (elements.placeholder) {
          // Show the placeholder when starting a call, but hide it once call is active
          elements.placeholder.classList.toggle('show', isShowing && !isCallActive);
        }
        
        // Make sure the controls are visible or hidden based on call state
        if (elements.settingsButton) {
          elements.settingsButton.classList.toggle('show', isCallActive);
        }
        
        if (elements.hangupButton) {
          elements.hangupButton.classList.toggle('show', isCallActive);
        }
        
        if (elements.chatButton) {
          elements.chatButton.classList.toggle('show', isCallActive);
        }
  
        // Control container visibility with classes
        const controlsContainer = elements.shadow.querySelector('.call-controls-container');
        if (controlsContainer) {
          controlsContainer.classList.toggle('visible', isCallActive);
        }
        
        // Ensure the left controls section is visible with classes
        const leftControls = elements.shadow.querySelector('.left-controls');
        if (leftControls) {
          leftControls.classList.toggle('show', isCallActive);
        }
        
        // Ensure the right controls section is visible with classes
        const rightControls = elements.shadow.querySelector('.right-controls');
        if (rightControls) {
          rightControls.classList.toggle('show', isCallActive);
        }
        
        // Ensure the main controls section is visible with classes
        const mainControls = elements.shadow.querySelector('.main-controls');
        if (mainControls) {
          mainControls.classList.toggle('show', isCallActive);
        }
        
        if (elements.root) {
          elements.root.classList.toggle('active', isCallActive);
        }
        
        // When call becomes active, set chat panel according to device type
        if (isCallActive) {
          const isMobile = window.innerWidth < 992;
          
          // For desktop, always open chat panel when call becomes active
          if (!isMobile) {
            this.toggleChatPanel(true);
          } else {
            // For mobile, always close chat panel when call becomes active
            this.toggleChatPanel(false);
          }
        } else {
          // Hide chat panel when call is not active
          this.toggleChatPanel(false);
        }
        
        if (!isShowing && elements.localVideo) {
          elements.localVideo.srcObject = null;
          this._toggleLocalVideo(false);
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
        
        // Determine message group type
        const groupClass = sender === 'user' ? 'user-messages' : 'ai-messages';
        
        // Check if the last group is already from the same sender that we can reuse
        let lastGroup = messagesContainer.lastElementChild;
        if (!lastGroup || !lastGroup.classList.contains('messages-group') || !lastGroup.classList.contains(groupClass)) {
          // Create a new group only if the last group is not from the same sender
          lastGroup = document.createElement('div');
          lastGroup.className = `messages-group ${groupClass}`;
          messagesContainer.appendChild(lastGroup);
        }
        
        // Remove 'last' class from previous messages in this group
        const previousMessages = lastGroup.querySelectorAll('.message.last');
        previousMessages.forEach(msg => msg.classList.remove('last'));
        
        // Create the new message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message last';
        messageDiv.textContent = text;
        lastGroup.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Increment unread messages if chat is closed and this is an AI message
        if (sender === 'ai' && !this.state.get('isChatOpen') && !this.state.get('aiMessageInProgress')) {
          const currentCount = this.state.get('unreadMessages');
          this.state.set('unreadMessages', currentCount + 1);
          this._updateNotificationBadge();
        }
        
        return messageDiv;
      }
  
      updatePartialMessage(text) {
        let currentDiv = this.state.get('currentPartialMessageDiv');
        const messagesContainer = this.elements.messagesContainer;
        
        if (!currentDiv) {
          // Check if the last group is already a user message group that we can reuse
          let userGroup = messagesContainer.lastElementChild;
          if (!userGroup || !userGroup.classList.contains('messages-group') || !userGroup.classList.contains('user-messages')) {
            // Create a new group only if the last group is not a user message group
            userGroup = document.createElement('div');
            userGroup.className = 'messages-group user-messages';
            messagesContainer.appendChild(userGroup);
          }
          
          // Remove 'last' class from previous messages in this group
          const previousMessages = userGroup.querySelectorAll('.message.last');
          previousMessages.forEach(msg => msg.classList.remove('last'));
          
          // Create a new partial message
          currentDiv = document.createElement('div');
          currentDiv.className = 'message partial first last';
          userGroup.appendChild(currentDiv);
          this.state.set('currentPartialMessageDiv', currentDiv);
        } else if (currentDiv.classList.contains('first') && currentDiv.dataset.updated) {
          currentDiv.classList.remove('first');
        }
        
        currentDiv.dataset.updated = 'true';
        
        currentDiv.textContent = text;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return currentDiv;
      }
  
      showError(error) {
        this.logger.error('UI Error:', error);
        
        // Group similar errors together for cleaner handling
        const errorMessages = {
          // Camera/microphone permission errors
          NotAllowedError: 'Camera/Microphone access denied. Please check your browser permissions.',
          PermissionDeniedError: 'Camera/Microphone access denied. Please check your browser permissions.',
          
          // Device not found or in use
          NotFoundError: 'Camera/Microphone not found. Please check your device connections.',
          NotReadableError: 'Device in use by another application. Please close other apps using your camera/microphone.',
          TrackStartError: 'Device in use by another application. Please close other apps using your camera/microphone.',
          
          // Configuration errors
          OverconstrainedError: 'The requested device settings are not supported by your device.',
          TypeError: 'Invalid media constraints. Please check your device settings.'
        };
        
        // Get the error message or use a fallback with the error details
        const message = errorMessages[error.name] || `${error.name}: ${error.message}` || 'An error occurred';
        alert(message);
      }
  
      /**
       * Helper method to toggle local video visibility
       * @param {boolean} show - Whether to show or hide the video
       */
      _toggleLocalVideo(show) {
        const localVideo = this.elements.localVideo;
        if (!localVideo) return;
        
        if (show) {
          // Allow time for video to start playing before showing
          localVideo.classList.remove('hidden');
          
          // Force opacity to make sure it's visible
          requestAnimationFrame(() => {
            localVideo.style.opacity = '1';
          });
        } else {
          localVideo.classList.add('hidden');
          localVideo.style.opacity = '0';
        }
      }
    }
  
    /**
     * DeviceManager - Handles media device enumeration and management
     * Manages audio and video input/output devices
     */
    class DeviceManager {
      constructor(events, state, logger) {
        this.events = events;
        this.state = state;
        this.logger = logger || new Logger('DeviceManager');
        
        navigator.mediaDevices.addEventListener('devicechange', () => {
          this.loadDevices();
        });
      }
  
      _handleError(message, error) {
        this.logger.error(message, error);
        if (this.events) {
          this.events.emit(EventRegistry.LOCAL.ERROR, error);
        }
      }
  
      async loadDevices() {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          this.events.emit(EventRegistry.LOCAL.DEVICES_LOADED, devices);
          return devices;
        } catch (error) {
          this._handleError('Failed to load devices:', error);
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
              // Get the UI manager to handle video visibility
              const uiManager = window.SignalWireDemo?.ui;
              if (uiManager && newTrack) {
                uiManager._toggleLocalVideo(true);
              } else if (elements && elements.localVideo) {
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
          this._handleError('Error updating media stream:', error);
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
          this._handleError('Error setting audio output:', error);
        }
      }
    }
  
    /**
     * CallManager - Handles call initialization and management
     * Manages video/audio call setup, connection, and teardown
     */
    class CallManager {
      constructor(events, state, deviceManager, logger) {
        this.events = events;
        this.state = state;
        this.deviceManager = deviceManager;
        this.logger = logger || new Logger('CallManager');
        this._endingCall = false; // Guard against recursive call ending
      }
  
      async startDemo(demoType) {
        const endpoint = CONFIG.ENDPOINTS[demoType];
        if (!endpoint) {
          this.events.emit(EventRegistry.LOCAL.ERROR, new Error('Invalid demo type'));
          return;
        }
        
        this.logger.log(`Starting demo: ${demoType}`);
        await this.makeCall(endpoint.path, endpoint.supportsVideo, endpoint.supportsAudio);
      }
  
      async makeCall(destination, videoEnabled, audioEnabled) {
        if (!destination) {
          this.events.emit(EventRegistry.LOCAL.ERROR, new Error('Destination is required'));
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
          this.events.emit(EventRegistry.LOCAL.UI_UPDATE, true);
          // Clear chat messages when starting a new call
          this.events.emit(EventRegistry.LOCAL.CHAT_CLEAR);
  
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
  
          // Ensure SignalWire SDK is loaded
          await loadSignalWireSDK();
  
          let client = this.state.get('client');
          if (!client) {
            client = await SignalWire.SignalWire({
              token: CONFIG.TOKEN,
              debug: CONFIG.DEBUG.SIGNALWIRE
            });
            
            this.state.set('client', client);
            this.events.emit(EventRegistry.LOCAL.CLIENT_CREATED, client);
          }
  
          // Clean up any existing stream
          this._cleanupExistingStream();
          
          // Get media constraints
          const constraints = await this.deviceManager.getMediaConstraints();
          
          // Get new media stream
          let localStream;
          try {
            // Use the initial stream if we have it, otherwise request a new one
            if (initialStream) {
              localStream = initialStream;
            } else {
              localStream = await navigator.mediaDevices.getUserMedia({
                audio: audioEnabled && constraints.audio,
                video: videoEnabled && constraints.video
              });
            }
          } catch (streamError) {
            if (streamError.name === 'OverconstrainedError') {
              // Fallback to default devices
              localStream = await navigator.mediaDevices.getUserMedia({
                audio: audioEnabled,
                video: videoEnabled && {
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }
              });
            } else {
              throw streamError;
            }
          }
          
          // Set the new stream
          this.state.set('localStream', localStream);
  
          const elements = this.state.get('ui.elements');
          elements.localVideo.srcObject = localStream;
          
          // Show local video when we have a stream
          if (videoEnabled && localStream.getVideoTracks().length > 0) {
            // Get a reference to the UI manager from the app
            const uiManager = window.SignalWireDemo.ui;
            
            // Set a flag to track if the video has been shown
            let videoShown = false;
            
            // Try to show immediately if possible
            if (elements.localVideo.readyState >= 2) { // HAVE_CURRENT_DATA or higher
              if (uiManager) {
                uiManager._toggleLocalVideo(true);
              } else {
                elements.localVideo.classList.remove('hidden');
              }
              videoShown = true;
            }
            
            // Also listen for metadata loading as a fallback
            if (!videoShown) {
              elements.localVideo.addEventListener('loadedmetadata', () => {
                if (uiManager) {
                  uiManager._toggleLocalVideo(true);
                } else {
                  elements.localVideo.classList.remove('hidden');
                }
              }, { once: true });
            }
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
          this._handleError('Call failed:', error);
        }
      }
      
      _cleanupExistingStream() {
        // Enhanced helper method to clean up existing stream
        const localStream = this.state.get('localStream');
        if (localStream) {
          localStream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          
          // Clear video elements that might be using this stream
          const elements = this.state.get('ui.elements');
          if (elements && elements.localVideo) {
            elements.localVideo.srcObject = null;
            elements.localVideo.classList.add('hidden');
          }
          
          this.state.set('localStream', null);
        }
      }
  
      _setupCallEventListeners(call) {
        if (!call) return;
  
        call.on('active', () => {
          if (!this.state.get('isActive')) {
            this.endCall();
            return;
          }
          
          // Let the UI manager handle showing/hiding elements
          this.events.emit(EventRegistry.LOCAL.UI_UPDATE, true);
          const elements = this.state.get('ui.elements');
          
          // Add active class to root element
          if (elements.root) {
            elements.root.classList.add('active');
          }
          
          // Hide the placeholder
          if (elements.placeholder) {
            elements.placeholder.classList.remove('show');
          }
          
          // Make sure local video is visible if we have video tracks
          const localStream = this.state.get('localStream');
          if (localStream && localStream.getVideoTracks().length > 0) {
            // Get the UI manager for proper toggling
            const uiManager = window.SignalWireDemo.ui;
            
            if (uiManager) {
              uiManager._toggleLocalVideo(true);
            } else if (elements.localVideo) {
              elements.localVideo.classList.remove('hidden');
            }
            
            // Force opacity to 1 to ensure visibility
            if (elements.localVideo) {
              elements.localVideo.style.opacity = '1';
            }
          }
        });
  
        call.on('destroy', () => this.endCall());
        call.on('error', (error) => this._handleError('Call error:', error));
      }
  
      async endCall() {
        // Guard against recursive call ending
        if (this._endingCall) {
          this.logger.log('Call already ending, ignoring duplicate request');
          return;
        }
        
        this._endingCall = true;
        this.state.set('isActive', false);
  
        try {
          const currentCall = this.state.get('currentCall');
          if (currentCall?.state === 'active') {
            this.logger.log('Hanging up active call');
            await currentCall.hangup();
          }
          
          // Clean up the stream using our helper method
          this._cleanupExistingStream();
          
          // Clear the video element
          const elements = this.state.get('ui.elements');
          if (elements) {
            elements.localVideo.srcObject = null;
          }
  
          this.events.emit(EventRegistry.LOCAL.UI_UPDATE, false);
          this.state.set('currentCall', null);
        } catch (error) {
          this.logger.error('Error ending call:', error);
          this.events.emit(EventRegistry.LOCAL.UI_UPDATE, false);
        } finally {
          // Always reset the guard flag
          this._endingCall = false;
        }
      }
  
      _handleError(message, error) {
        this.logger.error(message, error);
        // End the call if it was initiated
        this.endCall();
        // Emit the error for UI display
        this.events.emit(EventRegistry.LOCAL.ERROR, error);
      }
    }
  
    /**
     * ChatManager - Handles chat functionality
     * Manages AI-powered chat interactions
     */
    class ChatManager {
      constructor(events, state, logger) {
        this.events = events;
        this.state = state;
        this.logger = logger || new Logger('ChatManager');
      }
  
      setupAIEventListeners(client) {
        if (!client) return;
        
        // AI partial result (typing indicator)
        client.on('ai.partial_result', (params) => {
          this.logger.event('ai.partial_result', params.text);
          this.events.emit(EventRegistry.SIGNALWIRE.CHAT_PARTIAL, params.text);
        });
  
        // AI speech detection (user speaking)
        client.on('ai.speech_detect', (params) => {
          const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, '');
          this.logger.event('ai.speech_detect', cleanText);
          this.events.emit(EventRegistry.SIGNALWIRE.CHAT_SPEECH, cleanText);
        });
  
        // AI completion (final response)
        client.on('ai.completion', (params) => {
          this.logger.event('ai.completion', params.text);
          this.events.emit(EventRegistry.SIGNALWIRE.CHAT_COMPLETION, params.text);
        });
  
        // AI response utterance (spoken response)
        client.on('ai.response_utterance', (params) => {
          this.logger.event('ai.response_utterance', params.utterance);
          if (params.utterance) {
            this.events.emit(EventRegistry.SIGNALWIRE.CHAT_UTTERANCE, params.utterance);
          }
        });
      }
    }
  
    /**
     * Dynamically loads the SignalWire SDK if it's not already loaded
     * @returns {Promise} A promise that resolves when the SDK is loaded
     */
    function loadSignalWireSDK() {
      return new Promise((resolve, reject) => {
        // Check if SDK is already loaded
        if (window.SignalWire) {
          logger.state('SignalWireSDK', 'already_loaded');
          resolve(window.SignalWire);
          return;
        }
        
        logger.state('SignalWireSDK', 'loading');
        
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdn.signalwire.com/@signalwire/js@dev';
        script.async = true;
        
        // Set up load and error handlers
        script.onload = () => {
          if (window.SignalWire) {
            logger.state('SignalWireSDK', 'loaded');
            resolve(window.SignalWire);
          } else {
            const error = new Error('SignalWire SDK loaded but global object not found');
            logger.error('SignalWireSDK', error.message);
            reject(error);
          }
        };
        
        script.onerror = () => {
          const error = new Error('Failed to load SignalWire SDK');
          logger.error('SignalWireSDK', 'error', error.message);
          reject(error);
        };
        
        // Add to document
        document.head.appendChild(script);
      });
    }
  
    /**
     * Dynamically loads Font Awesome
     * @returns {Promise} A promise that resolves when Font Awesome is loaded
     */
    function loadFontAwesome() {
      return new Promise((resolve, reject) => {
        logger.state('FontAwesome', 'loading');
        
        // Create link element for Font Awesome
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        
        // Set up load and error handlers
        link.onload = () => {
          logger.state('FontAwesome', 'loaded');
          resolve();
        };
        
        link.onerror = () => {
          const error = new Error('Failed to load Font Awesome');
          logger.error('FontAwesome', error.message);
          reject(error);
        };
        
        // Add to document
        document.head.appendChild(link);
      });
    }
  
    /**
     * App - Main application class that coordinates all modules
     * Initializes and connects all components of the widget
     */
    class App {
      constructor() {
        // Create logger for this app instance
        this.logger = new Logger('App');
        
        // Initialize event bus for inter-module communication
        this.events = new EventEmitter(this.logger);
        
        // Initialize central state
        this.state = new AppState(this.events, this.logger);
        
        // Initialize modules
        this.ui = new UIManager(this.events, this.state, this.logger);
        this.deviceManager = new DeviceManager(this.events, this.state, this.logger);
        this.callManager = new CallManager(this.events, this.state, this.deviceManager, this.logger);
        this.chatManager = new ChatManager(this.events, this.state, this.logger);
        
        // Set up event handlers between modules
        this._wireUpEvents();
        
        // Initialize UI asynchronously with FontAwesome loading
        this._initializeUI();
        
        // Load devices
        this.deviceManager.loadDevices();
      }
  
      async _initializeUI() {
        try {
          // Load Font Awesome before initializing UI
          await loadFontAwesome().catch(error => {
            // Log the error but continue without breaking
            this.logger.error('Font Awesome loading failed, continuing without icons:', error);
          });
          
          // Initialize UI
          await this.ui.initialize();
          
          // Initialize demo buttons
          this._initializeDemoButtons();
        } catch (error) {
          this.logger.error('Error initializing UI:', error);
          
          // Try to initialize UI anyway as fallback
          try {
            await this.ui.initialize();
            this._initializeDemoButtons();
            this.logger.log('UI initialized in fallback mode');
          } catch (fallbackError) {
            this.logger.error('Fatal error: Could not initialize UI even in fallback mode:', fallbackError);
          }
        }
      }
  
      _wireUpEvents() {
        // UI events
        this.events.on(EventRegistry.LOCAL.UI_UPDATE, isShowing => this.ui.updateUI(isShowing));
        
        // Device events
        this.events.on(EventRegistry.LOCAL.DEVICES_LOADED, devices => {
          this.ui.updateDeviceSelectors(devices);
          this.ui.restoreDevicePreferences();
        });
        
        this.events.on(EventRegistry.LOCAL.DEVICE_CHANGED, async (type, value) => {
          if (type === 'audioOutput') {
            await this.deviceManager.updateAudioOutput(value);
          } else {
            await this.deviceManager.updateMediaStream(type);
          }
        });
        
        // Call events
        this.events.on(EventRegistry.LOCAL.CALL_END, () => this.callManager.endCall());
        
        // Chat interface events
        this.events.on(EventRegistry.LOCAL.CHAT_TOGGLE, forceState => this.ui.toggleChatPanel(forceState));
        this.events.on(EventRegistry.LOCAL.CHAT_CLEAR, () => this.ui.clearChatMessages());
        
        // SignalWire chat message events
        this.events.on(EventRegistry.SIGNALWIRE.CHAT_PARTIAL, text => this.ui.updatePartialMessage(text));
  
        this.events.on(EventRegistry.SIGNALWIRE.CHAT_SPEECH, text => {
          const currentDiv = this.state.get('currentPartialMessageDiv');
          if (currentDiv) {
            currentDiv.textContent = text;
            currentDiv.classList.remove('partial');
            currentDiv.classList.add('last');
            this.state.set('currentPartialMessageDiv', null);
          } else {
            this.ui.appendMessage(text, 'user');
          }
        });
  
        this.events.on(EventRegistry.SIGNALWIRE.CHAT_COMPLETION, text => {
          const currentDiv = this.state.get('currentPartialMessageDiv');
          if (currentDiv) {
            currentDiv.textContent = text;
            currentDiv.classList.remove('partial');
            currentDiv.classList.add('last');
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
  
        this.events.on(EventRegistry.SIGNALWIRE.CHAT_UTTERANCE, utterance => {
          const elements = this.state.get('ui.elements');
          let currentDiv = this.state.get('currentPartialMessageDiv');
          
          if (!currentDiv) {
            // Get the last message group in the container
            const messagesContainer = elements.messagesContainer;
            let aiGroup = messagesContainer.lastElementChild;
            
            // Check if last group is already an AI message group we can reuse
            if (!aiGroup || !aiGroup.classList.contains('messages-group') || !aiGroup.classList.contains('ai-messages')) {
              // Create a new group only if the last group is not an AI message group
              aiGroup = document.createElement('div');
              aiGroup.className = 'messages-group ai-messages';
              messagesContainer.appendChild(aiGroup);
            }
            
            // Remove 'last' class from previous message in this group
            const previousMessages = aiGroup.querySelectorAll('.message.last');
            previousMessages.forEach(msg => msg.classList.remove('last'));
            
            // Create a new partial message
            currentDiv = document.createElement('div');
            currentDiv.className = 'message partial first last';
            aiGroup.appendChild(currentDiv);
            this.state.set('currentPartialMessageDiv', currentDiv);
            
            // Set flag that an AI message is in progress
            this.state.set('aiMessageInProgress', true);
            
            // Only increment unread count when a new AI message starts and chat is closed
            if (!this.state.get('isChatOpen')) {
              const currentCount = this.state.get('unreadMessages');
              this.state.set('unreadMessages', currentCount + 1);
              this.ui._updateNotificationBadge();
            }
          } else if (currentDiv.classList.contains('first') && currentDiv.dataset.updated) {
            // Remove 'first' class after the first update to prevent re-triggering the animation
            currentDiv.classList.remove('first');
          }
          
          // Mark as updated
          currentDiv.dataset.updated = 'true';
          
          currentDiv.textContent += " " + utterance;
          elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        });
        
        // Client events
        this.events.on(EventRegistry.LOCAL.CLIENT_CREATED, client => this.chatManager.setupAIEventListeners(client));
        
        // Error handling
        this.events.on(EventRegistry.LOCAL.ERROR, error => this.ui.showError(error));
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
    
    // Cleanup on page hide
    window.addEventListener('pagehide', () => app.cleanup());
  })(); 