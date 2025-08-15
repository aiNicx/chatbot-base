require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const { model, messages } = req.body;
    
    // Validate request body
    if (!model || !messages || !Array.isArray(messages)) {
      console.log('Invalid request body');
      return res.status(400).json({
        error: 'Invalid request body. Must include model and messages array.'
      });
    }
    
    console.log('Model:', model);
    console.log('Messages:', JSON.stringify(messages, null, 2));
    
    // Check if API key is configured
    console.log('API Key present:', !!process.env.OPENROUTER_API_KEY);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('API key not found in environment variables');
      return res.status(500).json({
        error: 'Server API key not configured'
      });
    }
    
    console.log('Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    // Forward request to OpenRouter API
    console.log('Forwarding request to OpenRouter API');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      })
    });
    
    console.log('OpenRouter API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status} - ${errorText}` 
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API endpoint at http://localhost:${PORT}/api/chat`);
});