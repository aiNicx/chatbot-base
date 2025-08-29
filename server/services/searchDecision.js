/**
 * Logica decisionale per determinare quando utilizzare la ricerca web
 * Analizza i messaggi degli utenti per identificare richieste che necessitano dati aggiornati
 */
class SearchDecision {
    /**
     * Determina se un messaggio dovrebbe triggerare una ricerca web
     * Sistema intelligente multilingue con pattern recognition avanzato
     * @param {string} message - Messaggio dell'utente
     * @param {object} config - Configurazione del sistema
     * @returns {boolean} - True se serve ricerca web
     */
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

    /**
     * Estrae una query ottimizzata per la ricerca web dal messaggio dell'utente
     * Sistema multilingue intelligente per ottimizzazione query
     * @param {string} message - Messaggio originale
     * @returns {string} - Query ottimizzata
     */
    static extractSearchQuery(message) {
        // Rimuove parole di cortesia multilingue
        let query = message
            .replace(/\b(ciao|hello|hi|hola|salut|hallo|salve|buongiorno|buonasera|good\s+morning|good\s+evening|buenos\s+días|buenas\s+tardes|bonjour|bonsoir|guten\s+tag|guten\s+abend)\b/gi, '')
            .replace(/\b(per\s+favore|please|por\s+favor|s\'il\s+vous\s+plaît|bitte|grazie|thanks|thank\s+you|gracias|merci|danke)\b/gi, '')
            .replace(/\b(dimmi|tell\s+me|dime|dis\s+moi|sag\s+mir|parlami|racconta|spiegami|explain|explica|explique|erkläre)\b/gi, '')
            .replace(/\b(cosa|what|qué|quoi|was|come|how|cómo|comment|wie|puoi|can\s+you|puedes|peux\s+tu|kannst\s+du)\b/gi, '')
            .replace(/\b(di|del|della|dei|delle|il|la|i|le|un|una|of|the|a|an|de|du|des|le|la|les|un|une|der|die|das|ein|eine)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Se la query è troppo corta, usa il messaggio originale ripulito
        if (query.length < 3) {
            query = message.replace(/\b(ciao|hello|hi|grazie|thanks|per\s+favore|please)\b/gi, '').trim();
        }

        // Limita la lunghezza della query
        if (query.length > 100) {
            query = query.substring(0, 100).trim();
        }

        return query;
    }

    /**
     * Controlla se il messaggio contiene pattern temporali multilingue
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
    static hasTemporalPattern(lowerMessage) {
        // Pattern temporali estesi per 5 lingue principali
        const temporalPattern = /\b(oggi|today|hoy|aujourd\'?hui|heute|adesso|now|ahora|maintenant|jetzt|ora|hour|heure|stunde|attualmente|currently|derzeit|al\s+momento|right\s+now|en\s+este\s+momento|en\s+ce\s+moment|gerade\s+jetzt|questa\s+settimana|this\s+week|esta\s+semana|cette\s+semaine|diese\s+woche|questo\s+mese|this\s+month|este\s+mes|ce\s+mois|diesen\s+monat|quest\'?anno|this\s+year|este\s+año|cette\s+année|dieses\s+jahr|recente|recent|reciente|récent|kürzlich|ultimo|last|último|dernier|letzter|ultima|latest|más\s+reciente|plus\s+récent|neueste|ieri|yesterday|ayer|hier|gestern|domani|tomorrow|mañana|demain|morgen|stamattina|this\s+morning|esta\s+mañana|ce\s+matin|heute\s+morgen|stasera|tonight|esta\s+noche|ce\s+soir|heute\s+abend|in\s+tempo\s+reale|real\s+time|tiempo\s+real|temps\s+réel|echtzeit|aggiornato|updated|actualizado|mis\s+à\s+jour|aktualisiert|aggiornamenti|updates|actualizaciones|mises\s+à\s+jour|aktualisierungen)\b/i;
        
        return temporalPattern.test(lowerMessage);
    }

    /**
     * Controlla se il messaggio è una richiesta di informazioni specifiche multilingue
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
    static hasInformationRequest(lowerMessage) {
        const infoPatterns = [
            // Pattern di prezzo multilingue
            /(prezzo|price|precio|prix|preis)\s+(di|del|della|of|de|du|von)?\s*\w+/i,
            /(quanto|how\s+much|cuánto|combien|wie\s+viel)\s+(costa|costs?|cuesta|coûte|kostet)/i,
            
            // Pattern meteo multilingue
            /(che\s+tempo\s+fa|what\'?s\s+the\s+weather|qué\s+tiempo\s+hace|quel\s+temps\s+fait|wie\s+ist\s+das\s+wetter)/i,
            /(meteo|weather|tiempo|météo|wetter)\s+(di|a|in|at|de|à|en|in)?\s*\w+/i,
            /(temperatura|temperature|température|temperatur)\s+(di|a|in|at|de|à|en|in)?\s*\w+/i,
            
            // Pattern orari/info multilingue
            /(orari?|hours?|horarios?|heures?|öffnungszeiten)\s+(di|del|della|of|de|du|von)?\s*\w+/i,
            /(indirizzo|address|dirección|adresse|adresse)\s+(di|del|della|of|de|du|von)?\s*\w+/i,
            /(telefono|phone|teléfono|téléphone|telefon)\s+(di|del|della|of|de|du|von)?\s*\w+/i,
            
            // Pattern localizzazione multilingue
            /(dove|where|dónde|où|wo)\s+(si\s+trova|è|sono|is|are|está|están|est|sont|ist|sind)/i,
            /(quando|when|cuándo|quand|wann)\s+(apre|chiude|inizia|finisce|opens?|closes?|starts?|ends?|abre|cierra|empieza|termina|ouvre|ferme|commence|finit|öffnet|schließt|beginnt|endet)/i
        ];

        return infoPatterns.some(pattern => pattern.test(lowerMessage));
    }

    /**
     * Controlla se il messaggio riguarda notizie o eventi multilingue
     * @param {string} lowerMessage - Messaggio in minuscolo
     * @returns {boolean}
     */
    static hasNewsPattern(lowerMessage) {
        // Pattern notizie/eventi esteso multilingue
        const newsPattern = /\b(notizie|news|noticias|nouvelles|nachrichten|cronaca|chronicle|crónica|chronique|chronik|attualità|current\s+affairs|actualidad|actualités|aktuelle\s+ereignisse|eventi|events?|eventos|événements|veranstaltungen|evento|event|manifestazione|demonstration|manifestación|manifestation|demonstration|politica|politics|política|politique|politik|elezioni|elections?|elecciones|élections|wahlen|governo|government|gobierno|gouvernement|regierung|economia|economy|economía|économie|wirtschaft|borsa|stock\s+market|bolsa|bourse|börse|mercato|market|marché|markt|bitcoin|crypto|criptovalute|cryptocurrency|crypto\-monnaie|kryptowährung|sport|sports?|deportes|équipe|mannschaft|calcio|football|soccer|fútbol|fußball|partita|match|partido|spiel|campionato|championship|campeonato|championnat|meisterschaft|meteo|weather|tiempo|météo|wetter|terremoto|earthquake|terremoto|tremblement\s+de\s+terre|erdbeben|alluvione|flood|inundación|inondation|überschwemmung|emergenza|emergency|emergencia|urgence|notfall|covid|pandemia|pandemic|pandemia|pandémie|pandemie|vaccino|vaccine|vacuna|vaccin|impfstoff|guerra|war|guerra|guerre|krieg|conflitto|conflict|conflicto|conflit|konflikt|pace|peace|paz|paix|frieden)\b/i;
        
        return newsPattern.test(lowerMessage);
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
