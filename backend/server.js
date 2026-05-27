const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: {
      mockMode: process.env.MOCK_MODE === 'true',
      coralConfigDir: process.env.CORAL_CONFIG_DIR ? 'configured' : 'missing',
      coralBinPath: process.env.CORAL_BIN_PATH ? 'configured' : 'missing'
    }
  });
});

// Routers
const trackerRouter = require('./routes/tracker');
const postmortemRouter = require('./routes/postmortem');

app.use('/api/tracker', trackerRouter);
app.use('/api/postmortem', postmortemRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 AI SRE Suite Backend running on port ${PORT}`);
  console.log(`🔧 Mock Mode: ${process.env.MOCK_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📂 Config Dir: ${process.env.CORAL_CONFIG_DIR}`);
  console.log(`=================================================`);
});
