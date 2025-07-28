const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

const SIGNALWIRE_CONFIG = {
  projectId: process.env.SIGNALWIRE_PROJECT_ID,
  apiToken: process.env.SIGNALWIRE_API_TOKEN,
  spaceUrl: process.env.SIGNALWIRE_SPACE_URL,
};

app.post('/api/create-subscriber-token', async (req, res) => {
  try {
    const { displayName } = req.body;
    const subscriberId = `video-caller-${Math.random().toString(36).substr(2, 9)}`;

    const requestBody = {
      subscriber_id: subscriberId,
      reference: `video-caller-${Date.now()}`,
      ttl: 3600,
    };

    const response = await axios.post(
      `https://${SIGNALWIRE_CONFIG.spaceUrl}/api/fabric/subscribers/tokens`,
      requestBody,
      {
        auth: {
          username: SIGNALWIRE_CONFIG.projectId,
          password: SIGNALWIRE_CONFIG.apiToken,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    res.json({
      success: true,
      token: response.data.token,
      subscriber_id: response.data.subscriber_id,
      display_name: displayName,
    });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      success: false,
      error: error.response?.data || error.message,
      details: {
        status: error.response?.status,
        message: error.message,
        fullError: error.response?.data,
      },
    });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    const response = await axios.get(
      `https://${SIGNALWIRE_CONFIG.spaceUrl}/api/fabric/resources`,
      {
        auth: {
          username: SIGNALWIRE_CONFIG.projectId,
          password: SIGNALWIRE_CONFIG.apiToken,
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    res.json({ success: true, resources: response.data?.data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/debug-webhook', (req, res) => {
  console.log('Debug webhook hit:', req.body);
  res.status(200).json({ success: true });
});

app.post('/post-prompt', (req, res) => {
  console.log('Post-prompt webhook hit:', req.body);
  res.status(200).json({ success: true });
});

app.post('/swaig-webhook', (req, res) => {
  console.log('SWAIG webhook hit:', req.body);
  res.status(200).json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SignalWire Server running on http://localhost:${PORT}`);
  console.log(`Space URL: ${SIGNALWIRE_CONFIG.spaceUrl}`);
});
