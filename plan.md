# Piano di Integrazione Ricerca Web con Tavily

## 📋 Panoramica

Integrare l'API di Tavily nel sistema chatbot esistente per fornire capacità di ricerca web intelligente. Il chatbot potrà decidere autonomamente quando utilizzare la ricerca web per fornire informazioni aggiornate e accurate.

## 🎯 Obiettivi

1. **Ricerca Web Opzionale**: Il chatbot può scegliere se utilizzare o meno la ricerca web
2. **Integrazione Trasparente**: Mantenere l'architettura esistente (Express.js + Netlify Functions)
3. **Codice Pulito**: Implementazione modulare e manutenibile
4. **Performance**: Ricerca rapida senza impatti significativi sui tempi di risposta

## 🏗️ Architettura Proposta

```
[Frontend] → [Backend/Function] → [OpenRouter AI] ↗
                                                  ↘ [Tavily API]
```

### Flusso di Funzionamento

1. **Utente invia messaggio** → Frontend
2. **Pre-processing** → Backend analizza se serve ricerca web
3. **Ricerca Web (opzionale)** → Tavily API se necessario
4. **Elaborazione AI** → OpenRouter con contesto (+ risultati web se presenti)
5. **Risposta** → Frontend

## 🔧 Implementazione Tecnica

### 1. Modifica del Backend

#### A. Server Express (`server/server.js`)
- Aggiungere nuovo endpoint `/api/chat-with-search`
- Integrare logica di decisione per la ricerca web
- Gestire chiamate a Tavily API

#### B. Netlify Functions (`netlify/functions/chat.js`)
- Duplicare funzionalità per ambiente serverless
- Implementare stessa logica di ricerca web

### 2. Configurazione

#### A. Variabili d'ambiente
```env
OPENROUTER_API_KEY=your-openrouter-key
TAVILY_API_KEY=your-tavily-key
```

#### B. Configurazione sistema (`config/main-config.json`)
```json
{
  "modelId": "z-ai/glm-4-32b",
  "systemPrompt": "...",
  "webSearch": {
    "enabled": true,
    "maxResults": 5,
    "searchDepth": "basic",
    "triggers": ["tempo reale", "notizie", "eventi", "quando", "dove", "chi è"]
  }
}
```

### 3. Logica di Decisione

#### Trigger per Ricerca Web
- Keywords specifiche: "oggi", "adesso", "ultima notizia", "quando", "dove"
- Domande su eventi recenti
- Richieste di informazioni specifiche e locali
- Date e orari
- Prezzo di mercato/borsa

#### Logica AI
Il prompt di sistema includerà istruzioni per:
- Identificare quando serve ricerca web
- Rispondere con flag speciale: `[SEARCH_WEB:query]`
- Il backend intercetta questo flag e esegue la ricerca

### 4. Integrazione Tavily

#### Endpoint utilizzato
```javascript
POST https://api.tavily.com/search
Headers: {
  "Authorization": "Bearer tvly-YOUR_API_KEY",
  "Content-Type": "application/json"
}
Body: {
  "query": "search query",
  "search_depth": "basic",
  "include_answer": true,
  "max_results": 5
}
```

#### Formato risposta
```javascript
{
  "query": "query originale",
  "answer": "risposta AI generata",
  "results": [
    {
      "title": "Titolo",
      "url": "URL",
      "content": "Contenuto estratto",
      "score": 0.85
    }
  ]
}
```

## 📁 Struttura File

### Nuovi File da Creare

```
├── server/
│   ├── services/
│   │   ├── tavilyService.js      # Servizio per chiamate Tavily
│   │   └── searchDecision.js     # Logica decisionale ricerca
├── netlify/functions/
│   ├── chat-with-search.js       # Function con ricerca web
├── js/
│   ├── searchIntegration.js      # Client-side per nuove funzionalità
```

### File da Modificare

```
├── server/server.js              # Nuovo endpoint + logica
├── js/chat.js                    # Supporto nuovi endpoint
├── config/main-config.json       # Configurazione ricerca
```

## 📝 Implementazione Dettagliata

### 1. Servizio Tavily (`server/services/tavilyService.js`)

```javascript
class TavilyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.tavily.com';
  }

  async search(query, options = {}) {
    const response = await fetch(`${this.baseURL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        search_depth: options.depth || 'basic',
        include_answer: true,
        max_results: options.maxResults || 5,
        ...options
      })
    });
    
    return await response.json();
  }
}
```

### 2. Logica Decisionale (`server/services/searchDecision.js`)

```javascript
class SearchDecision {
  static shouldSearch(message, config) {
    const triggers = config.webSearch?.triggers || [];
    const lowerMessage = message.toLowerCase();
    
    return triggers.some(trigger => 
      lowerMessage.includes(trigger.toLowerCase())
    );
  }

  static extractSearchQuery(message) {
    // Estrae query ottimizzata per ricerca web
    return message.replace(/\b(dimmi|parlami|cosa|come)\b/gi, '').trim();
  }
}
```

### 3. Prompt di Sistema Migliorato

```
Sei un assistente AI intelligente. 

RICERCA WEB:
- Se l'utente chiede informazioni che potrebbero essere datate o richiedere dati in tempo reale, indica [SEARCH_WEB:query] all'inizio della risposta
- La query deve essere concisa e in inglese per migliori risultati
- Esempi di quando usare ricerca web: notizie, eventi attuali, prezzi, informazioni geografiche specifiche, dati temporali

RISPOSTE:
- Se hai informazioni da ricerca web, citale chiaramente
- Fornisci link utili usando il formato [BUTTON:Testo|URL]
- Mantieni risposte concise ma complete
```

## 🚀 Fasi di Implementazione

### Fase 1: Backend Core
1. ✅ Creare `TavilyService`
2. ✅ Implementare logica decisionale
3. ✅ Modificare endpoint Express
4. ✅ Test con API Tavily

### Fase 2: Frontend Integration
1. ✅ Aggiornare `chat.js` per nuovo endpoint
2. ✅ Gestire indicatori di ricerca web
3. ✅ UI feedback per ricerca in corso

### Fase 3: Netlify Functions
1. ✅ Duplicare logica in funzione serverless
2. ✅ Test in ambiente Netlify
3. ✅ Deploy e verifica

### Fase 4: Ottimizzazioni
1. ✅ Cache risultati ricerca
2. ✅ Rate limiting
3. ✅ Error handling avanzato
4. ✅ Monitoring e logs

## 🔒 Sicurezza e Best Practices

### Gestione API Keys
- API key Tavily solo sul backend
- Validazione richieste
- Rate limiting per prevenire abuso

### Error Handling
- Fallback su risposta AI normale se Tavily fallisce
- Timeout per richieste web (5 secondi max)
- Logging errori per monitoring

### Performance
- Cache risultati per query simili (TTL: 1 ora)
- Limite massimo 5 risultati per ricerca
- Ricerca asincrona per non bloccare AI

## 📊 Testing

### Test di Integrazione
1. **Test positivi**: Query che dovrebbero triggerare ricerca
2. **Test negativi**: Query che non dovrebbero triggerare ricerca
3. **Test edge cases**: API Tavily non disponibile
4. **Test performance**: Tempi di risposta con e senza ricerca

### Esempi di Test

```javascript
// Dovrebbe triggerare ricerca web
"Che tempo fa oggi a Milano?"
"Ultime notizie sulla guerra in Ucraina"
"Prezzo attuale del Bitcoin"

// Non dovrebbe triggerare ricerca web
"Come si fa la carbonara?"
"Spiegami la relatività di Einstein"
"Raccontami una barzelletta"
```

## 🎨 UI/UX Enhancements

### Indicatori Visivi
- 🔍 Icona durante ricerca web
- 🌐 Badge "Info aggiornata dal web" sui messaggi
- ⚡ Indicatore velocità ricerca

### Miglioramenti Futuri
- Toggle utente per abilitare/disabilitare ricerca web
- Cronologia delle ricerche
- Filtri per domini di ricerca
- Personalizzazione trigger keywords

## 📈 Metriche e Monitoring

### KPI da Monitorare
- Tasso di utilizzo ricerca web
- Tempo medio di risposta
- Tasso di successo API Tavily
- Soddisfazione utente (implicita dal tempo di sessione)

### Logging
```javascript
{
  timestamp: Date.now(),
  query: "user query",
  searchTriggered: true/false,
  searchQuery: "tavily query",
  responseTime: 1.2,
  apiStatus: "success/error"
}
```

## ✅ Deliverable

1. **Codice funzionante** con ricerca web integrata
2. **Documentazione** aggiornata
3. **Test suite** per validazione
4. **File di configurazione** con esempi
5. **Deploy guide** per entrambi gli ambienti

---

**Stima implementazione**: 2-3 giorni di lavoro
**Complessità**: Media
**Impatto**: Alto (significativo miglioramento funzionalità chatbot)