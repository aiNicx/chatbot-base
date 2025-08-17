# Documentazione Completa del Progetto ChatBot Base

## 1. Panoramica del Progetto

Il ChatBot Base è un'applicazione web completa che consente di creare chatbot personalizzati con integrazione AI avanzata. L'applicazione utilizza l'API OpenRouter per accedere a vari modelli linguistici e l'API Tavily per la ricerca web in tempo reale, offrendo risposte aggiornate e accurate.

## 2. Architettura del Sistema

### 2.1 Struttura Generale

L'applicazione è suddivisa in tre componenti principali:

1. **Frontend**: Interfaccia utente realizzata con HTML, CSS e JavaScript
2. **Backend**: Server Node.js/Express che funge da intermediario tra il frontend e le API esterne
3. **Ricerca Web**: Integrazione con Tavily API per informazioni aggiornate in tempo reale

### 2.2 Flusso di Comunicazione

```
[Utente] → [Frontend] → [Backend Server] → [OpenRouter API] ↗
                                                           ↘ [Tavily API] (ricerca web opzionale)
                       ← [Backend Server] ← [Risposta AI Enhanced] ←
```

### 2.3 Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **API Esterne**: 
  - OpenRouter API (per modelli AI)
  - Tavily API (per ricerca web)
- **Gestione Dipendenze**: npm

## 3. Componenti del Progetto

### 3.1 Frontend

#### 3.1.1 Struttura HTML (index.html)

Il file `index.html` contiene la struttura base dell'interfaccia chat:
- Header con titolo dell'applicazione
- Contenitore principale per i messaggi
- Area di input per l'utente
- Collegamenti ai file JavaScript

#### 3.1.2 Stile CSS (css/style.css)

Il file `style.css` definisce l'aspetto dell'applicazione:
- Layout responsive
- Stili per i messaggi utente e bot
- Animazioni e transizioni
- Stili per i pulsanti cliccabili

#### 3.1.3 Logica JavaScript

##### Configurazione (js/config.js)
Gestisce il caricamento delle configurazioni:
- Carica `config/main-config.json`
- Carica opzionalmente `config/specific-config.json`
- Combina le configurazioni per l'uso nel chatbot

##### Chat (js/chat.js)
Contiene la logica principale del chatbot:
- Gestione dell'interfaccia utente
- Comunicazione con il backend
- Parsing e rendering dei contenuti (inclusi i pulsanti)
- Gestione degli eventi di input

### 3.2 Backend

#### 3.2.1 Server Principale (server/server.js)

Il server Express gestisce:
- Middleware per CORS e parsing JSON
- Endpoint `/api/chat` per le richieste chat standard
- **Endpoint `/api/chat-with-search` per le richieste con ricerca web**
- Endpoint `/api/health` per il controllo dello stato (include info servizi)
- Servizio dei file statici frontend
- Inizializzazione e gestione dei servizi Tavily

#### 3.2.2 Servizi Backend

**TavilyService (server/services/tavilyService.js)**
- Gestisce le chiamate all'API Tavily
- Formattazione e validazione dei risultati
- Gestione timeout e error handling
- Cache e ottimizzazioni delle ricerche

**SearchDecision (server/services/searchDecision.js)**
- Logica intelligente per decidere quando utilizzare la ricerca web
- Analisi di trigger keywords e pattern temporali
- Estrazione e ottimizzazione delle query di ricerca
- Configurazione dinamica delle opzioni di ricerca

#### 3.2.3 Gestione Dipendenze (server/package.json)

Dipendenze principali:
- `express`: Framework web
- `cors`: Gestione delle richieste cross-origin
- `dotenv`: Gestione delle variabili d'ambiente

### 3.3 Configurazione

#### 3.3.1 Configurazione Principale (config/main-config.json)

```json
{
  "modelId": "z-ai/glm-4-32b",
  "systemPrompt": "Prompt che definisce il comportamento base del chatbot",
  "webSearch": {
    "enabled": true,
    "maxResults": 5,
    "searchDepth": "basic",
    "triggers": [
      "oggi", "adesso", "ora", "notizie", "eventi", "prezzo",
      "meteo", "tempo fa", "quando", "dove", "ultimo", "bitcoin",
      "borsa", "mercato", "politica", "sport", "calcio"
    ]
  }
}
```

**Nuove opzioni di configurazione:**
- `webSearch.enabled`: Abilita/disabilita la ricerca web
- `webSearch.maxResults`: Numero massimo di risultati da Tavily (1-10)
- `webSearch.searchDepth`: "basic" o "advanced" per controllo qualità/velocità
- `webSearch.triggers`: Array di keywords che attivano la ricerca web

#### 3.3.2 Configurazione Specifica (config/specific-config.json)

Configurazione opzionale per personalizzare ulteriormente il comportamento in contesti specifici.

#### 3.3.3 Variabili d'Ambiente (.env)

```
OPENROUTER_API_KEY=your-openrouter-api-key
TAVILY_API_KEY=your-tavily-api-key
```

## 4. Funzionalità Principali

### 4.1 Chat in Tempo Reale

L'applicazione consente una comunicazione bidirezionale in tempo reale tra l'utente e l'AI.

### 4.2 **Ricerca Web Intelligente** 🆕

**Funzionalità avanzata di ricerca web automatica:**
- **Attivazione Automatica**: Il sistema decide automaticamente quando utilizzare la ricerca web basandosi su trigger keywords e pattern del messaggio
- **Integrazione Tavily**: Utilizza l'API Tavily per ricerche web di alta qualità
- **Contestualizzazione**: I risultati web vengono integrati nel contesto della conversazione AI
- **Indicatori Visivi**: Notifiche quando viene utilizzata la ricerca web
- **Fallback Intelligente**: Continua a funzionare anche se la ricerca web fallisce

**Trigger per Ricerca Web:**
- Informazioni temporali: "oggi", "adesso", "ora"
- Notizie e eventi: "notizie", "eventi", "ultimo"
- Dati specifici: "prezzo", "meteo", "quando", "dove"
- Mercati finanziari: "bitcoin", "borsa", "mercato"
- Sport e politica: "partita", "elezioni", "governo"

### 4.3 Gestione Prompt di Sistema

Supporto per prompt di sistema multipli:
- Prompt principale per definire il comportamento generale
- Prompt specifico per contesti particolari
- **Prompt di ricerca web integrati per gestire informazioni aggiornate**

### 4.4 Pulsanti Cliccabili

I messaggi possono contenere pulsanti cliccabili usando il formato speciale:
```
[BUTTON:Testo del Pulsante|URL del Link]
```

### 4.5 Design Responsive

L'interfaccia si adatta automaticamente a diversi dispositivi e dimensioni dello schermo.

### 4.6 Feedback Visivo

- Indicatore di caricamento durante l'elaborazione
- Stati visivi per gli elementi interattivi
- **Notifiche animate quando viene utilizzata la ricerca web**
- **Indicatori di fonte per informazioni aggiornate dal web**

## 5. Avvio e Configurazione

### 5.1 Prerequisiti

- Node.js versione 14 o superiore
- Chiave API OpenRouter
- **Chiave API Tavily per la ricerca web**

### 5.2 Installazione

```bash
cd server
npm install
```

### 5.3 Configurazione

1. **Configura le chiavi API nel file `.env`:**
```env
OPENROUTER_API_KEY=your-openrouter-api-key
TAVILY_API_KEY=your-tavily-api-key
```

2. **Modifica i file di configurazione in `config/` secondo le esigenze:**
   - Personalizza i trigger per la ricerca web in `main-config.json`
   - Abilita/disabilita la ricerca web tramite `webSearch.enabled`
   - Configura il numero massimo di risultati e la profondità di ricerca

### 5.4 Avvio dell'Applicazione

```bash
# Avvio normale
npm start

# Avvio in modalità sviluppo con riavvio automatico
npm run dev
```

## 6. Endpoint API

### 6.1 POST /api/chat

Endpoint per le richieste chat standard (senza ricerca web).

**Corpo della richiesta:**
```json
{
  "model": "model-id",
  "messages": [
    {"role": "system", "content": "system prompt"},
    {"role": "user", "content": "user message"}
  ]
}
```

### 6.2 **POST /api/chat-with-search** 🆕

**Endpoint principale con ricerca web intelligente.**

**Corpo della richiesta:**
```json
{
  "model": "model-id",
  "messages": [
    {"role": "system", "content": "system prompt"},
    {"role": "user", "content": "user message"}
  ],
  "config": {
    "webSearch": {
      "enabled": true,
      "maxResults": 5,
      "searchDepth": "basic",
      "triggers": ["oggi", "notizie", "prezzo"]
    }
  }
}
```

**Risposta:**
```json
{
  "choices": [
    {
      "message": {
        "content": "AI response with web info"
      }
    }
  ],
  "searchMetadata": {
    "searchPerformed": true,
    "query": "extracted search query",
    "resultsCount": 3,
    "sources": [
      {"title": "Source 1", "url": "https://example1.com"},
      {"title": "Source 2", "url": "https://example2.com"}
    ]
  }
}
```

### 6.3 GET /api/health

Endpoint per il controllo dello stato del server e dei servizi.

**Risposta:**
```json
{
  "status": "OK",
  "timestamp": "ISO timestamp",
  "services": {
    "openRouter": true,
    "tavily": true
  }
}
```

## 7. Sicurezza

### 7.1 Gestione delle Chiavi API

- **Tutte le chiavi API sono memorizzate solo sul backend**
- Utilizzo di variabili d'ambiente per la configurazione
- Mai esporre le chiavi API nel codice frontend
- **Separazione delle responsabilità: OpenRouter per AI, Tavily per ricerca web**

### 7.2 Best Practices

- Non committare mai file `.env` nei repository pubblici
- Utilizzare chiavi API con permessi limitati
- Aggiornare regolarmente le dipendenze
- **Monitorare l'utilizzo delle API per evitare rate limiting**
- **Implementare timeout appropriati per le ricerche web**

## 8. Personalizzazione

### 8.1 Modifica del Modello AI

Cambia il `modelId` in `config/main-config.json` per utilizzare un modello diverso.

### 8.2 Personalizzazione dei Prompt

Modifica i prompt di sistema nei file di configurazione per cambiare il comportamento del chatbot.

### 8.3 Modifica dell'Interfaccia

Aggiorna i file CSS e HTML per modificare l'aspetto dell'applicazione.

### 8.4 **Personalizzazione Ricerca Web** 🆕

**Modifica dei Trigger di Ricerca:**
```json
{
  "webSearch": {
    "triggers": [
      "personalizza", "questi", "trigger", "keywords"
    ]
  }
}
```

**Configurazione Domini:**
- Aggiungi domini fidati in `SearchDecision.getSearchOptions()`
- Modifica domini esclusi per privacy/qualità
- Personalizza profondità di ricerca per tipo di query

**Personalizzazione Logica:**
- Estendi `SearchDecision.hasTemporalPattern()` per nuovi pattern
- Modifica `SearchDecision.extractSearchQuery()` per ottimizzazioni specifiche
- Personalizza formattazione risultati in `TavilyService.formatResults()`

### 8.5 Aggiunta di Funzionalità

Estendi i file JavaScript per aggiungere nuove funzionalità al chatbot.

## 9. Troubleshooting

### 9.1 Problemi di Connessione

- Verifica che le chiavi API (OpenRouter e Tavily) siano corrette
- Controlla la connettività internet
- Assicurati che il server sia in esecuzione
- **Usa `/api/health` per verificare lo stato dei servizi**

### 9.2 Errori di Configurazione

- Verifica la sintassi dei file JSON di configurazione
- Controlla che tutti i file richiesti siano presenti
- **Assicurati che `webSearch.enabled` sia configurato correttamente**
- **Verifica che i trigger keywords siano array di stringhe**

### 9.3 Problemi con le Risposte AI

- Verifica che il modello specificato sia valido
- Controlla i prompt di sistema per assicurarti che siano appropriati
- **Se la ricerca web fallisce, l'AI continuerà a funzionare normalmente**

### 9.4 **Problemi Ricerca Web** 🆕

- **Chiave API Tavily non valida**: Controlla la configurazione in `.env`
- **Timeout ricerche**: Aumenta il timeout in `TavilyService` se necessario
- **Nessun risultato**: Verifica i trigger keywords e la logica decisionale
- **Rate limiting**: Monitora l'utilizzo API e implementa cache se necessario
- **Debug**: Controlla i log console per vedere quando viene attivata la ricerca

## 10. Deployment

### 10.1 Deployment su Piattaforme Cloud

L'applicazione può essere deployata su piattaforme come:
- Heroku
- Vercel
- Netlify (backend separato necessario)

### 10.2 Variabili d'Ambiente per il Deployment

Configura le variabili d'ambiente della piattaforma con:
```
OPENROUTER_API_KEY=your-production-openrouter-key
TAVILY_API_KEY=your-production-tavily-key
```

**Note per Netlify Functions:**
- Le Netlify Functions hanno accesso alle stesse variabili d'ambiente
- La funzione `chat-with-search.js` replica la logica del server Express
- Assicurati che entrambe le API keys siano configurate nell'ambiente Netlify

## 11. Manutenzione

### 11.1 Aggiornamento Dipendenze

Regolarmente aggiorna le dipendenze npm:
```bash
cd server
npm update
```

### 11.2 Monitoraggio

- Controlla i log del server per errori
- **Monitora l'utilizzo delle API (OpenRouter e Tavily) per rimanere nei limiti**
- **Traccia la frequenza di utilizzo della ricerca web**
- **Monitora i tempi di risposta con e senza ricerca web**

## 12. Estensioni Possibili

### 12.1 Estensioni Base
- Aggiunta di persistenza dei messaggi
- Implementazione di autenticazione utente
- Supporto per più chat contemporanee

### 12.2 **Estensioni Ricerca Web** 🆕
- **Cache intelligente per risultati di ricerca**
- **Filtri avanzati per domini e tipologie di contenuto**
- **Integrazione con altre API di ricerca (Google, Bing)**
- **Analisi sentiment dei risultati web**
- **Ricerca per immagini e contenuti multimediali**
- **Personalizzazione trigger basata su ML**
- **Dashboard di monitoraggio utilizzo ricerca web**

### 12.3 Miglioramenti AI
- Integrazione con modelli specializzati per diversi domini
- Aggiunta di funzionalità di personalizzazione avanzate
- Sistema di feedback per migliorare la qualità delle risposte

---

## 📊 Riepilogo Implementazione Ricerca Web Intelligente 🆕

### ✅ **Componenti Implementati**

1. **TavilyService** - Gestione completa API Tavily
2. **SearchDecision** - Logica intelligente per attivazione ricerca
3. **Backend Express** - Nuovo endpoint `/api/chat-with-search`
4. **Netlify Functions** - Supporto serverless con `chat-with-search.js`
5. **Frontend** - Integrazione automatica e indicatori visivi
6. **Configurazione** - Sistema completo di trigger e opzioni

### 🎯 **Funzionalità Chiave**

- **Attivazione Automatica**: 40+ trigger keywords configurabili
- **Fallback Intelligente**: Continua a funzionare se Tavily non è disponibile
- **Timeout Gestito**: 5 secondi max per ricerca web
- **Indicatori Visivi**: Notifiche animate quando si usa la ricerca
- **Doppio Ambiente**: Supporto completo Express + Netlify
- **Sicurezza**: Tutte le API keys protette sul backend

### 📈 **Benefici**

- **Informazioni Aggiornate**: Accesso a dati in tempo reale
- **Trasparenza**: L'utente sa quando vengono usate info dal web
- **Performance**: Ricerca opzionale non rallenta chat normale
- **Scalabilità**: Sistema modulare facilmente estendibile