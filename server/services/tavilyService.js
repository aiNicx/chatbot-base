/**
 * Servizio per l'integrazione con l'API di Tavily
 * Gestisce le chiamate di ricerca web per il chatbot
 */
class TavilyService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.tavily.com';
        this.timeout = 5000; // 5 secondi timeout
    }

    /**
     * Esegue una ricerca web utilizzando l'API Tavily
     * @param {string} query - Query di ricerca
     * @param {object} options - Opzioni aggiuntive per la ricerca
     * @returns {Promise<object>} - Risultati della ricerca
     */
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
            include_answer: options.includeAnswer !== false, // default true
            max_results: Math.min(options.maxResults || 5, 10), // max 10 risultati
            include_domains: options.includeDomains || [],
            exclude_domains: options.excludeDomains || [],
            include_raw_content: false, // per ridurre payload
            include_images: false // non necesssario per chatbot testuale
        };

        try {
            console.log(`[TavilyService] Eseguendo ricerca per: "${query}"`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(`${this.baseURL}/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[TavilyService] Errore API ${response.status}:`, errorText);
                throw new Error(`Errore API Tavily: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`[TavilyService] Ricerca completata: ${data.results?.length || 0} risultati`);
            
            return this.formatResults(data);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('[TavilyService] Timeout ricerca web');
                throw new Error('Timeout ricerca web');
            }
            
            console.error('[TavilyService] Errore durante ricerca:', error);
            throw error;
        }
    }

    /**
     * Formatta i risultati della ricerca per l'uso nel chatbot
     * @param {object} rawData - Dati grezzi da Tavily
     * @returns {object} - Dati formattati
     */
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

    /**
     * Verifica se il servizio è configurato correttamente
     * @returns {boolean} - True se configurato
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Test di connettività con l'API Tavily
     * @returns {Promise<boolean>} - True se la connessione funziona
     */
    async testConnection() {
        try {
            await this.search('test connection', { maxResults: 1 });
            return true;
        } catch (error) {
            console.error('[TavilyService] Test connessione fallito:', error.message);
            return false;
        }
    }
}

module.exports = TavilyService;
