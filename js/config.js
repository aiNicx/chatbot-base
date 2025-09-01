// Configurazione modulare del chatbot

class Config {
    static async loadConfig() {
        try {
            // Carica la configurazione principale
            const mainConfigResponse = await fetch('config/main-config.json');
            const mainConfig = await mainConfigResponse.json();
            
            // Carica la configurazione specifica (opzionale)
            let specificConfig = null;
            try {
                const specificConfigResponse = await fetch('config/specific-config.json');
                specificConfig = await specificConfigResponse.json();
            } catch (error) {
                console.warn('Configurazione specifica non trovata o non valida, uso solo la configurazione principale');
            }
            
            // Genera il sistema prompt combinato
            const combinedPrompt = this.buildSystemPrompt(mainConfig, specificConfig);
            
            return {
                modelId: mainConfig.modelId,
                primarySystemPrompt: combinedPrompt.primary,
                secondarySystemPrompt: combinedPrompt.secondary,
                webSearch: mainConfig.webSearch || { enabled: false },
                rawConfig: { mainConfig, specificConfig } // Per debug e uso futuro
            };
        } catch (error) {
            console.error('Errore nel caricamento della configurazione:', error);
            return this.getFallbackConfig();
        }
    }

    static buildSystemPrompt(mainConfig, specificConfig) {
        // Costruisce il prompt primario dalla configurazione principale
        let primaryPrompt = this.buildPromptFromConfig(mainConfig.systemConfig || {});
        
        // Costruisce il prompt secondario dalla configurazione specifica
        let secondaryPrompt = null;
        if (specificConfig) {
            secondaryPrompt = this.buildPromptFromConfig(specificConfig, true);
        }
        
        return {
            primary: primaryPrompt.trim(),
            secondary: secondaryPrompt ? secondaryPrompt.trim() : null
        };
    }

    /**
     * Costruisce dinamicamente il prompt da qualsiasi struttura JSON
     */
    static buildPromptFromConfig(config, isSecondary = false) {
        let prompt = '';
        
        // Aggiungi istruzione critica per il rilevamento lingua all'inizio
        if (!isSecondary) {
            prompt += `🚨 ISTRUZIONE CRITICA LINGUA 🚨
DEVI SEMPRE rilevare automaticamente la lingua del messaggio dell'utente e rispondere ESCLUSIVAMENTE in quella stessa lingua.
- Se l'utente scrive in inglese → rispondi in inglese
- Se l'utente scrive in spagnolo → rispondi in spagnolo  
- Se l'utente scrive in francese → rispondi in francese
- Se l'utente scrive in tedesco → rispondi in tedesco
- Se l'utente scrive in italiano → rispondi in italiano
- E così via per qualsiasi altra lingua

NON mescolare mai le lingue. NON rispondere in italiano se l'utente scrive in un'altra lingua.

`;
        }
        
        // Processa ricorsivamente ogni chiave della configurazione
        for (const [key, value] of Object.entries(config)) {
            if (value && typeof value === 'object') {
                prompt += this.processConfigSection(key, value, isSecondary);
            }
        }
        
        return prompt;
    }

    /**
     * Processa dinamicamente una sezione della configurazione
     */
    static processConfigSection(sectionKey, sectionData, isSecondary = false, level = 2) {
        let section = '';
        const headerLevel = '#'.repeat(level);
        
        // Crea l'intestazione della sezione
        const sectionTitle = this.formatSectionTitle(sectionKey);
        section += `${headerLevel} ${sectionTitle}\n`;
        
        // Processa il contenuto della sezione
        section += this.processConfigContent(sectionData, level + 1);
        section += '\n';
        
        return section;
    }

    /**
     * Processa dinamicamente il contenuto di una sezione
     */
    static processConfigContent(data, level = 3) {
        let content = '';
        
        if (Array.isArray(data)) {
            // Se è un array, crea una lista
            data.forEach(item => {
                if (typeof item === 'string') {
                    content += `- ${item}\n`;
                } else if (typeof item === 'object') {
                    content += this.processObjectInArray(item);
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            // Se è un oggetto, processa le sue proprietà
            for (const [key, value] of Object.entries(data)) {
                content += this.processObjectProperty(key, value, level);
            }
        } else if (typeof data === 'string') {
            // Se è una stringa semplice
            content += `${data}\n\n`;
        }
        
        return content;
    }

    /**
     * Processa una proprietà di un oggetto
     */
    static processObjectProperty(key, value, level) {
        let content = '';
        const propertyTitle = this.formatPropertyTitle(key);
        
        if (typeof value === 'string') {
            content += `**${propertyTitle}**: ${value}\n`;
        } else if (Array.isArray(value)) {
            content += `**${propertyTitle}**:\n`;
            value.forEach(item => {
                if (typeof item === 'string') {
                    content += `- ${item}\n`;
                } else if (typeof item === 'object') {
                    content += this.processObjectInArray(item);
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            content += `**${propertyTitle}**:\n`;
            content += this.processConfigContent(value, level + 1);
        }
        
        return content;
    }

    /**
     * Processa un oggetto all'interno di un array
     */
    static processObjectInArray(obj) {
        let content = '';
        
        // Cerca una proprietà "name" o "title" per l'intestazione
        const nameKey = Object.keys(obj).find(key => 
            ['name', 'title', 'tipo', 'type'].includes(key.toLowerCase())
        );
        
        if (nameKey) {
            content += `**${obj[nameKey]}**\n`;
        }
        
        // Processa le altre proprietà
        for (const [key, value] of Object.entries(obj)) {
            if (key !== nameKey) {
                if (typeof value === 'string') {
                    const propTitle = this.formatPropertyTitle(key);
                    content += `- ${propTitle}: ${value}\n`;
                } else if (Array.isArray(value)) {
                    const propTitle = this.formatPropertyTitle(key);
                    content += `- ${propTitle}: ${value.join(', ')}\n`;
                }
            }
        }
        content += '\n';
        
        return content;
    }

    /**
     * Formatta il titolo di una sezione
     */
    static formatSectionTitle(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .toUpperCase();
    }

    /**
     * Formatta il titolo di una proprietà
     */
    static formatPropertyTitle(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ');
    }

    static getFallbackConfig() {
        return {
            modelId: 'google/gemini-2.0-flash-001',
            primarySystemPrompt: 'Sei un assistente virtuale utile, cortese e competente. Il tuo scopo è aiutare gli utenti fornendo informazioni accurate, assistenza con compiti specifici e mantenendo una conversazione amichevole e professionale.',
            secondarySystemPrompt: null,
            webSearch: { enabled: false }
        };
    }
}

// Esporta la classe per uso globale
window.Config = Config;
