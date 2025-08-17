require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our services
const TavilyService = require('./services/tavilyService');
const SearchDecision = require('./services/searchDecision');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Tavily service
let tavilyService = null;
if (process.env.TAVILY_API_KEY) {
  tavilyService = new TavilyService(process.env.TAVILY_API_KEY);
  console.log('Tavily service initialized');
} else {
  console.warn('TAVILY_API_KEY not found - web search will be disabled');
}

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

// New API endpoint with web search capability
app.post('/api/chat-with-search', async (req, res) => {
  try {
    console.log('Received chat-with-search request:', JSON.stringify(req.body, null, 2));
    const { model, messages, config = {} } = req.body;
    
    // Validate request body
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request body. Must include model and messages array.'
      });
    }

    // Check OpenRouter API key
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return res.status(500).json({
        error: 'OpenRouter API key not configured'
      });
    }

    // Get the user's latest message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return res.status(400).json({
        error: 'Last message must be from user'
      });
    }

    let searchResults = null;
    let enhancedMessages = [...messages];

    // Check if we should perform web search
    if (tavilyService && SearchDecision.shouldSearch(userMessage.content, config)) {
      try {
        console.log('Triggering web search for:', userMessage.content);
        
        const searchQuery = SearchDecision.extractSearchQuery(userMessage.content);
        const searchOptions = SearchDecision.getSearchOptions(userMessage.content, config);
        
        searchResults = await tavilyService.search(searchQuery, searchOptions);
        
        // Add search context to the conversation
        if (searchResults && searchResults.results.length > 0) {
          const searchContext = `Informazioni aggiornate dal web per "${searchQuery}":

${searchResults.answer ? `Risposta diretta: ${searchResults.answer}\n\n` : ''}Fonti trovate:
${searchResults.results.map((result, idx) => 
  `${idx + 1}. ${result.title}\n   ${result.content}\n   Fonte: ${result.url}`
).join('\n\n')}

Utilizza queste informazioni aggiornate per rispondere alla domanda dell'utente, citando le fonti quando appropriato.`;

          enhancedMessages.splice(-1, 0, {
            role: 'system',
            content: searchContext
          });
        }
      } catch (searchError) {
        console.error('Web search failed:', searchError);
        // Continue without search results - don't fail the entire request
      }
    }

    // Call OpenRouter API with enhanced messages
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: enhancedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status} - ${errorText}` 
      });
    }

    const data = await response.json();
    
    // Add metadata about search
    if (searchResults) {
      data.searchMetadata = {
        searchPerformed: true,
        query: SearchDecision.extractSearchQuery(userMessage.content),
        resultsCount: searchResults.results.length,
        sources: searchResults.results.map(r => ({ title: r.title, url: r.url }))
      };
    } else {
      data.searchMetadata = {
        searchPerformed: false
      };
    }

    res.json(data);
    
  } catch (error) {
    console.error('Server error in chat-with-search:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      openRouter: !!process.env.OPENROUTER_API_KEY,
      tavily: !!tavilyService && tavilyService.isConfigured()
    }
  };
  res.json(healthData);
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