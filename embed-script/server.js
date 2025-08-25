import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// Serve the demo page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SignalWire Call Widget Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 40px;
      font-size: 18px;
    }
    .demo-section {
      margin-bottom: 40px;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .demo-section h2 {
      color: #444;
      margin-bottom: 15px;
      font-size: 24px;
    }
    .demo-section p {
      color: #666;
      margin-bottom: 20px;
    }
    .call-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 50px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-right: 15px;
      margin-bottom: 15px;
    }
    .call-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .feature {
      padding: 20px;
      background: white;
      border-radius: 10px;
      text-align: center;
    }
    .feature-icon {
      font-size: 30px;
      margin-bottom: 10px;
    }
    .feature-title {
      font-weight: bold;
      color: #444;
      margin-bottom: 5px;
    }
    .feature-desc {
      color: #666;
      font-size: 14px;
    }
    .status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
    }
    .config-input {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
    }
    .apply-button {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    .apply-button:hover {
      background: #218838;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎙️ SignalWire Call Widget Demo</h1>
    <p class="subtitle">Test the call widget with different configurations. Audio processing is optimized with AGC and Noise Suppression OFF by default.</p>
    
    <!-- Configuration Section -->
    <div class="demo-section">
      <h2>⚙️ Configuration</h2>
      <p>Enter your SignalWire token to enable the widgets:</p>
      <input type="text" id="tokenInput" class="config-input" placeholder="Token already configured - change if needed" />
      <input type="text" id="destinationInput" class="config-input" placeholder="Enter destination (e.g., /private/room-name)" value="/private/demo-1" />
      <button class="apply-button" onclick="applyConfig()">Apply Configuration</button>
    </div>

    <!-- Fixed Destination Demo -->
    <div class="demo-section">
      <h2>📞 Fixed Destination Call</h2>
      <p>Click to call a predefined destination. Perfect for support hotlines or specific departments.</p>
      <button id="fixedCall" class="call-button">
        📞 Call Support
      </button>
      <button id="videoCall" class="call-button">
        📹 Video Call
      </button>
      <button id="audioOnly" class="call-button">
        🎤 Audio Only Call
      </button>
    </div>

    <!-- Dialer Demo -->
    <div class="demo-section">
      <h2>📱 Dialer Mode</h2>
      <p>Opens a dialer interface where users can enter any phone number or SIP address.</p>
      <button id="dialerCall" class="call-button">
        📱 Open Dialer
      </button>
    </div>

    <!-- Features Grid -->
    <div class="demo-section">
      <h2>✨ Features</h2>
      <div class="feature-grid">
        <div class="feature">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Device Persistence</div>
          <div class="feature-desc">Selected devices are remembered between calls</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🔇</div>
          <div class="feature-title">Audio Processing</div>
          <div class="feature-desc">AGC & Noise Suppression toggles (OFF by default for quality)</div>
        </div>
        <div class="feature">
          <div class="feature-icon">💬</div>
          <div class="feature-title">Live Transcript</div>
          <div class="feature-desc">Real-time call transcription support</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📹</div>
          <div class="feature-title">Video Support</div>
          <div class="feature-desc">Full video calling capabilities</div>
        </div>
      </div>
    </div>

    <!-- Status Info -->
    <div class="demo-section">
      <h2>📊 Server Information</h2>
      <p><strong>Local URL:</strong> <code>http://localhost:${PORT}</code></p>
      <p><strong>Widget Path:</strong> <code>/dist/c2c-widget-full.umd.js</code></p>
      <p><strong>To expose via ngrok:</strong></p>
      <ol>
        <li>Install ngrok: <code>npm install -g ngrok</code> or download from ngrok.com</li>
        <li>Run: <code>ngrok http ${PORT}</code></li>
        <li>Share the HTTPS URL provided by ngrok</li>
      </ol>
    </div>
  </div>

  <div class="status">✅ Server Running on Port ${PORT}</div>

  <!-- Call Widgets (will be added dynamically) -->
  <div id="widgetContainer"></div>

  <!-- Load the widget script -->
  <script src="/dist/c2c-widget-full.umd.js"></script>
  
  <script>
    let currentToken = localStorage.getItem('sw_token') || 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiY2giOiJwdWMuc2lnbmFsd2lyZS5jb20iLCJ0eXAiOiJTQVQifQ..QYHghlPEOE4HjtJb.1WKLEg09c05-g3RujrS0io5h6AJ4mfpKMWtykpMIERJlMuomtOLHrU8picaFHeppbb_-593GjxHfeZiVmYdPZiIPYuNw2znqBuySuPArPfb2NMvXtZHEgfl3sXAdy5xpqSpphxFKStXwylo0EGeC91cVQgn3_lmSBcp13JvwArnu5ULltGmjPJogRbE1PrBsBbEJJioumVSZuuMH5lo7am-wE37Q5GXgou1a9iJWBiBtgk5ysmW4HTvbZ7pZHL5VcnWVy4V0OJL3J4WXl-m47L6bgFmHUijvVWxoFDu4Z7aUfx551OEhefr04F5NuJaHzTWUpgNzQ_VgWho04K96MK--wH_dEyIxtbfUHJSZyk1-Ef_dDCgFK6Rlnl2H5HM4G05gEKWcSjXGGk4tN0g6YvHsrUrAgsZiQeVQ-ggCHHRcmYX1OeXYbv1vEPml8i5JPUHAak5VvOQLYoG2ydb5kVv3WdM0oWKGHzTFPLFmjTaRxSC2b378BGbR7hCxbY9NdaLFnSn45KDkv1_a-saR9gDCBa2ZCPbkFmWRKLtGORFoiN-mLYAPTugidqZx40Ue4hav-jX178udYpVgSmun_rMHoN81t0Sb4xqMovs2i47-WLyzTwaGBK2CgLeHohGBvB9aWsFOV7F_YrZlcn7ptKo7RdNSrfBkiw7F6Sf8oIOz.426h9VZWDSVYDUIL9a1wDg';
    let currentDestination = localStorage.getItem('sw_destination') || '/private/demo-1';
    
    // Pre-fill inputs if we have saved values
    document.getElementById('tokenInput').value = currentToken;
    document.getElementById('destinationInput').value = currentDestination;
    
    function applyConfig() {
      const token = document.getElementById('tokenInput').value;
      const destination = document.getElementById('destinationInput').value;
      
      if (!token) {
        alert('Please enter a SignalWire token');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('sw_token', token);
      localStorage.setItem('sw_destination', destination);
      
      currentToken = token;
      currentDestination = destination;
      
      // Clear existing widgets
      const container = document.getElementById('widgetContainer');
      container.innerHTML = '';
      
      // Create Fixed Destination Widget
      const fixedWidget = document.createElement('call-widget');
      fixedWidget.setAttribute('button-id', 'fixedCall');
      fixedWidget.setAttribute('token', token);
      fixedWidget.setAttribute('destination', destination);
      fixedWidget.setAttribute('support-audio', 'true');
      fixedWidget.setAttribute('support-video', 'true');
      fixedWidget.setAttribute('window-mode', 'video+transcript');
      container.appendChild(fixedWidget);
      
      // Create Video Call Widget
      const videoWidget = document.createElement('call-widget');
      videoWidget.setAttribute('button-id', 'videoCall');
      videoWidget.setAttribute('token', token);
      videoWidget.setAttribute('destination', destination);
      videoWidget.setAttribute('support-audio', 'true');
      videoWidget.setAttribute('support-video', 'true');
      videoWidget.setAttribute('window-mode', 'video');
      container.appendChild(videoWidget);
      
      // Create Audio Only Widget
      const audioWidget = document.createElement('call-widget');
      audioWidget.setAttribute('button-id', 'audioOnly');
      audioWidget.setAttribute('token', token);
      audioWidget.setAttribute('destination', destination);
      audioWidget.setAttribute('support-audio', 'true');
      audioWidget.setAttribute('support-video', 'false');
      audioWidget.setAttribute('window-mode', 'audio+transcript');
      container.appendChild(audioWidget);
      
      // Create Dialer Widget (no destination)
      const dialerWidget = document.createElement('call-widget');
      dialerWidget.setAttribute('button-id', 'dialerCall');
      dialerWidget.setAttribute('token', token);
      dialerWidget.setAttribute('support-audio', 'true');
      dialerWidget.setAttribute('support-video', 'true');
      container.appendChild(dialerWidget);
      
      // Add event listeners
      const widgets = document.querySelectorAll('call-widget');
      widgets.forEach(widget => {
        widget.addEventListener('call.joined', (e) => {
          console.log('Call started!', e.detail);
        });
        
        widget.addEventListener('call.left', (e) => {
          console.log('Call ended', e.detail);
        });
        
        widget.addEventListener('beforeDial', (e) => {
          console.log('About to dial...', e);
        });
      });
      
      alert('Configuration applied! Widgets are ready to use.');
    }
    
    // Auto-apply if token exists
    if (currentToken) {
      setTimeout(applyConfig, 100);
    }
  </script>
</body>
</html>
  `);
});

// Additional test page with minimal setup
app.get('/minimal', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Minimal Call Widget Test</title>
</head>
<body>
  <h1>Minimal Setup</h1>
  <button id="callBtn">Start Call</button>
  
  <call-widget
    button-id="callBtn"
    token="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiY2giOiJwdWMuc2lnbmFsd2lyZS5jb20iLCJ0eXAiOiJTQVQifQ..QYHghlPEOE4HjtJb.1WKLEg09c05-g3RujrS0io5h6AJ4mfpKMWtykpMIERJlMuomtOLHrU8picaFHeppbb_-593GjxHfeZiVmYdPZiIPYuNw2znqBuySuPArPfb2NMvXtZHEgfl3sXAdy5xpqSpphxFKStXwylo0EGeC91cVQgn3_lmSBcp13JvwArnu5ULltGmjPJogRbE1PrBsBbEJJioumVSZuuMH5lo7am-wE37Q5GXgou1a9iJWBiBtgk5ysmW4HTvbZ7pZHL5VcnWVy4V0OJL3J4WXl-m47L6bgFmHUijvVWxoFDu4Z7aUfx551OEhefr04F5NuJaHzTWUpgNzQ_VgWho04K96MK--wH_dEyIxtbfUHJSZyk1-Ef_dDCgFK6Rlnl2H5HM4G05gEKWcSjXGGk4tN0g6YvHsrUrAgsZiQeVQ-ggCHHRcmYX1OeXYbv1vEPml8i5JPUHAak5VvOQLYoG2ydb5kVv3WdM0oWKGHzTFPLFmjTaRxSC2b378BGbR7hCxbY9NdaLFnSn45KDkv1_a-saR9gDCBa2ZCPbkFmWRKLtGORFoiN-mLYAPTugidqZx40Ue4hav-jX178udYpVgSmun_rMHoN81t0Sb4xqMovs2i47-WLyzTwaGBK2CgLeHohGBvB9aWsFOV7F_YrZlcn7ptKo7RdNSrfBkiw7F6Sf8oIOz.426h9VZWDSVYDUIL9a1wDg"
    destination="/private/demo-1"
    support-audio="true"
    support-video="true"
  ></call-widget>
  
  <script src="/dist/c2c-widget-full.umd.js"></script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    widget: fs.existsSync(path.join(__dirname, 'dist/c2c-widget-full.umd.js')),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 SignalWire Call Widget Server Running!           ║
║                                                        ║
║   Local:    http://localhost:${PORT}                     ║
║   Network:  http://[your-ip]:${PORT}                     ║
║                                                        ║
║   Pages:                                               ║
║   • Main Demo:  http://localhost:${PORT}/                ║
║   • Minimal:    http://localhost:${PORT}/minimal         ║
║   • Health:     http://localhost:${PORT}/health          ║
║                                                        ║
║   To expose with ngrok:                               ║
║   $ ngrok http ${PORT}                                   ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});