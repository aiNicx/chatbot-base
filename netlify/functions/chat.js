const fetch = require('node-fetch');

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
=== CONTESTO TEMPORALE AGGIORNATO (NETLIFY) ===
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

exports.handler = async (event, context) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { model, messages } = requestBody;

    // Validate request body
    if (!model || !messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request body. Must include model and messages array.'
        })
      };
    }

    // Check if API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('API key not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server API key not configured'
        })
      };
    }

    // Aggiungi contesto temporale ai messaggi
    const timeContext = generateTimeContext();
    const enhancedMessages = [
      ...messages.slice(0, -1), // Tutti i messaggi tranne l'ultimo
      { role: 'system', content: timeContext }, // Contesto temporale
      messages[messages.length - 1] // Ultimo messaggio utente
    ];
    
    console.log('📅 [Netlify] Aggiunto contesto temporale:', timeContext.length, 'caratteri');

    // Forward request to OpenRouter API
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `OpenRouter API error: ${response.status} - ${errorText}` 
        })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error' 
      })
    };
  }
};