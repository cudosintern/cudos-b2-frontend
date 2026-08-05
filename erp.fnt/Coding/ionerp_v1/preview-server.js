const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const buildPath = path.join(__dirname, 'build');

// Serve static files from build directory
app.use('/erp', express.static(buildPath));

// Handle React Router routes - serve index.html for any requests to /erp/*
app.get('/erp*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Redirect root to /erp/
app.get('/', (req, res) => {
  res.redirect('/erp/');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 App available at http://localhost:${PORT}/erp/`);
});
