# Sistema di Configurazione Modulare del Chatbot

## Panoramica

Il nuovo sistema di configurazione è stato ristrutturato per essere **modulare**, **manutenibile** e **scalabile**. Invece di avere prompt monolitici difficili da gestire, ora abbiamo una struttura organizzata che separa:

- **Comportamento generale** (riutilizzabile)
- **Formattazione** (standard)
- **Base di conoscenza** (strutturata) 
- **Contesto specifico** (personalizzabile)

## Struttura dei File

### `config/main-config.json`
Contiene la configurazione generale riutilizzabile:

```json
{
  "modelId": "meta-llama/llama-3.3-70b-instruct",
  "systemConfig": {
    "behavior": { /* Caratteristiche comportamentali */ },
    "formatting": { /* Regole di formattazione */ },
    "responseStructure": { /* Linee guida per le risposte */ }
  },
  "webSearch": { /* Configurazione ricerca web */ }
}
```

**Vantaggi:**
- ✅ Riutilizzabile per altri progetti
- ✅ Separazione delle responsabilità
- ✅ Facile da aggiornare

### `config/specific-config.json`
Contiene informazioni specifiche del business strutturate:

```json
{
  "businessContext": { /* Identità e specializzazione */ },
  "knowledgeBase": {
    "location": { /* Info geografiche */ },
    "restaurant": { /* Dettagli ristorante */ },
    "packages": { /* Pacchetti esperienziali */ },
    "trekking": { /* Sentieri e percorsi */ },
    "history": { /* Storia del luogo */ },
    "contacts": { /* Contatti e prenotazioni */ }
  },
  "responseTemplates": { /* Template per risposte comuni */ },
  "contextualRules": { /* Regole comportamentali specifiche */ }
}
```

**Vantaggi:**
- ✅ Informazioni categorizzate logicamente
- ✅ Facile da aggiornare singole sezioni
- ✅ Template riutilizzabili
- ✅ Struttura scalabile

## Come Funziona

### 1. Caricamento Modulare
Il sistema `Config.js` carica entrambi i file e combina intelligentemente:

```javascript
// Carica configurazioni
const mainConfig = await fetch('config/main-config.json');
const specificConfig = await fetch('config/specific-config.json');

// Combina in prompt strutturati
const combinedPrompt = this.buildSystemPrompt(mainConfig, specificConfig);
```

### 2. Generazione Dinamica dei Prompt
- **Prompt primario**: Comportamento + Formattazione + Struttura
- **Prompt secondario**: Contesto business + Base conoscenza + Template

### 3. Template e Placeholder
I template permettono risposte standardizzate per scenari comuni:

```json
"responseTemplates": {
  "booking": {
    "intro": "Per prenotare al ristorante marinadalbori:",
    "methods": ["**Telefono/WhatsApp**: +39 3478671652", "..."],
    "note": "Consigliamo di prenotare in anticipo..."
  }
}
```

## Vantaggi della Nuova Struttura

### 🎯 **Manutenibilità**
- Aggiornamenti mirati a singole sezioni
- Chiara separazione delle responsabilità
- Struttura logica facile da navigare

### 🔄 **Riutilizzabilità**
- Configurazione generale applicabile ad altri progetti
- Template riutilizzabili
- Componenti modulari

### 📈 **Scalabilità**
- Facile aggiunta di nuove sezioni
- Supporto per localizzazione
- Gestione di configurazioni multiple

### 🐛 **Debugging**
- Errori localizzati in sezioni specifiche
- Fallback robusti
- Configurazione raw accessibile per debug

### ⚡ **Efficienza**
- Caricamento ottimizzato
- Prompt generati dinamicamente
- Nessuna duplicazione di informazioni

## Come Aggiornare

### Aggiungere Nuove Informazioni
1. **Per info generali**: Modifica `main-config.json`
2. **Per info specifiche**: Aggiungi in `specific-config.json`
3. **Per nuovi template**: Aggiungi in `responseTemplates`

### Esempio: Aggiungere Nuovo Pacchetto
```json
"packages": {
  "nuovo_pacchetto": {
    "description": "Descrizione del nuovo pacchetto",
    "includes": [
      "Servizio 1",
      "Servizio 2", 
      "Servizio 3"
    ]
  }
}
```

### Esempio: Aggiungere Template Risposta
```json
"responseTemplates": {
  "nuovo_template": {
    "intro": "Introduzione standardizzata",
    "methods": ["Opzione 1", "Opzione 2"],
    "note": "Note aggiuntive"
  }
}
```

## Migrazione da Sistema Precedente

Il sistema è **completamente retrocompatibile**:
- Se `specific-config.json` non esiste, usa solo `main-config.json`
- Fallback automatico in caso di errori
- Transizione graduale possibile

## Debug e Monitoring

Il sistema espone configurazioni raw per debug:
```javascript
const config = await Config.loadConfig();
console.log(config.rawConfig); // Accesso alle configurazioni originali
```

## Esempi di Utilizzo

### Testare la Configurazione
```javascript
// In console del browser
const config = await Config.loadConfig();
console.log("Primary prompt:", config.primarySystemPrompt);
console.log("Secondary prompt:", config.secondarySystemPrompt);
```

### Verificare Template
```javascript
const specificConfig = config.rawConfig.specificConfig;
console.log("Templates disponibili:", Object.keys(specificConfig.responseTemplates));
```

## Best Practices

1. **Mantieni la struttura logica**: Ogni sezione ha uno scopo specifico
2. **Usa template per risposte comuni**: Evita duplicazioni
3. **Aggiorna gradualmente**: Testa sempre dopo le modifiche
4. **Documenta cambiamenti**: Mantieni questo file aggiornato
5. **Valida JSON**: Usa un validator prima di salvare

## Troubleshooting

### Problema: Configurazione non carica
- Verifica sintassi JSON
- Controlla percorsi file
- Guarda console browser per errori

### Problema: Prompt incompleto
- Verifica struttura `systemConfig` in main-config.json
- Controlla che tutte le sezioni richieste esistano

### Problema: Template non funziona
- Verifica struttura `responseTemplates` 
- Controlla che il template sia referenziato correttamente

---

*Questo sistema rappresenta un significativo miglioramento in termini di organizzazione, manutenibilità e scalabilità del chatbot.*