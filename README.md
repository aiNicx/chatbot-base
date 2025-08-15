# ChatBot Base Project

Un progetto base per creare chatbot personalizzati con integrazione AI.

## Struttura del Progetto

```
project-root/
├── .env                  # API key storage (not committed to version control)
├── config/
│   ├── main-config.json   # Main configuration (model ID, primary system prompt)
│   └── specific-config.json # Optional specific configuration (secondary system prompt)
├── js/
│   ├── config.js         # Configuration loader
│   └── chat.js           # Chat logic
├── css/
│   └── style.css         # Styling
├── docs/                 # Documentation files
├── server/               # Backend server implementation
│   ├── package.json      # Server dependencies
│   ├── server.js         # Main server file
│   └── README.md         # Server documentation
├── index.html            # Main HTML file
└── README.md             # This file
```

## Architettura

Il progetto è suddiviso in due parti principali:

1. **Frontend**: Interfaccia utente HTML/CSS/JavaScript che gestisce la chat e la visualizzazione
2. **Backend**: Server Node.js/Express che funge da intermediario tra il frontend e l'API OpenRouter

### Flusso di comunicazione

1. L'utente interagisce con l'interfaccia frontend
2. Il frontend invia le richieste all'endpoint `/api/chat` del backend
3. Il backend inoltra le richieste all'API OpenRouter usando la chiave API configurata
4. Le risposte vengono restituite al frontend per la visualizzazione

## Configurazione

### Configurazione principale
Modifica il file `config/main-config.json` per impostare:
- `modelId`: ID del modello AI da utilizzare (es. "z-ai/glm-4-32b")
- `systemPrompt`: Prompt di sistema principale che definisce il comportamento del chatbot

### Configurazione specifica (opzionale)
Il file `config/specific-config.json` può contenere un prompt di sistema secondario per personalizzare ulteriormente il comportamento del chatbot per contesti specifici.

### Configurazione API
Imposta la chiave API OpenRouter nel file `.env` nella directory principale:
```
OPENROUTER_API_KEY=your-actual-api-key-here
```

## Avvio dell'applicazione

1. Assicurati di avere Node.js installato (versione 14 o superiore)
2. Installa le dipendenze del server:
   ```bash
   cd server
   npm install
   ```
3. Configura la chiave API nel file `.env` nella directory principale
4. Avvia il server:
   ```bash
   npm start
   ```
   o per lo sviluppo con riavvio automatico:
   ```bash
   npm run dev
   ```
   o direttamente con Node.js:
   ```bash
   node server.js
   ```

## Endpoint API

- `POST /api/chat` - Inoltra le richieste di chat all'API OpenRouter
- `GET /api/health` - Endpoint per il controllo dello stato del server

## Funzionalità

- Chat in tempo reale con AI
- Supporto per prompt di sistema multipli
- Pulsanti cliccabili nei messaggi usando il formato `[BUTTON:Testo|URL]`
- Design responsive per dispositivi mobili
- Indicatore di caricamento durante l'elaborazione delle richieste

## Sicurezza

- La chiave API è memorizzata nel backend e non è esposta al frontend
- Usa le variabili d'ambiente per gestire le chiavi API nei deployment di produzione
- Non committare mai le chiavi API nel codice sorgente
