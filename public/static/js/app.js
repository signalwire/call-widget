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
  // Simplified debug configuration
  DEBUG: {
    enabled: true,
    level: 'error' // 'debug' | 'info' | 'warn' | 'error'
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
  constructor(category) {
    this.category = category;
    this.enabled = CONFIG.DEBUG.enabled;
    this.level = CONFIG.DEBUG.level;
  }
  
  debug(message, ...args) {
    if (!this.enabled || this.level === 'info' || this.level === 'warn' || this.level === 'error') return;
    console.log(`[${this.category}] DEBUG: ${message}`, ...args);
  }
  
  info(message, ...args) {
    if (!this.enabled || this.level === 'warn' || this.level === 'error') return;
    console.log(`[${this.category}] ${message}`, ...args);
  }
  
  warn(message, ...args) {
    if (!this.enabled || this.level === 'error') return;
    console.warn(`[${this.category}] WARN: ${message}`, ...args);
  }
  
  error(message, error, events) {
    if (!this.enabled) return;
    
    console.error(`[${this.category}] ERROR: ${message}`, error);
    
    // Emit error event if events system is available
    if (events) {
      events.emit(EventRegistry.LOCAL.ERROR, error);
    }
    
    return error;
  }
}

// Create a global logger instance for shared modules
const logger = new Logger('SignalWireWidget');

/**
 * EventRegistry - Central registry for all application events
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
    CALL_TOGGLE: 'call:toggle',
    
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
    this.events = new Map();  // Changed from WeakMap to Map since we use strings as keys
    this.logger = logger || new Logger('EventEmitter', { logEvents: false }); // Temporary logger if none provided
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
  }

  off(event, listener) {
    if (!this.events.has(event)) return;
    this.events.get(event).delete(listener);
    // Cleanup empty event sets
    if (this.events.get(event).size === 0) {
      this.events.delete(event);
    }
  }

  emit(event, ...args) {
    if (!this.events.has(event)) {
      // Log warning for unknown events
      this.logger.warn(`No listeners registered for event: ${event}. This might be an unknown or misspelled event type.`);
      return;
    }
    this.events.get(event).forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        this.logger.error(`Error in event listener for ${event}`, error);
      }
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
      // Core state
      initialized: false,
      active: false,
      
      // Call state
      client: null,
      currentCall: null,
      localStream: null,
      
      // Chat state
      chatOpen: false,
      unreadMessages: 0,
      currentPartialMessage: null,
      aiMessageInProgress: false,
      
      // UI state
      ui: {
        elements: null,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 992
      }
    };
    
    // Listen for window resize
    window.addEventListener('resize', this._handleResize.bind(this));
  }
  
  _handleResize() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 992;
    
    if (this.state.ui.isMobile !== isMobile) {
      this.set('ui.isMobile', isMobile);
    }
    
    if (this.state.ui.isTablet !== isTablet) {
      this.set('ui.isTablet', isTablet);
    }
  }

  get(path) {
    return this._getNestedProperty(this.state, path);
  }

  set(path, value) {
    const oldValue = this._getNestedProperty(this.state, path);
    if (oldValue === value) return;
    
    this._setNestedProperty(this.state, path, value);
    this.logger.debug(`State changed: ${path}`, { from: oldValue, to: value });
    this.events.emit(EventRegistry.STATE_CHANGED, path, value, oldValue);
  }

  _getNestedProperty(obj, path) {
    return path.split('.').reduce((current, part) => 
      current && current[part] !== undefined ? current[part] : undefined, obj);
  }

  _setNestedProperty(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    
    const target = parts.reduce((current, part) => {
      if (!current[part]) current[part] = {};
      return current[part];
    }, obj);
    
    target[last] = value;
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Video Chat');
    modal.setAttribute('aria-modal', 'true');
    
    // Create shadow DOM
    modal.attachShadow({mode: 'open'});
    
    // Add CSS stylesheets using proper DOM methods
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'static/css/video-modal.css'
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
    connectingText.textContent = 'Connecting to agent';
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
    
    // Add mute button before hangup button
    const muteButton = document.createElement('button');
    muteButton.id = 'muteButton';
    muteButton.className = 'main-button';
    
    const muteIcon = document.createElement('i');
    muteIcon.className = 'fas fa-microphone';
    muteButton.appendChild(muteIcon);
    
    mainControls.appendChild(muteButton);
    
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
    chatTitle.textContent = 'Conversation Log';
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
      muteButton: shadow.getElementById('muteButton'),
      shadow: shadow,
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
    // Simplified color manipulation
    const hexToRgba = (hex, alpha) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return `rgba(0, 0, 0, ${alpha})`;
      
      const [, r, g, b] = result;
      return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
    };
    
    const adjustColor = (hex, amount) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return hex;
      
      const [, r, g, b] = result;
      const adjust = (val) => {
        const num = Math.max(0, Math.min(255, parseInt(val, 16) + amount));
        return num.toString(16).padStart(2, '0');
      };
      
      return `#${adjust(r)}${adjust(g)}${adjust(b)}`;
    };
    
    // Generate color variations from config
    const { primary: primaryColor, secondary: secondaryColor, error: errorColor, background: bgColor } = CONFIG.UI.colors;
    
    // Create dynamic CSS with derived colors
    const cssText = `
      :host {
        --video-bg-image: url('${CONFIG.UI.backgroundImage}');
        
        /* Colors and variations */
        --primary-color: ${primaryColor};
        --primary-hover: ${adjustColor(primaryColor, -15)};
        --primary-active: ${adjustColor(primaryColor, -30)};
        --primary-translucent: ${hexToRgba(primaryColor, 0.15)};
        --primary-30: ${hexToRgba(primaryColor, 0.3)};
        
        --secondary-color: ${secondaryColor};
        --secondary-hover: ${adjustColor(secondaryColor, -15)};
        --secondary-active: ${adjustColor(secondaryColor, -30)};
        --secondary-translucent: ${hexToRgba(secondaryColor, 0.15)};
        --secondary-30: ${hexToRgba(secondaryColor, 0.3)};
        
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
      }
    `;
    
    try {
      if (window.CSSStyleSheet.prototype.replaceSync) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        this.elements.shadow.adoptedStyleSheets = [
          ...this.elements.shadow.adoptedStyleSheets || [], 
          sheet
        ];
      } else {
        const styleElement = document.createElement('style');
        styleElement.textContent = cssText;
        this.elements.shadow.appendChild(styleElement);
      }
    } catch (error) {
      this.logger.error('Error applying dynamic styles:', error);
      
      // Fallback to direct style element
      const styleElement = document.createElement('style');
      styleElement.textContent = cssText;
      this.elements.shadow.appendChild(styleElement);
    }
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
    const isActive = this.state.get('active');
    
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
      
    // Mute button
    elements.muteButton?.addEventListener('click', () => 
      this.events.emit(EventRegistry.LOCAL.CALL_TOGGLE));
    
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
        e.stopPropagation();
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
      elements.settingsButton?.classList.add('active');
    } else {
      elements.deviceSelectors?.classList.remove('show');
      elements.settingsButton?.classList.remove('active');
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

    if (elements.muteButton) {
      elements.muteButton.classList.toggle('show', isCallActive);
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
    this.state.set('currentPartialMessage', null);
    this.state.set('unreadMessages', 0);
    this._updateNotificationBadge();
  }

  appendMessage(text, sender) {
    const messagesContainer = this.elements.messagesContainer;
    if (!messagesContainer) return;

    // Determine message group type
    const groupClass = sender === 'user' ? 'user-messages' : 'ai-messages';

    // Create a new message group
    const messageGroup = document.createElement('div');
    messageGroup.className = `messages-group ${groupClass}`;
    messagesContainer.appendChild(messageGroup);

    // Create the message div
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message last';
    messageDiv.textContent = text;
    messageGroup.appendChild(messageDiv);

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Increment unread messages if chat is closed and this is an AI message
    if (sender === 'ai' && !this.state.get('isChatOpen')) {
      const currentCount = this.state.get('unreadMessages');
      this.state.set('unreadMessages', currentCount + 1);
      this._updateNotificationBadge();
    }

    return messageDiv;
  }

  _updateChatMessage(text, isPartial = false) {
    const messagesContainer = this.elements.messagesContainer;
    if (!messagesContainer) return;

    let currentDiv = this.state.get('currentPartialMessageDiv');

    if (!currentDiv) {
      // Create new message group for AI
      const messageGroup = document.createElement('div');
      messageGroup.className = 'messages-group ai-messages';
      messagesContainer.appendChild(messageGroup);

      // Create new message div
      currentDiv = document.createElement('div');
      currentDiv.className = `message ${isPartial ? 'partial' : ''} first last`;
      messageGroup.appendChild(currentDiv);

      if (isPartial) {
        this.state.set('currentPartialMessageDiv', currentDiv);
      }
    }

    currentDiv.textContent = text;

    if (!isPartial) {
      currentDiv.classList.remove('partial');
      this.state.set('currentPartialMessageDiv', null);

      // Only increment unread count for final messages when chat is closed
      if (!this.state.get('isChatOpen')) {
        const currentCount = this.state.get('unreadMessages');
        this.state.set('unreadMessages', currentCount + 1);
        this._updateNotificationBadge();
      }
    }

    // Auto-scroll to bottom
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
    if (!this.elements.localVideo) return;
    
    this.elements.localVideo.classList.toggle('hidden', !show);
    requestAnimationFrame(() => {
      this.elements.localVideo.style.opacity = show ? '1' : '0';
    });
  }

  /**
   * Toggle mute state and update button appearance
   * @param {boolean} isMuted - Whether audio is muted
   */
  toggleMute(isMuted) {
    const muteButton = this.elements.muteButton;
    if (!muteButton) return;
    
    const icon = muteButton.querySelector('i');
    
    if (isMuted) {
      muteButton.classList.add('muted');
      icon.className = 'fas fa-microphone-slash';
    } else {
      muteButton.classList.remove('muted');
      icon.className = 'fas fa-microphone';
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
    this._deviceWatcher = null;
    this._isMuted = false; // Track mute state
    // Don't set up watcher immediately, wait for SDK
    this._initializeWhenReady();
  }

  async _initializeWhenReady() {
    try {
      // Wait for SignalWire SDK to be available
      await this._waitForSignalWire();
      await this._setupDeviceWatcher();
    } catch (error) {
      this._handleError('Failed to initialize device manager:', error);
    }
  }

  async _waitForSignalWire() {
    // Maximum time to wait for SDK (30 seconds, increased from 10)
    const maxWaitTime = 30000;
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (!window.SignalWire) {
      if (Date.now() - startTime > maxWaitTime) {
        // Try to load SDK if not present
        try {
          await loadSignalWireSDK();
          break; // If successful, exit the loop
        } catch (error) {
          throw new Error('Timeout waiting for SignalWire SDK: ' + error.message);
        }
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  async _setupDeviceWatcher() {
    try {
      // Create a watcher for all device types
      this._deviceWatcher = await SignalWire.WebRTC.createDeviceWatcher({
        targets: ['camera', 'microphone', 'speaker']
      });
      
      // Simplified event handling - using only the combined 'changed' event
      this._deviceWatcher.on('changed', (event) => {
        this.logger.event('Devices changed:', {
          added: event.changes.added,
          removed: event.changes.removed,
          updated: event.changes.updated
        });
        this.events.emit(EventRegistry.LOCAL.DEVICES_LOADED, event.devices);
      });

    } catch (error) {
      this._handleError('Failed to setup device watcher:', error);
    }
  }

  _handleError(message, error) {
    this.logger.error(message, error);
    this.events.emit(EventRegistry.LOCAL.ERROR, error);
  }

  async loadDevices() {
    try {
      // Just enumerate devices without filtering - directly emit all devices
      const devices = await SignalWire.WebRTC.enumerateDevices();
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

  /**
   * Set microphone mute state directly
   * @param {boolean} muted - Whether to mute (true) or unmute (false)
   */
  setMicrophoneMuted(muted) {
    this._isMuted = muted;
    const localStream = this.state.get('localStream');
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
      }
    }

    // Also mute the call audio if in a call
    const currentCall = this.state.get('currentCall');
    if (currentCall && currentCall.localStream) {
      const callAudioTrack = currentCall.localStream.getAudioTracks()[0];
      if (callAudioTrack) {
        callAudioTrack.enabled = !muted;
      }
    }
    return muted;
  }

  /**
   * Toggle microphone mute state
   * @returns {boolean} New mute state (true if muted, false if unmuted)
   */
  toggleMicrophone() {
    this._isMuted = !this._isMuted;
    return this.setMicrophoneMuted(this._isMuted);
  }

  async updateMediaStream(changedDeviceType) {
    if (!this.state.get('active')) return;
    
    try {
      const constraints = await this.getMediaConstraints();
      const mediaConstraints = {
        audio: changedDeviceType === 'audioInput' ? constraints.audio : false,
        video: changedDeviceType === 'videoInput' ? constraints.video : false
      };

      // Get new stream using SignalWire's getUserMedia
      const newStream = await SignalWire.WebRTC.getUserMedia(mediaConstraints);
      
      const localStream = this.state.get('localStream');
      const elements = this.state.get('ui.elements');
      
      if (localStream) {
        // If updating audio, only stop and replace the audio track
        if (changedDeviceType === 'audioInput') {
          localStream.getAudioTracks().forEach(track => track.stop());
          const newAudioTrack = newStream.getAudioTracks()[0];
          if (newAudioTrack) {
            // Remove old audio tracks and add the new one
            localStream.getAudioTracks().forEach(track => localStream.removeTrack(track));
            localStream.addTrack(newAudioTrack);
            
            // Apply mute state if needed
            if (this._isMuted) {
              newAudioTrack.enabled = false;
            }
          }

          // Update the call if active
          const currentCall = this.state.get('currentCall');
          if (currentCall) {
            await currentCall.updateMicrophone(constraints.audio);
            
            // Apply mute state to call audio if needed
            if (this._isMuted && currentCall.localStream) {
              const callAudioTrack = currentCall.localStream.getAudioTracks()[0];
              if (callAudioTrack) {
                callAudioTrack.enabled = false;
              }
            }
          }
        }
        // If updating video, only stop and replace the video track
        else if (changedDeviceType === 'videoInput') {
          localStream.getVideoTracks().forEach(track => track.stop());
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack) {
            // Remove old video tracks and add the new one
            localStream.getVideoTracks().forEach(track => localStream.removeTrack(track));
            localStream.addTrack(newVideoTrack);
            
            const uiManager = window.SignalWireDemo?.ui;
            if (uiManager) {
              uiManager._toggleLocalVideo(true);
            }
          }

          // Update the call if active
          const currentCall = this.state.get('currentCall');
          if (currentCall) {
            await currentCall.updateCamera(constraints.video);
          }
        }
      } else {
        this.state.set('localStream', newStream);
        elements.localVideo.srcObject = newStream;
        
        // If this is an audio device and we're muted, mute the new device
        if (changedDeviceType === 'audioInput' && this._isMuted) {
          const audioTrack = newStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
          }
        }
      }
    } catch (error) {
      this._handleError('Error updating media stream:', error);
    }
  }

  async updateAudioOutput(deviceId) {
    try {
      // First check if output selection is supported at all
      if (!SignalWire.WebRTC.supportsMediaOutput()) {
        throw new Error('Audio output selection is not supported in this browser');
      }

      // Update the call if it exists
      const currentCall = this.state.get('currentCall');
      if (currentCall) {
        await currentCall.updateSpeaker({ deviceId });
      }

    } catch (error) {
      let errorMessage = 'Error setting audio output: ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Permission denied to access audio output devices.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'The selected audio output device was not found.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Audio output selection is not allowed in this context.';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      this._handleError(errorMessage, error);
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
    this._endingCall = false;
  }

  /**
   * Centralized media stream cleanup
   * @private
   */
  _cleanupMediaStream() {
    const localStream = this.state.get('localStream');
    const elements = this.state.get('ui.elements');
    
    if (!localStream) return;
    
    // Stop all tracks
    localStream.getTracks().forEach(track => track.stop());
    
    // Clean up video element
    if (elements?.localVideo) {
      elements.localVideo.srcObject = null;
      elements.localVideo.classList.add('hidden');
    }
    
    // Update state
    this.state.set('localStream', null);
  }

  async startDemo(demoType) {
    const endpoint = CONFIG.ENDPOINTS[demoType];
    if (!endpoint) {
      this.events.emit(EventRegistry.LOCAL.ERROR, new Error('Invalid demo type'));
      return;
    }
    
    this.logger.info(`Starting demo: ${demoType}`);
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

      this.state.set('active', true);
      this.events.emit(EventRegistry.LOCAL.UI_UPDATE, true);
      this.events.emit(EventRegistry.LOCAL.CHAT_CLEAR);

      // Clean up any existing stream
      this._cleanupMediaStream();

      // Now request permissions only when starting the call
      if (videoEnabled) {
        await SignalWire.WebRTC.requestPermissions({ video: true });
      }
      if (audioEnabled) {
        await SignalWire.WebRTC.requestPermissions({ audio: true });
      }

      // After permissions, get devices and update UI
      await this.deviceManager.loadDevices();

      // Ensure SignalWire SDK is loaded
      await loadSignalWireSDK();

      let client = this.state.get('client');
      if (!client) {
        client = await SignalWire.SignalWire({
          token: CONFIG.TOKEN,
          debug: CONFIG.DEBUG.enabled
        });
        
        this.state.set('client', client);
        this.events.emit(EventRegistry.LOCAL.CLIENT_CREATED, client);

        // Set up chat manager event listeners
        const chatManager = window.SignalWireDemo?.chatManager;
        if (chatManager) {
          chatManager.setupAIEventListeners(client);
        }
      }

      // Get media constraints
      const constraints = await this.deviceManager.getMediaConstraints();
      
      // Get new media stream only when needed
      let localStream;
      try {
        localStream = await SignalWire.WebRTC.getUserMedia({
          audio: audioEnabled ? constraints.audio : false,
          video: videoEnabled ? constraints.video : false
        });
      } catch (streamError) {
        if (streamError.name === 'OverconstrainedError') {
          // Fallback to default video constraints
          localStream = await SignalWire.WebRTC.getUserMedia({
            audio: audioEnabled ? constraints.audio : false,
            video: videoEnabled ? {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } : false
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
      if (localStream.getVideoTracks().length > 0) {
        // Get a reference to the UI manager from the app
        const uiManager = window.SignalWireDemo?.ui;
        
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
        audio: true,
        video: constraints.video,
        negotiateVideo: true
      });

      this.state.set('currentCall', currentCall);
      this._setupCallEventListeners(currentCall);
      await currentCall.start();

    } catch (error) {
      this._handleError('Call failed:', error);
    }
  }

  _setupCallEventListeners(call) {
    if (!call) return;

    call.on('active', () => {
      if (!this.state.get('active')) {
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
        const uiManager = window.SignalWireDemo?.ui;
        
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
    if (this._endingCall) {
      this.logger.info('Call already ending, ignoring duplicate request');
      return;
    }
    
    this._endingCall = true;
    this.state.set('active', false);

    try {
      const currentCall = this.state.get('currentCall');
      if (currentCall?.state === 'active') {
        this.logger.info('Hanging up active call');
        await currentCall.hangup();
      }
      
      // Clean up media stream
      this._cleanupMediaStream();

      this.events.emit(EventRegistry.LOCAL.UI_UPDATE, false);
      this.state.set('currentCall', null);
    } catch (error) {
      this.logger.error('Error ending call:', error);
      this.events.emit(EventRegistry.LOCAL.UI_UPDATE, false);
    } finally {
      this._endingCall = false;
    }
  }

  _handleError(message, error) {
    this.logger.error(message, error);
    this.events.emit(EventRegistry.LOCAL.ERROR, error);
    this.endCall();
  }

  cleanup() {
    // Cleanup all resources
    this._cleanupMediaStream();
  }
}

/**
 * ChatManager - Handles chat functionality
 * Manages AI-powered chat interactions
 */
class ChatManager {
  constructor(events, state, ui, logger) {
    this.events = events;
    this.state = state;
    this.ui = ui;
    this.logger = logger || new Logger('ChatManager');
    this.currentUserMessageDiv = null;  // Track current user message div
  }

  setupAIEventListeners(client) {
    if (!client) return;
    
    // AI partial result (typing indicator)
    client.on('ai.partial_result', (params) => {
      this.logger.debug('ai.partial_result', params);
      if (params.barged) {
        // If barged, finalize current AI message
        this._finalizeCurrentAIMessage();
      } else {
        // Show user's message as it's being transcribed
        if (!this.currentUserMessageDiv) {
          // Get the last message group
          const messagesContainer = this.ui.elements.messagesContainer;
          let userGroup = messagesContainer.lastElementChild;
          
          // Check if we need a new user message group
          if (!userGroup || !userGroup.classList.contains('messages-group') || !userGroup.classList.contains('user-messages')) {
            userGroup = document.createElement('div');
            userGroup.className = 'messages-group user-messages';
            messagesContainer.appendChild(userGroup);
          }
          
          // Remove 'last' class from previous messages in this group
          const previousMessages = userGroup.querySelectorAll('.message.last');
          previousMessages.forEach(msg => msg.classList.remove('last'));
          
          // Create new message div
          this.currentUserMessageDiv = document.createElement('div');
          this.currentUserMessageDiv.className = 'message partial last';
          userGroup.appendChild(this.currentUserMessageDiv);
        }
        
        // Update the message text
        this.currentUserMessageDiv.textContent = params.text;
        this.ui.elements.messagesContainer.scrollTop = this.ui.elements.messagesContainer.scrollHeight;
      }
    });

    // AI speech detection
    client.on('ai.speech_detect', (params) => {
      this.logger.debug('ai.speech_detect', params);
      // Finalize any ongoing AI message
      this._finalizeCurrentAIMessage();
      
      const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, '');
      
      // Update or create user message
      if (this.currentUserMessageDiv) {
        // Update existing message and finalize it
        this.currentUserMessageDiv.textContent = cleanText;
        this.currentUserMessageDiv.classList.remove('partial');
        this.currentUserMessageDiv = null;
      } else {
        // Create new message group and message
        const messagesContainer = this.ui.elements.messagesContainer;
        const userGroup = document.createElement('div');
        userGroup.className = 'messages-group user-messages';
        messagesContainer.appendChild(userGroup);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message last';
        messageDiv.textContent = cleanText;
        userGroup.appendChild(messageDiv);
      }
      
      this.ui.elements.messagesContainer.scrollTop = this.ui.elements.messagesContainer.scrollHeight;
    });

    // AI completion
    client.on('ai.completion', (params) => {
      this.logger.debug('ai.completion', params);
      if (params.type === 'barged') {
        this._finalizeCurrentAIMessage(true);
      } else {
        // Update current AI message with final text
        const currentDiv = this.state.get('currentPartialMessageDiv');
        if (currentDiv) {
          currentDiv.textContent = params.text;
          currentDiv.classList.remove('partial');
          this.state.set('currentPartialMessageDiv', null);
          this.state.set('aiMessageInProgress', false);
        } else {
          // Create new AI message group
          const messagesContainer = this.ui.elements.messagesContainer;
          const aiGroup = document.createElement('div');
          aiGroup.className = 'messages-group ai-messages';
          messagesContainer.appendChild(aiGroup);
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message last';
          messageDiv.textContent = params.text;
          aiGroup.appendChild(messageDiv);
        }
        
        // Update unread count if chat is closed
        if (!this.state.get('isChatOpen')) {
          const currentCount = this.state.get('unreadMessages');
          this.state.set('unreadMessages', currentCount + 1);
          this.ui._updateNotificationBadge();
        }
      }
    });

    // AI response utterance
    client.on('ai.response_utterance', (params) => {
      this.logger.debug('ai.response_utterance', params);
      if (!params.utterance) {
        // Empty utterance signals start of new AI message
        this._finalizeCurrentAIMessage();
        this.state.set('aiMessageInProgress', true);
      } else if (params.utterance && this.state.get('aiMessageInProgress')) {
        // Get or create AI message div
        let currentDiv = this.state.get('currentPartialMessageDiv');
        const messagesContainer = this.ui.elements.messagesContainer;
        
        if (!currentDiv) {
          // Get the last message group
          let aiGroup = messagesContainer.lastElementChild;
          
          // Check if we need a new AI message group
          if (!aiGroup || !aiGroup.classList.contains('messages-group') || !aiGroup.classList.contains('ai-messages')) {
            aiGroup = document.createElement('div');
            aiGroup.className = 'messages-group ai-messages';
            messagesContainer.appendChild(aiGroup);
          }
          
          // Remove 'last' class from previous messages in this group
          const previousMessages = aiGroup.querySelectorAll('.message.last');
          previousMessages.forEach(msg => msg.classList.remove('last'));
          
          // Create new message div
          currentDiv = document.createElement('div');
          currentDiv.className = 'message partial last';
          aiGroup.appendChild(currentDiv);
          this.state.set('currentPartialMessageDiv', currentDiv);
          currentDiv.textContent = params.utterance;
        } else {
          currentDiv.textContent += " " + params.utterance;
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  _finalizeCurrentAIMessage(wasBarged = false) {
    if (this.state.get('aiMessageInProgress')) {
      const currentDiv = this.state.get('currentPartialMessageDiv');
      if (currentDiv) {
        currentDiv.classList.remove('partial');
        if (wasBarged) {
          currentDiv.classList.add('barged');
        }
        this.state.set('currentPartialMessageDiv', null);
      }
      this.state.set('aiMessageInProgress', false);
    }
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
      logger.debug('SignalWire SDK already loaded');
      resolve(window.SignalWire);
      return;
    }
    
    logger.info('Loading SignalWire SDK...');
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdn.signalwire.com/@signalwire/js@dev';
    script.async = true;
    
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    const tryLoad = () => {
      // Set up load and error handlers
      script.onload = () => {
        if (window.SignalWire) {
          logger.info('SignalWire SDK loaded successfully');
          resolve(window.SignalWire);
        } else {
          const error = new Error('SignalWire SDK loaded but global object not found');
          logger.error('SignalWire SDK load error:', error);
          handleLoadError();
        }
      };
      
      script.onerror = handleLoadError;
      
      // Add to document if not already there
      if (!document.head.contains(script)) {
        document.head.appendChild(script);
      }
    };
    
    const handleLoadError = () => {
      if (retryCount < maxRetries) {
        retryCount++;
        logger.warn(`Retrying SignalWire SDK load (attempt ${retryCount}/${maxRetries})...`);
        setTimeout(tryLoad, retryDelay);
      } else {
        const error = new Error('Failed to load SignalWire SDK after multiple attempts');
        logger.error('SignalWire SDK load error:', error);
        reject(error);
      }
    };
    
    // Start loading
    tryLoad();
  });
}

/**
 * Dynamically loads Font Awesome
 * @returns {Promise} A promise that resolves when Font Awesome is loaded
 */
function loadFontAwesome() {
  return new Promise((resolve, reject) => {
    logger.info('Loading Font Awesome...');
    
    // Create link element for Font Awesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    
    // Set up load and error handlers
    link.onload = () => {
      logger.info('Font Awesome loaded successfully');
      resolve();
    };
    
    link.onerror = () => {
      const error = new Error('Failed to load Font Awesome');
      logger.error('Font Awesome load error:', error);
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
    
    // Set initial states with initial values to prevent undefined changes
    this.state.state = {
      ...this.state.state,  // Keep existing default state
      initialization: {
        started: false,
        completed: false
      },
      ui: {
        ...this.state.state.ui,
        ready: false,
        initialized: false
      }
    };

    // Initialize components but don't start them yet
    this._initializeComponents();
    
    // Set up event handlers between modules
    this._wireUpEvents();
    
    // Start async initialization
    this._startInitialization();
  }

  _initializeComponents() {
    // Initialize modules in order
    this.ui = new UIManager(this.events, this.state, this.logger);
    this.deviceManager = new DeviceManager(this.events, this.state, this.logger);
    this.callManager = new CallManager(this.events, this.state, this.deviceManager, this.logger);
    this.chatManager = new ChatManager(this.events, this.state, this.ui, this.logger);
  }

  async _startInitialization() {
    this.state.set('initialization.started', true);

    try {
      // Load resources in parallel with proper error handling
      const [fontAwesomeResult, signalWireResult] = await Promise.allSettled([
        loadFontAwesome().catch(error => {
          this.logger.error('Font Awesome loading failed, continuing without icons:', error);
          return null;
        }),
        loadSignalWireSDK().catch(error => {
          this.logger.error('SignalWire SDK loading failed:', error);
          throw error; // Re-throw as this is critical
        })
      ]);

      // Check SignalWire result as it's critical
      if (signalWireResult.status === 'rejected') {
        throw signalWireResult.reason;
      }

      // Initialize UI first
      await this.ui.initialize();
      this.state.set('ui.ready', true);

      // Load devices
      await this.deviceManager.loadDevices();

      // Initialize demo buttons
      await this._initializeDemoButtons();

      // Mark initialization as complete
      this.state.set('initialization.completed', true);
      this.logger.info('Initialization completed successfully');

    } catch (error) {
      this.logger.error('Error during initialization:', error);
      this.state.set('initialization.completed', false);
      throw error;
    }
  }

  async _initializeDemoButtons() {
    const buttons = Array.from(document.querySelectorAll('.demo-button'));
    if (buttons.length === 0) {
      this.logger.info('No demo buttons found to initialize');
      return;
    }
    await Promise.all(buttons.map(button => this._initializeDemoButton(button)));
  }

  async _initializeDemoButton(button) {
    // Add inactive state initially
    button.classList.add('sw-inactive');
    
    // Get the demo type from the button's data attribute
    const demoType = button.getAttribute('data-demo-type');
    if (!demoType || !CONFIG.ENDPOINTS[demoType]) {
      this.logger.error(`Invalid demo type for button:`, demoType);
      return;
    }

    // Create click handler
    const clickHandler = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If initialization isn't complete, log and return
      if (!this.state.get('initialization.completed')) {
        this.logger.info('Button clicked before initialization complete');
        return;
      }

      // Start the demo if initialization is complete
      await this.callManager.startDemo(demoType);
    };

    // Add click handler
    button.addEventListener('click', clickHandler);

    // Watch for initialization state
    this.events.on(EventRegistry.LOCAL.STATE_CHANGED, (path, value) => {
      if (path === 'initialization.completed' && value === true) {
        button.classList.remove('sw-inactive');
        button.classList.add('sw-ready');
      }
    });

    return button;
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
    this.events.on(EventRegistry.LOCAL.CALL_TOGGLE, () => {
      const isMuted = this.deviceManager.toggleMicrophone();
      this.ui.toggleMute(isMuted);
    });
    
    // Chat events
    this.events.on(EventRegistry.LOCAL.CHAT_TOGGLE, forceState => this.ui.toggleChatPanel(forceState));
    this.events.on(EventRegistry.LOCAL.CHAT_CLEAR, () => this.ui.clearChatMessages());
    
    // SignalWire chat message events
    this.events.on(EventRegistry.SIGNALWIRE.CHAT_SPEECH, text => {
      // Speech detect events are always user messages in their own group
      this.ui.appendMessage(text, 'user');
    });

    this.events.on(EventRegistry.SIGNALWIRE.CHAT_PARTIAL, text => {
      // Only handle partial if we have an AI message in progress
      if (!this.state.get('aiMessageInProgress')) return;
      
      let currentDiv = this.state.get('currentPartialMessageDiv');
      const elements = this.state.get('ui.elements');
      
      if (!currentDiv) {
        // Create new AI message group
        const messagesContainer = elements.messagesContainer;
        const aiGroup = document.createElement('div');
        aiGroup.className = 'messages-group ai-messages';
        messagesContainer.appendChild(aiGroup);
        
        currentDiv = document.createElement('div');
        currentDiv.className = 'message partial first last';
        aiGroup.appendChild(currentDiv);
        this.state.set('currentPartialMessageDiv', currentDiv);
      }
      
      currentDiv.textContent = text;
      elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    });

    this.events.on(EventRegistry.SIGNALWIRE.CHAT_COMPLETION, text => {
      const currentDiv = this.state.get('currentPartialMessageDiv');
      if (currentDiv) {
        currentDiv.textContent = text;
        currentDiv.classList.remove('partial');
        currentDiv.classList.add('last');
        this.state.set('currentPartialMessageDiv', null);
        this.state.set('aiMessageInProgress', false);
      } else {
        const messageDiv = this.ui.appendMessage(text, 'ai');
        messageDiv.classList.add('last');
      }
      
      if (!this.state.get('isChatOpen')) {
        const currentCount = this.state.get('unreadMessages');
        this.state.set('unreadMessages', currentCount + 1);
        this.ui._updateNotificationBadge();
      }
    });

    this.events.on(EventRegistry.SIGNALWIRE.CHAT_UTTERANCE, utterance => {
      // Only handle utterances if we have an AI message in progress
      if (!this.state.get('aiMessageInProgress')) return;
      
      let currentDiv = this.state.get('currentPartialMessageDiv');
      const elements = this.state.get('ui.elements');
      
      if (!currentDiv) {
        // Create new AI message group
        const messagesContainer = elements.messagesContainer;
        const aiGroup = document.createElement('div');
        aiGroup.className = 'messages-group ai-messages';
        messagesContainer.appendChild(aiGroup);
        
        currentDiv = document.createElement('div');
        currentDiv.className = 'message partial first last';
        aiGroup.appendChild(currentDiv);
        this.state.set('currentPartialMessageDiv', currentDiv);
        currentDiv.textContent = utterance;
      } else {
        currentDiv.textContent += " " + utterance;
      }
      
      elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    });
    
    // Error handling
    this.events.on(EventRegistry.LOCAL.ERROR, error => this.ui.showError(error));
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