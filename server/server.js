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

// Funzione helper per generare contesto temporale
function generateTimeContext() {
  const now = new Date();
  const italianDateTime = now.toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  
  // Determina se il ristorante è nella stagione operativa
  const isRestaurantSeason = (month === 5 && day >= 15) || 
                            (month > 5 && month < 9) || 
                            (month === 9 && day <= 15);
  
  let seasonalInfo = '';
  if (month >= 6 && month <= 8) {
    seasonalInfo = 'Stagione estiva - Alta stagione turistica';
  } else if ((month === 5 && day >= 15) || (month === 9 && day <= 15)) {
    seasonalInfo = 'Periodo di apertura ristorante - Stagione ideale per visite';
  } else if (month >= 10 || month <= 2) {
    seasonalInfo = 'Periodo invernale - Ristorante chiuso ma zona visitabile';
  } else {
    seasonalInfo = 'Periodo di pre-stagione - Preparativi apertura';
  }
  
  let serviceStatus = '';
  if (isRestaurantSeason) {
    if ((hour >= 12 && hour < 15) || (hour >= 19 && hour < 22)) {
      serviceStatus = '✅ Ristorante attualmente in orario di servizio';
    } else if (hour >= 15 && hour < 19) {
      serviceStatus = '⏰ Ristorante chiuso tra pranzo e cena (riapre alle 19:30)';
    } else {
      serviceStatus = '🕐 Ristorante attualmente chiuso - riapre per pranzo (12:30) o cena (19:30)';
    }
  } else {
    serviceStatus = '❄️ Ristorante chiuso per stagione (riapre 15 Maggio)';
  }
  
  return `
=== CONTESTO TEMPORALE AGGIORNATO (SERVER) ===
Data e ora attuali: ${italianDateTime} (fuso orario italiano)
Stagione: ${seasonalInfo}
Stato servizio: ${serviceStatus}

IMPORTANTE per prenotazioni future:
- Il ristorante è aperto SOLO dal 15 Maggio al 15 Settembre
- Per richieste di prenotazione, calcola sempre se la data richiesta rientra nel periodo di apertura
- Se la data è oltre il 15 settembre dell'anno corrente, informa che il ristorante sarà chiuso
- Se la data è prima del 15 maggio dell'anno successivo, informa della data di riapertura

IMPORTANTE: Usa sempre queste informazioni per fornire risposte contestualizzate al momento attuale e calcolare correttamente le date future.
`;
}

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
    
    // Aggiungi contesto temporale ai messaggi
    const timeContext = generateTimeContext();
    const enhancedMessages = [
      ...messages.slice(0, -1), // Tutti i messaggi tranne l'ultimo
      { role: 'system', content: timeContext }, // Contesto temporale
      messages[messages.length - 1] // Ultimo messaggio utente
    ];
    
    console.log('📅 [Server] Aggiunto contesto temporale:', timeContext.length, 'caratteri');
    
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
        messages: enhancedMessages
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

    // Aggiungi contesto temporale anche per l'endpoint con ricerca
    const timeContextSearch = generateTimeContext();
    const finalMessages = [
      ...enhancedMessages.slice(0, -1), // Tutti i messaggi tranne l'ultimo
      { role: 'system', content: timeContextSearch }, // Contesto temporale
      enhancedMessages[enhancedMessages.length - 1] // Ultimo messaggio utente
    ];
    
    console.log('📅 [Search Endpoint] Aggiunto contesto temporale:', timeContextSearch.length, 'caratteri');

    // Call OpenRouter API with enhanced messages
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: finalMessages
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