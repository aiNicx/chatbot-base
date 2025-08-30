class ChatBot {
    constructor() {
        this.messages = [];
        this.config = null;
        this.initializeElements();
        this.loadConfig();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
    }

    async loadConfig() {
        this.config = await Config.loadConfig();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.userInput.addEventListener('input', this.autoResizeTextarea.bind(this));
        
        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.scrollToBottom(), 100);
        });
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 150) + 'px';
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Parse and render buttons if present
        this.parseAndRenderContent(contentDiv, content);
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // Salva il messaggio nella cronologia per mantenere il contesto
        this.messages.push({
            role: isUser ? 'user' : 'assistant',
            content: content
        });
        
        this.scrollToBottom();
    }
    
    parseAndRenderContent(container, content) {
        // First, process custom button format: [BUTTON:Text|URL]
        const buttonRegex = /\[BUTTON:([^\]]*?)\|([^\]]*?)\]/g;
        let processedContent = content.replace(buttonRegex, (match, buttonText, buttonUrl) => {
            // Create a unique placeholder for each button
            const buttonId = `BUTTON_PLACEHOLDER_${Math.random().toString(36).substr(2, 9)}`;
            // Store button data for later processing
            if (!this.buttonData) this.buttonData = {};
            this.buttonData[buttonId] = { text: buttonText, url: buttonUrl };
            return buttonId;
        });

        // Parse markdown content
        if (typeof marked !== 'undefined') {
            // Configure marked options for security and formatting
            marked.setOptions({
                breaks: true, // Convert line breaks to <br>
                gfm: true,    // GitHub Flavored Markdown
                sanitize: false, // We control the input
                smartLists: true,
                smartypants: false
            });
            
            try {
                // Parse markdown to HTML
                const htmlContent = marked.parse(processedContent);
                container.innerHTML = htmlContent;
            } catch (error) {
                console.warn('Markdown parsing failed, falling back to plain text:', error);
                container.textContent = content;
                return;
            }
        } else {
            // Fallback: basic markdown parsing if marked.js is not available
            processedContent = this.basicMarkdownParse(processedContent);
            container.innerHTML = processedContent;
        }

        // Now replace button placeholders with actual button elements
        if (this.buttonData) {
            Object.keys(this.buttonData).forEach(buttonId => {
                // Find text nodes containing the placeholder using TreeWalker
                const walker = document.createTreeWalker(
                    container,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let textNode;
                while (textNode = walker.nextNode()) {
                    if (textNode.textContent.includes(buttonId)) {
                        const buttonData = this.buttonData[buttonId];
                        const button = document.createElement('button');
                        button.className = 'chat-button';
                        button.textContent = buttonData.text;
                        button.onclick = () => window.open(buttonData.url, '_blank');
                        
                        // Replace the placeholder text with the button
                        const parts = textNode.textContent.split(buttonId);
                        const parent = textNode.parentNode;
                        
                        if (parts[0]) {
                            parent.insertBefore(document.createTextNode(parts[0]), textNode);
                        }
                        parent.insertBefore(button, textNode);
                        if (parts[1]) {
                            parent.insertBefore(document.createTextNode(parts[1]), textNode);
                        }
                        parent.removeChild(textNode);
                        break;
                    }
                }
            });
            // Clean up button data
            this.buttonData = {};
        }
    }

    // Basic markdown parser fallback
    basicMarkdownParse(text) {
        return text
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Lists (basic)
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>')
            // Wrap consecutive <li> elements in <ul>
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '');
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="loading"></div>
            </div>
            <div class="message-time"></div>
        `;
        this.chatMessages.appendChild(loadingDiv);
        this.scrollToBottom();
        return loadingDiv;
    }

    hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showWelcomeMessage() {
        // Mostra il messaggio di benvenuto senza aggiungerlo alla cronologia
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti?';
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // NON aggiungere alla cronologia - questo è solo un messaggio di benvenuto
        this.scrollToBottom();
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Aggiungi messaggio utente
        this.addMessage(message, true);
        this.userInput.value = '';
        this.userInput.style.height = 'auto';

        // Mostra loading
        const loadingElement = this.showLoading();
        this.sendButton.disabled = true;

        try {
            // Chiamata API
            const response = await this.callAI(message);
            this.hideLoading(loadingElement);
            this.addMessage(response);
        } catch (error) {
            this.hideLoading(loadingElement);
            this.addMessage('Si è verificato un errore. Riprova più tardi.');
            console.error('Errore:', error);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    async callAI(message) {
        if (!this.config || !this.config.modelId) {
            return 'Configurazione mancante. Inserisci Model ID nel file config/main-config.json';
        }

        // Costruisci i messaggi con i system prompt
        const messages = [
            { role: 'system', content: this.config.primarySystemPrompt }
        ];
        
        // Aggiungi il system prompt secondario se presente
        if (this.config.secondarySystemPrompt) {
            messages.push({ role: 'system', content: this.config.secondarySystemPrompt });
            console.log('🤖 [Chat Debug] Secondary prompt inviato:', this.config.secondarySystemPrompt.length, 'caratteri');
        } else {
            console.warn('⚠️ [Chat Debug] NESSUN secondary prompt trovato!');
        }
        
        console.log('📨 [Chat Debug] Messaggi da inviare all\'AI:', messages.length, 'messaggi system + conversazione');
        
        // Aggiungi tutti i messaggi precedenti della conversazione per mantenere il contesto
        messages.push(...this.messages);
        
        // Aggiungi il messaggio corrente dell'utente
        messages.push({ role: 'user', content: message });

        const requestBody = {
            model: this.config.modelId,
            messages: messages,
            config: this.config // Passa la configurazione per la ricerca web
        };

        // Determina l'endpoint API in base all'ambiente
        // Usa il nuovo endpoint con ricerca web se disponibile
        const useWebSearch = this.config.webSearch && this.config.webSearch.enabled;
        const apiEndpoint = window.location.hostname.includes('netlify')
            ? (useWebSearch ? '/.netlify/functions/chat-with-search' : '/.netlify/functions/chat')
            : (useWebSearch ? '/api/chat-with-search' : '/api/chat');
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Errore del server: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        
        // Se la ricerca web è stata eseguita, mostra un indicatore
        if (data.searchMetadata && data.searchMetadata.searchPerformed) {
            console.log('🔍 Ricerca web eseguita:', data.searchMetadata);
            this.showWebSearchIndicator(data.searchMetadata);
        }
        
        return data.choices[0].message.content.trim();
    }

    showWebSearchIndicator(metadata) {
        // Mostra un piccolo indicatore che è stata utilizzata la ricerca web
        const indicator = document.createElement('div');
        indicator.className = 'web-search-indicator';
        indicator.innerHTML = `
            <span class="search-icon">🔍</span>
            <span class="search-text">Informazioni aggiornate dal web (${metadata.resultsCount} fonti)</span>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #e3f2fd;
            color: #1976d2;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 6px;
            animation: slideInRight 0.3s ease-out;
        `;

        // Aggiungi animazione CSS se non esiste
        if (!document.querySelector('#webSearchStyles')) {
            const style = document.createElement('style');
            style.id = 'webSearchStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .web-search-indicator .search-icon {
                    font-size: 1.1em;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(indicator);

        // Rimuovi l'indicatore dopo 4 secondi
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => {
                    indicator.remove();
                }, 300);
            }
        }, 4000);
    }
}

// Inizializza il chatbot quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});
