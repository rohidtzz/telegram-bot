# Telegram Media Archiver

Simple personal Telegram bot service untuk mengarsipkan pesan dan media dari Telegram ke S3-compatible storage (AWS S3, Minio, DigitalOcean Spaces, dll).

**Fitur:**
- 🎯 Webhook-based - menerima update dari Telegram secara real-time
- 📷 Media storage - simpan foto, video, audio, dokumen ke S3
- 💬 Send messages - API sederhana untuk mengirim pesan ke Telegram
- 📝 Structured logging - logging dengan daily rotation
- 🔧 Simple architecture - tanpa authentication (personal use)

---

## Prerequisites

- Node.js 16+
- Telegram Bot Token (dari [@BotFather](https://t.me/BotFather))
- S3-compatible storage (AWS S3, Minio, DigitalOcean Spaces, dll)
- Public domain/URL untuk webhook (HTTPS recommended)

## Setup

### 1. Clone dan install dependencies

```bash
git clone <your-repo>
cd telegram-bot
npm install
```

### 2. Konfigurasi environment

Salin template environment:
```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi kamu:

```env
# Server
NODE_ENV=development
PORT=3000

# Telegram
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_CHAT_ID=your_chat_id

# Optional: Deepseek AI (remove if not using)
DEEPSEEK_API_KEY=your_deepseek_key

# Webhook
WEBHOOK_URL=https://your-domain.com/webhooks/telegram

# S3 Storage
# Untuk AWS S3:
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1

# Atau Minio (local):
# S3_ENDPOINT=http://localhost:9000
# S3_REGION=us-east-1

S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=telegram-media
S3_USE_SSL=true
S3_FORCE_PATH_STYLE=false
```

### 3. Register webhook di Telegram

```bash
npm run webhook:setup
```

Atau cek status webhook:
```bash
npm run webhook:status
```

---

## Running

### Development Mode

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Production Mode

```bash
npm start
```

---

## API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is running"
}
```

### Send Message to Telegram

**POST** `/api/telegram/send`

Mengirim pesan ke admin chat (ADMIN_CHAT_ID):

```bash
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from API!",
    "parseMode": "HTML"
  }'
```

**Parameters:**
- `message` (required) - Text pesan
- `parseMode` (optional) - "HTML" atau "Markdown"

**Response:**
```json
{
  "success": true,
  "data": {
    "ok": true,
    "result": {
      "message_id": 123,
      "chat": { "id": 1234567 },
      "text": "Hello from API!"
    }
  }
}
```

### Get Telegram Updates (Polling)

**GET** `/api/telegram/updates`

```bash
curl http://localhost:3000/api/telegram/updates?offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "update_id": 123456,
      "message": {
        "message_id": 1,
        "chat": { "id": 1234567 },
        "from": { "id": 789, "first_name": "John" },
        "text": "Hello bot"
      }
    }
  ]
}
```

### Webhook Endpoint (Auto-receive messages)

**POST** `/webhooks/telegram`

Telegram akan mengirim update ke endpoint ini secara otomatis.

**Supported message types:**
- Text messages
- Photos (auto-download dan simpan ke S3)
- Videos (auto-download dan simpan ke S3)
- Audio (auto-download dan simpan ke S3)
- Voice messages (auto-download dan simpan ke S3)
- Documents (auto-download dan simpan ke S3)

---

## Architecture

```
src/
├── server.js                 # Express app setup
├── config/
│   └── index.js             # Environment config
├── controllers/
│   ├── telegram.controller.js    # Telegram endpoints
│   ├── deepseek.controller.js    # Deepseek endpoints
│   └── webhook.controller.js     # Webhook handler
├── services/
│   ├── telegram.service.js       # Telegram business logic
│   ├── deepseek.service.js       # Deepseek business logic
│   └── webhook.service.js        # Webhook processing
├── repositories/
│   ├── telegram.repository.js    # Telegram API calls
│   ├── deepseek.repository.js    # Deepseek API calls
│   └── s3.repository.js          # S3 file operations
├── routes/
│   ├── telegram.routes.js        # /api/telegram routes
│   ├── deepseek.routes.js        # /api/deepseek routes
│   └── webhook.routes.js         # /webhooks routes
├── utils/
│   └── logger.js                 # Winston logger
└── scripts/
    └── setup-webhook.js          # Webhook management
```

---

## Webhook Setup Details

### Option 1: Public Server (Production)

```bash
# Update .env dengan domain kamu
WEBHOOK_URL=https://your-domain.com/webhooks/telegram

# Setup webhook
npm run webhook:setup
```

### Option 2: Local Development with ngrok

```bash
# Install ngrok
brew install ngrok

# Terminal 1: Start ngrok
ngrok http 3000
# Output: https://abc123.ngrok.io

# Terminal 2: Update .env
WEBHOOK_URL=https://abc123.ngrok.io/webhooks/telegram

# Setup webhook
npm run webhook:setup
```

### Webhook Management Scripts

```bash
# Setup webhook ke Telegram
npm run webhook:setup

# Check webhook status
npm run webhook:status

# Delete webhook (fallback ke polling)
npm run webhook:delete
```

---

## S3 Configuration Examples

### AWS S3

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=your_aws_access_key
S3_SECRET_KEY=your_aws_secret_key
S3_BUCKET=my-telegram-media
S3_USE_SSL=true
S3_FORCE_PATH_STYLE=false
```

### Minio (Local)

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=telegram-media
S3_USE_SSL=false
S3_FORCE_PATH_STYLE=true
```

### DigitalOcean Spaces

```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY=your_spaces_key
S3_SECRET_KEY=your_spaces_secret
S3_BUCKET=my-space-name
S3_USE_SSL=true
S3_FORCE_PATH_STYLE=false
```

---

## Logging

Logs disimpan di folder `/logs/`:
- `combined-DD-MM-YYYY.log` - All logs
- `error-DD-MM-YYYY.log` - Error logs only

Format: JSON dengan timestamp, level, dan message.

Set log level di `.env`:
```env
LOG_LEVEL=debug  # error, warn, info, debug
```

---

## Scripts

```bash
# Start server (production)
npm start

# Development mode (with auto-reload via nodemon)
npm run dev

# Webhook management
npm run webhook:setup    # Register webhook to Telegram
npm run webhook:status   # Check webhook status
npm run webhook:delete   # Delete webhook
```

---

## Troubleshooting

### Webhook tidak menerima update

1. Pastikan WEBHOOK_URL sudah set dengan benar (HTTPS public URL, bukan localhost)
2. Cek status webhook:
   ```bash
   npm run webhook:status
   ```
3. Cek logs untuk error:
   ```bash
   tail -f logs/combined-$(date +%d-%m-%Y).log
   ```

### Media tidak tersimpan ke S3

1. Cek konfigurasi S3 di `.env`
2. Pastikan bucket sudah ada
3. Cek logs untuk error: `tail -f logs/error-*.log`
4. Pastikan S3 credentials punya permission untuk write

### Pesan gak terkirim

1. Pastikan BOT_TOKEN benar
2. Pastikan ADMIN_CHAT_ID valid
3. Cek logs untuk error detail

---

## Example Usage

### Send Message dengan cURL

```bash
curl -X POST http://localhost:3000/api/telegram/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from command line!",
    "parseMode": "HTML"
  }'
```

### Send Message dengan JavaScript

```javascript
const axios = require('axios');

await axios.post('http://localhost:3000/api/telegram/send', {
  message: 'Hello from Node.js!',
  parseMode: 'HTML'
});
```

---

## Notes

- Service ini didesain untuk **personal use** (1 user)
- Tidak ada authentication - pastikan WEBHOOK_URL dan API endpoint aman
- Media disimpan dengan nama: `{timestamp}-{original_filename}`
- Log files di-rotate setiap hari otomatis
- Deepseek integration adalah optional
- Support S3-compatible storage: AWS S3, Minio, DigitalOcean Spaces, Wasabi, dll

---

## License

MIT

## Support

Issues dan suggestions bisa dibuka di repo ini.



