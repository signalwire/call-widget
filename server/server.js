const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files with proper MIME types
app.use('/static', express.static(path.join(__dirname, '../public/static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the test page without SignalWire SDK
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 


app.get('/video-modal-css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, '../public/static/css/video-modal.css'));
});

