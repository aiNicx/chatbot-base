/**
 * Logica decisionale per determinare quando utilizzare la ricerca web
 * Analizza i messaggi degli utenti per identificare richieste che necessitano dati aggiornati
 */
class SearchDecision {
    /**
     * Determina se un messaggio dovrebbe triggerare una ricerca web
     * @param {string} message - Messaggio dell'utente
     * @param {object} config - Configurazione del sistema
     * @returns {boolean} - True se serve ricerca web
     */
    static shouldSearch(message, config) {
        if (!config?.webSearch?.enabled) {
            return false;
        }

        const lowerMessage = message.toLowerCase();
        const triggers = config.webSearch.triggers || [];

        // Controlla trigger keywords configurati
        const hasKeywordTrigger = triggers.some(trigger => 
            lowerMessage.includes(trigger.toLowerCase())
        );

        // Controlla pattern temporali
        const hasTemporalPattern = this.hasTemporalPattern(lowerMessage);

        // Controlla richieste di informazioni specifiche
        const hasInfoRequest = this.hasInformationRequest(lowerMessage);

        // Controlla pattern di notizie/eventi
        const hasNewsPattern = this.hasNewsPattern(lowerMessage);

        return hasKeywordTrigger || hasTemporalPattern || hasInfoRequest || hasNewsPattern;
    }

    /**
     * Estrae una query ottimizzata per la ricerca web dal messaggio dell'utente
     * @param {string} message - Messaggio originale
     * @returns {string} - Query ottimizzata
     */
    static extractSearchQuery(message) {
        // Rimuove parole di cortesia comuni
        let query = message
            .replace(/\b(ciao|salve|buongiorno|buonasera|per favore|grazie)\b/gi, '')
            .replace(/\b(dimmi|parlami|racconta|spiegami|cosa|come|puoi)\b/gi, '')
            .replace(/\b(di|del|della|dei|delle|il|la|i|le|un|una)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Se la query è troppo corta, usa il messaggio originale
        if (query.length < 3) {
            query = message;
        }

        // Limita la lunghezza della query
        if (query.length > 100) {
            query = query.substring(0, 100).trim();
        }

        return query;
    }

    /**
     * Controlla se il messaggio contiene pattern temporali
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
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

    /**
     * Controlla se il messaggio è una richiesta di informazioni specifiche
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
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

    /**
     * Controlla se il messaggio riguarda notizie o eventi
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
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

    /**
     * Valuta la priorità della ricerca web (0-1)
     * @param {string} message - Messaggio dell'utente
     * @param {object} config - Configurazione
     * @returns {number} - Priorità (0 = bassa, 1 = alta)
     */
    static getSearchPriority(message, config) {
        if (!this.shouldSearch(message, config)) {
            return 0;
        }

        const lowerMessage = message.toLowerCase();
        let priority = 0.5; // priorità base

        // Aumenta priorità per pattern temporali
        if (this.hasTemporalPattern(lowerMessage)) {
            priority += 0.3;
        }

        // Aumenta priorità per richieste di informazioni specifiche
        if (this.hasInformationRequest(lowerMessage)) {
            priority += 0.2;
        }

        // Aumenta priorità per notizie
        if (this.hasNewsPattern(lowerMessage)) {
            priority += 0.2;
        }

        return Math.min(priority, 1.0);
    }

    /**
     * Genera opzioni di ricerca basate sul messaggio
     * @param {string} message - Messaggio dell'utente
     * @param {object} config - Configurazione
     * @returns {object} - Opzioni per TavilyService
     */
    static getSearchOptions(message, config) {
        const lowerMessage = message.toLowerCase();
        const options = {
            maxResults: config?.webSearch?.maxResults || 5,
            depth: config?.webSearch?.searchDepth || 'basic'
        };

        // Usa ricerca avanzata per query complesse
        if (this.hasInformationRequest(lowerMessage) || this.hasNewsPattern(lowerMessage)) {
            options.depth = 'advanced';
        }

        // Domini escludere per privacy/qualità
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

module.exports = SearchDecision;
