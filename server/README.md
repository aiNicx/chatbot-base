# ChatBot Backend Server

This is the backend server for the ChatBot Base application. It acts as an intermediary between the frontend and the OpenRouter AI API.

## Setup

1. Make sure you have Node.js installed (version 14 or higher recommended)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your OpenRouter API key in the `.env` file in the root directory:
   ```
   OPENROUTER_API_KEY=your-actual-api-key-here
   ```
4. Start the server:
   ```bash
   npm start
   ```
   or for development with auto-restart:
   ```bash
   npm run dev
   ```
   or directly with Node.js:
   ```bash
   node server.js
   ```

## API Endpoints

- `POST /api/chat` - Forward chat requests to OpenRouter API
- `GET /api/health` - Health check endpoint

## How it works

The server uses Express.js to handle HTTP requests. When a chat request is received, it:
1. Validates the request body
2. Reads the OpenRouter API key from environment variables
3. Forwards the request to the OpenRouter API
4. Returns the response to the frontend

This approach keeps the API key secure on the server side rather than exposing it in the frontend code.