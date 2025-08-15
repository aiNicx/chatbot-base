# Documentazione Completa del Progetto ChatBot Base

## 1. Panoramica del Progetto

Il ChatBot Base è un'applicazione web completa che consente di creare chatbot personalizzati con integrazione AI. L'applicazione utilizza l'API OpenRouter per accedere a vari modelli linguistici avanzati.

## 2. Architettura del Sistema

### 2.1 Struttura Generale

L'applicazione è suddivisa in due componenti principali:

1. **Frontend**: Interfaccia utente realizzata con HTML, CSS e JavaScript
2. **Backend**: Server Node.js/Express che funge da intermediario tra il frontend e l'API OpenRouter

### 2.2 Flusso di Comunicazione

```
[Utente] → [Frontend] → [Backend Server] → [OpenRouter API] → [Backend Server] → [Frontend] → [Utente]
```

### 2.3 Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **API Esterna**: OpenRouter API
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
- Endpoint `/api/chat` per le richieste chat
- Endpoint `/api/health` per il controllo dello stato
- Servizio dei file statici frontend

#### 3.2.2 Gestione Dipendenze (server/package.json)

Dipendenze principali:
- `express`: Framework web
- `cors`: Gestione delle richieste cross-origin
- `dotenv`: Gestione delle variabili d'ambiente

### 3.3 Configurazione

#### 3.3.1 Configurazione Principale (config/main-config.json)

```json
{
  "modelId": "z-ai/glm-4-32b",
  "systemPrompt": "Prompt che definisce il comportamento base del chatbot"
}
```

#### 3.3.2 Configurazione Specifica (config/specific-config.json)

Configurazione opzionale per personalizzare ulteriormente il comportamento in contesti specifici.

#### 3.3.3 Variabili d'Ambiente (.env)

```
OPENROUTER_API_KEY=your-api-key-here
```

## 4. Funzionalità Principali

### 4.1 Chat in Tempo Reale

L'applicazione consente una comunicazione bidirezionale in tempo reale tra l'utente e l'AI.

### 4.2 Gestione Prompt di Sistema

Supporto per prompt di sistema multipli:
- Prompt principale per definire il comportamento generale
- Prompt specifico per contesti particolari

### 4.3 Pulsanti Cliccabili

I messaggi possono contenere pulsanti cliccabili usando il formato speciale:
```
[BUTTON:Testo del Pulsante|URL del Link]
```

### 4.4 Design Responsive

L'interfaccia si adatta automaticamente a diversi dispositivi e dimensioni dello schermo.

### 4.5 Feedback Visivo

- Indicatore di caricamento durante l'elaborazione
- Stati visivi per gli elementi interattivi

## 5. Avvio e Configurazione

### 5.1 Prerequisiti

- Node.js versione 14 o superiore
- Chiave API OpenRouter

### 5.2 Installazione

```bash
cd server
npm install
```

### 5.3 Configurazione

1. Imposta la chiave API nel file `.env`
2. Modifica i file di configurazione in `config/` secondo le esigenze

### 5.4 Avvio dell'Applicazione

```bash
# Avvio normale
npm start

# Avvio in modalità sviluppo con riavvio automatico
npm run dev
```

## 6. Endpoint API

### 6.1 POST /api/chat

Endpoint principale per le richieste chat.

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

**Risposta:**
```json
{
  "choices": [
    {
      "message": {
        "content": "AI response"
      }
    }
  ]
}
```

### 6.2 GET /api/health

Endpoint per il controllo dello stato del server.

**Risposta:**
```json
{
  "status": "OK",
  "timestamp": "ISO timestamp"
}
```

## 7. Sicurezza

### 7.1 Gestione delle Chiavi API

- La chiave API è memorizzata solo sul backend
- Utilizzo di variabili d'ambiente per la configurazione
- Mai esporre la chiave API nel codice frontend

### 7.2 Best Practices

- Non committare mai file `.env` nei repository pubblici
- Utilizzare chiavi API con permessi limitati
- Aggiornare regolarmente le dipendenze

## 8. Personalizzazione

### 8.1 Modifica del Modello AI

Cambia il `modelId` in `config/main-config.json` per utilizzare un modello diverso.

### 8.2 Personalizzazione dei Prompt

Modifica i prompt di sistema nei file di configurazione per cambiare il comportamento del chatbot.

### 8.3 Modifica dell'Interfaccia

Aggiorna i file CSS e HTML per modificare l'aspetto dell'applicazione.

### 8.4 Aggiunta di Funzionalità

Estendi i file JavaScript per aggiungere nuove funzionalità al chatbot.

## 9. Troubleshooting

### 9.1 Problemi di Connessione

- Verifica che la chiave API sia corretta
- Controlla la connettività internet
- Assicurati che il server sia in esecuzione

### 9.2 Errori di Configurazione

- Verifica la sintassi dei file JSON di configurazione
- Controlla che tutti i file richiesti siano presenti

### 9.3 Problemi con le Risposte AI

- Verifica che il modello specificato sia valido
- Controlla i prompt di sistema per assicurarti che siano appropriati

## 10. Deployment

### 10.1 Deployment su Piattaforme Cloud

L'applicazione può essere deployata su piattaforme come:
- Heroku
- Vercel
- Netlify (backend separato necessario)

### 10.2 Variabili d'Ambiente per il Deployment

Configura le variabili d'ambiente della piattaforma con:
```
OPENROUTER_API_KEY=your-production-api-key
```

## 11. Manutenzione

### 11.1 Aggiornamento Dipendenze

Regolarmente aggiorna le dipendenze npm:
```bash
cd server
npm update
```

### 11.2 Monitoraggio

- Controlla i log del server per errori
- Monitora l'utilizzo dell'API per rimanere nei limiti

## 12. Estensioni Possibili

- Aggiunta di persistenza dei messaggi
- Implementazione di autenticazione utente
- Supporto per più chat contemporanee
- Integrazione con altre API
- Aggiunta di funzionalità di personalizzazione avanzate