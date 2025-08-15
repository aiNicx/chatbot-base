// Configurazione del chatbot
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
            
            // Combina le configurazioni
            return {
                modelId: mainConfig.modelId,
                primarySystemPrompt: mainConfig.systemPrompt,
                secondarySystemPrompt: specificConfig && specificConfig.systemPrompt ? specificConfig.systemPrompt : null
            };
        } catch (error) {
            console.error('Errore nel caricamento della configurazione:', error);
            return {
                modelId: '',
                primarySystemPrompt: 'Sei un assistente virtuale di nome Marios Brazil, utile, cortese e competente. Il tuo scopo è aiutare gli utenti fornendo informazioni accurate, assistenza con compiti specifici e mantenendo una conversazione amichevole e professionale.',
                secondarySystemPrompt: null
            };
        }
    }
}

// Esporta la classe per uso globale
window.Config = Config;