# Telegram Bot API Service

RESTful API service untuk mengintegrasikan Telegram Bot dan Deepseek AI. Service berjalan di port 3000 dengan JWT authentication.

## Setup

1. Salin file env:

```bash
cp .env.example .env
```

2. Isi konfigurasi di `.env`:
   - `PORT`: Port server (default: 3000)
   - `JWT_SECRET`: Secret key untuk JWT token (ganti dengan string yang aman)
   - `BOT_TOKEN`: Token dari BotFather
   - `MONITORING_CHAT_ID`: Chat ID untuk mengirim pesan
   - `DEEPSEEK_API_KEY`: API key dari Deepseek
   - `LOG_LEVEL`: Level logging (error, warn, info, debug)

3. Install dependencies:

```bash
npm install
```

## Running the Server

### Development Mode

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Production Mode

```bash
npm start
```

## API Documentation

### Authentication

Semua endpoint (kecuali `/health` dan `/auth/login`) memerlukan JWT token di header:

```
Authorization: Bearer <TOKEN>
```

### Mendapatkan Token (Login)

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

> **Note:** Default credentials adalah `admin:admin`. Untuk production, ubah ini di code atau gunakan database.

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Service is running"
}
```

---

## Telegram API

### Send Message

**Endpoint:** `POST /api/telegram/send`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "chatId": "1289660893",
  "message": "Hello from API",
  "parseMode": null
}
```

**Parameters:**
- `chatId` (required): Chat ID untuk mengirim pesan
- `message` (required): Pesan yang akan dikirim
- `parseMode` (optional): Format pesan - `Markdown`, `MarkdownV2`, atau `null`

**Response:**
```json
{
  "success": true,
  "data": {
    "ok": true,
    "result": {
      "message_id": 12345,
      "chat": { "id": 1289660893 },
      "date": 1234567890,
      "text": "Hello from API"
    }
  }
}
```

### Get Updates

**Endpoint:** `GET /api/telegram/updates?offset=0`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `offset` (optional): Offset untuk pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "update_id": 123456789,
      "message": {
        "message_id": 1,
        "chat": { "id": 1289660893 },
        "date": 1234567890,
        "text": "Hello"
      }
    }
  ]
}
```

---

## Deepseek API

### Ask Question

**Endpoint:** `POST /api/deepseek/ask`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "question": "What is the meaning of life?",
  "systemPrompt": null
}
```

**Parameters:**
- `question` (required): Pertanyaan untuk AI
- `systemPrompt` (optional): Custom system prompt untuk AI

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is the meaning of life?",
    "answer": "The meaning of life is a philosophical question that has been pondered for centuries..."
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Project Structure

```
src/
├── server.js                 # Entry point (Express server + JWT auth)
├── config/
│   └── index.js             # Configuration & env variables
├── logger/
│   └── index.js             # Logging utility
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── telegram.routes.js   # Telegram API endpoints
│   └── deepseek.routes.js   # Deepseek AI endpoints
├── services/
│   └── telegram.service.js  # Telegram service logic
└── repositories/
    └── telegram.repository.js # Telegram API calls
```

## Logging

Menggunakan custom logger dengan daily log rotation.

**Log files:**
- `logs/combined-YYYY-MM-DD.log` - Semua log
- `logs/error-YYYY-MM-DD.log` - Error log saja

Set `LOG_LEVEL` di `.env` untuk mengatur level logging:
- `debug`: Informasi detail untuk debugging
- `info`: Informasi umum
- `warn`: Peringatan
- `error`: Error saja

## Example Usage

### cURL

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

#### Send Telegram Message
```bash
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "1289660893",
    "message": "Hello API",
    "parseMode": null
  }'
```

#### Ask Deepseek
```bash
curl -X POST http://localhost:3000/api/deepseek/ask \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is Node.js?"
  }'
```

### JavaScript/Axios

```javascript
const axios = require('axios');

// Login
const loginRes = await axios.post('http://localhost:3000/auth/login', {
  username: 'admin',
  password: 'admin'
});

const token = loginRes.data.token;

// Send Telegram message
const headers = { Authorization: `Bearer ${token}` };

await axios.post('http://localhost:3000/api/telegram/send', {
  chatId: '1289660893',
  message: 'Hello from API'
}, { headers });

// Ask Deepseek
const aiRes = await axios.post('http://localhost:3000/api/deepseek/ask', {
  question: 'What is Node.js?'
}, { headers });

console.log(aiRes.data.data.answer);
```

## Notes

- Token JWT berlaku selama 24 jam
- Default username/password: `admin:admin` (ubah di production!)
- Pastikan `JWT_SECRET` diganti dengan string yang aman
- Semua API response mengikuti format `{ success, data/message, error? }`


