const fetch = require('node-fetch');

/**
 * Servizio per l'integrazione con l'API di Tavily
 * Versione serverless per Netlify Functions
 */
class TavilyService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.tavily.com';
        this.timeout = 5000;
    }

    async search(query, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key Tavily non configurata');
        }

        if (!query || query.trim().length === 0) {
            throw new Error('Query di ricerca non valida');
        }

        const requestBody = {
            query: query.trim(),
            search_depth: options.depth || 'basic',
            include_answer: options.includeAnswer !== false,
            max_results: Math.min(options.maxResults || 5, 10),
            include_domains: options.includeDomains || [],
            exclude_domains: options.excludeDomains || [],
            include_raw_content: false,
            include_images: false
        };

        try {
            console.log(`[TavilyService] Eseguendo ricerca per: "${query}"`);
            
            const response = await fetch(`${this.baseURL}/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[TavilyService] Errore API ${response.status}:`, errorText);
                throw new Error(`Errore API Tavily: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`[TavilyService] Ricerca completata: ${data.results?.length || 0} risultati`);
            
            return this.formatResults(data);

        } catch (error) {
            console.error('[TavilyService] Errore durante ricerca:', error);
            throw error;
        }
    }

    formatResults(rawData) {
        const formattedResults = {
            query: rawData.query,
            answer: rawData.answer || null,
            results: [],
            totalResults: rawData.results?.length || 0,
            responseTime: rawData.response_time || null
        };

        if (rawData.results && Array.isArray(rawData.results)) {
            formattedResults.results = rawData.results.map(result => ({
                title: result.title || 'Titolo non disponibile',
                url: result.url || '',
                content: result.content || '',
                score: result.score || 0,
                favicon: result.favicon || null
            }));
        }

        return formattedResults;
    }

    isConfigured() {
        return !!this.apiKey;
    }
}

/**
 * Logica decisionale per la ricerca web
 * Versione serverless
 */
class SearchDecision {
    static shouldSearch(message, config) {
        if (!config?.webSearch?.enabled) {
            return false;
        }

        const msg = message.toLowerCase();
        
        // Controllo pattern di esclusione per messaggi di saluto/prenotazione
        const excludePatterns = config.webSearch?.excludePatterns || [];
        const hasExcludePattern = excludePatterns.some(pattern => 
            msg.includes(pattern.toLowerCase())
        );
        
        // Pattern specifici per ristorante/prenotazioni da escludere
        const restaurantPatterns = /\b(prenotare|prenotazione|tavolo|ristorante|cena|pranzo|menu|carta|piatti|cucina|sala|posto|posti|disponibilità|orari?\s+(del\s+)?ristorante|come\s+(posso\s+)?prenotare|vorrei\s+prenotare|voglio\s+prenotare|posso\s+prenotare|prenotare\s+un\s+tavolo|riservare|reservation|book|booking|table|restaurant|dinner|lunch)\b/i;
        
        // Pattern di saluto da escludere
        const greetingPatterns = /^(ciao|salve|buongiorno|buonasera|buonanotte|hello|hi|good\s+morning|good\s+evening|good\s+night|hola|buenos\s+días|buenas\s+tardes|salut|bonjour|bonsoir|hallo|guten\s+tag|guten\s+abend)[\s\.,!]*$/i;
        
        if (hasExcludePattern || restaurantPatterns.test(msg) || greetingPatterns.test(msg)) {
            console.log(`[SearchDecision] Messaggio escluso dalla ricerca web: "${message.substring(0, 50)}..."`);
            return false;
        }
        
        // Sistema di scoring intelligente multilingue (più restrittivo)
        const scores = {
            // Pattern temporali specifici e forti
            temporal: /\b(oggi|today|hoy|aujourd\'?hui|heute)\s+(il\s+)?(meteo|weather|tiempo|météo|wetter|prezzo|price|precio|prix|preis|notizie|news|noticias|nouvelles|nachrichten)\b/i.test(msg) ? 2 : 0,
            
            // Dati real-time specifici
            realTime: /\b(prezzo\s+(attuale|corrente|di\s+oggi)|current\s+price|meteo\s+(di\s+oggi|attuale)|today\'?s\s+weather|notizie\s+(di\s+oggi|attuali)|today\'?s\s+news|borsa\s+(oggi|attuale)|stock\s+market\s+today|bitcoin\s+(prezzo|price))\b/i.test(msg) ? 2.5 : 0,
            
            // Pattern temporali compositi forti
            temporalComposite: /\b(che\s+tempo\s+fa\s+(oggi|adesso)|what\'?s\s+the\s+weather\s+(today|now)|qué\s+tiempo\s+hace\s+hoy|quel\s+temps\s+fait\s+aujourd\'?hui|wie\s+ist\s+das\s+wetter\s+heute)\b/i.test(msg) ? 3 : 0,
            
            // Pattern di prezzo/costo specifici
            pricing: /\b(quanto\s+costa\s+(oggi|adesso|attualmente)|how\s+much\s+(costs?|is)\s+.+\s+(today|now)|prezzo\s+(attuale|corrente|di\s+oggi))\b/i.test(msg) ? 2.5 : 0,
            
            // Pattern notizie specifiche
            news: /\b(ultime\s+notizie|latest\s+news|notizie\s+(di\s+oggi|attuali)|breaking\s+news|news\s+today)\b/i.test(msg) ? 2.5 : 0
        };
        
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const threshold = config.webSearch?.intelligentThreshold || 2.5;
        
        // Log per debug
        if (totalScore > 0) {
            console.log(`[SearchDecision] Message: "${message.substring(0, 50)}..." | Score: ${totalScore} | Threshold: ${threshold} | Will search: ${totalScore >= threshold}`);
        }
        
        return totalScore >= threshold;
    }

    static extractSearchQuery(message) {
        let query = message
            .replace(/\b(ciao|salve|buongiorno|buonasera|per favore|grazie)\b/gi, '')
            .replace(/\b(dimmi|parlami|racconta|spiegami|cosa|come|puoi)\b/gi, '')
            .replace(/\b(di|del|della|dei|delle|il|la|i|le|un|una)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (query.length < 3) {
            query = message;
        }

        if (query.length > 100) {
            query = query.substring(0, 100).trim();
        }

        return query;
    }

    static hasTemporalPattern(lowerMessage) {
        const temporalKeywords = [
            'oggi', 'adesso', 'ora', 'attualmente', 'al momento',
            'questa settimana', 'questo mese', 'quest\'anno',
            'recente', 'ultimo', 'ultima', 'ultimi', 'ultime',
            'ieri', 'domani', 'stamattina', 'stasera',
            'in tempo reale', 'aggiornato', 'aggiornamenti'
        ];

        return temporalKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    static hasInformationRequest(lowerMessage) {
        const infoPatterns = [
            /prezzo\s+(di|del|della)?\s*\w+/,
            /quanto\s+costa/,
            /che\s+tempo\s+fa/,
            /meteo\s+(di|a)?\s*\w+/,
            /temperatura\s+(di|a)?\s*\w+/,
            /orari?\s+(di|del|della)?\s*\w+/,
            /indirizzo\s+(di|del|della)?\s*\w+/,
            /telefono\s+(di|del|della)?\s*\w+/,
            /dove\s+(si\s+trova|è|sono)/,
            /quando\s+(apre|chiude|inizia|finisce)/
        ];

        return infoPatterns.some(pattern => pattern.test(lowerMessage));
    }

    static hasNewsPattern(lowerMessage) {
        const newsKeywords = [
            'notizie', 'news', 'cronaca', 'attualità',
            'eventi', 'evento', 'manifestazione',
            'politica', 'elezioni', 'governo',
            'economia', 'borsa', 'mercato', 'bitcoin', 'criptovalute',
            'sport', 'calcio', 'partita', 'campionato',
            'meteo', 'terremoto', 'alluvione', 'emergenza',
            'covid', 'pandemia', 'vaccino',
            'guerra', 'conflitto', 'pace'
        ];

        return newsKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    static getSearchOptions(message, config) {
        const lowerMessage = message.toLowerCase();
        const options = {
            maxResults: config?.webSearch?.maxResults || 5,
            depth: config?.webSearch?.searchDepth || 'basic'
        };

        if (this.hasInformationRequest(lowerMessage) || this.hasNewsPattern(lowerMessage)) {
            options.depth = 'advanced';
        }

        options.excludeDomains = [
            'facebook.com',
            'instagram.com',
            'twitter.com',
            'tiktok.com',
            'reddit.com'
        ];

        return options;
    }
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
        const { model, messages, config = {} } = requestBody;

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

        // Check OpenRouter API key
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'OpenRouter API key not configured'
                })
            };
        }

        // Get the user's latest message
        const userMessage = messages[messages.length - 1];
        if (!userMessage || userMessage.role !== 'user') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Last message must be from user'
                })
            };
        }

        let searchResults = null;
        let enhancedMessages = [...messages];

        // Initialize Tavily service and check if we should perform web search
        if (process.env.TAVILY_API_KEY && SearchDecision.shouldSearch(userMessage.content, config)) {
            try {
                console.log('Triggering web search for:', userMessage.content);
                
                const tavilyService = new TavilyService(process.env.TAVILY_API_KEY);
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
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `OpenRouter API error: ${response.status} - ${errorText}` 
                })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Server error in chat-with-search:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error' 
            })
        };
    }
};
