class ChatBot {
    constructor() {
        this.messages = [];
        this.config = null;
        this.initializeElements();
        this.loadConfig();
        this.setupEventListeners();
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
        
        this.scrollToBottom();
    }
    
    parseAndRenderContent(container, content) {
        // Check if content contains button format: [BUTTON:Text|URL]
        const buttonRegex = /\[BUTTON:([^\]]*?)\|([^\]]*?)\]/g;
        let lastIndex = 0;
        let match;
        
        // Process content and extract buttons
        while ((match = buttonRegex.exec(content)) !== null) {
            // Add text before the button
            if (match.index > lastIndex) {
                const textNode = document.createTextNode(content.substring(lastIndex, match.index));
                container.appendChild(textNode);
            }
            
            // Create button element
            const buttonText = match[1];
            const buttonUrl = match[2];
            
            const button = document.createElement('button');
            button.className = 'chat-button';
            button.textContent = buttonText;
            button.onclick = () => window.open(buttonUrl, '_blank');
            
            container.appendChild(button);
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text after the last button
        if (lastIndex < content.length) {
            const textNode = document.createTextNode(content.substring(lastIndex));
            container.appendChild(textNode);
        }
        
        // If no buttons were found, just add the text content
        if (lastIndex === 0) {
            container.textContent = content;
        }
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
        }
        
        // Aggiungi il messaggio dell'utente
        messages.push({ role: 'user', content: message });

        const requestBody = {
            model: this.config.modelId,
            messages: messages
        };

        // Chiamata al nostro backend invece che direttamente a OpenRouter
        // Determina l'endpoint API in base all'ambiente
        const apiEndpoint = window.location.hostname.includes('netlify')
            ? '/.netlify/functions/chat'
            : '/api/chat';
        
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
        return data.choices[0].message.content.trim();
    }
}

// Inizializza il chatbot quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});