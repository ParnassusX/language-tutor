# German Language Tutor - Voice Agent

A modern German language learning application with real-time voice interactions powered by Deepgram's Voice Agent technology.

## 🚀 Production Deployment Requirements

### Environment Variables Setup

Before deploying to Railway, you must configure the following environment variables in your Railway dashboard:

#### Required Environment Variables:

**1. DEEPGRAM_API_KEY (Required)**
- **Where to get it**: Create account at [Deepgram Console](https://console.deepgram.com/)
- **Railway variable name**: `DEEPGRAM_API_KEY`
- **Purpose**: Powers the voice transcription and speech generation for German conversations

#### Optional Environment Variables:

**2. DEEPL_API_KEY (Optional - Recommended)**
- **Where to get it**: Create account at [DeepL Pro API](https://www.deepl.com/pro-api)
- **Railway variable name**: `DEEPL_API_KEY`
- **Purpose**: Provides accurate German translations for learning exercises

## 🚀 Railway Deployment

### Automatic Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Railway
3. Railway will automatically build and deploy using the configuration in `railway.toml`

### Manual Environment Setup

1. Go to your Railway project dashboard
2. Navigate to **Variables** section
3. Add the required environment variables listed above
4. Redeploy your application

## 🔧 Configuration Details

### Files Modified for Production:
- `svelte.config.js` - Railway-compatible Node adapter with dynamic path handling
- `railway.toml` - NIXPACKS builder configuration with proper environment setup

### API Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET/POST | Health check and basic connectivity |
| `/api/voice-agent` | GET/POST | Voice agent configuration and session management |
| `/api/transcribe` | POST | Audio transcription with German conversation logic |
| `/api/speak` | POST | Text-to-speech generation for responses |
| `/api/test-deepl` | POST | Test DeepL translation functionality |
| `/api/conversational` | POST | Full conversational flow test |

## 🧪 Testing Your Deployment

### Health Check:
```bash
curl https://your-railway-app.railway.app/api/health
```

### Voice Agent Test:
```bash
curl https://your-railway-app.railway.app/api/voice-agent
```

### Diagnose Issues:
```bash
curl https://your-railway-app.railway.app/api/diagnostics
```

## 🎯 Troubleshooting

### App Shows "Nothing" or Blank Page
1. ✅ Check Railway build logs for compilation errors
2. ✅ Verify DEEPGRAM_API_KEY is set in Railway Variables (not in code)
3. ✅ Ensure all environment variables are named correctly
4. ✅ Check browser console for client-side JavaScript errors

### Voice Agent Doesn't Work
1. ✅ Verify DEEPGRAM_API_KEY is valid and active
2. ✅ Check browser microphone permissions are granted
3. ✅ Confirm WebSocket connections aren't blocked by firewall
4. ✅ Check browser console for WebRTC errors

### Build Failures
1. ✅ Ensure Node.js version compatibility (configured for Node 20)
2. ✅ Check Railway build logs for specific error messages
3. ✅ Verify all dependencies are properly listed in package.json

## 📊 Supported Features

- ✅ Real-time German voice conversations
- ✅ Intelligent speech recognition optimized for German
- ✅ Natural German speech synthesis
- ✅ Conversation context tracking
- ✅ Learning difficulty adjustment
- ✅ Basic translation support (with DeepL)
- ✅ Responsive web interface

## 🏗️ Development

### Local Development Setup:
```bash
npm install
npm run dev
```

### Environment Variables for Development:
Create `.env` file in project root:
```
DEEPGRAM_API_KEY=your_deepgram_key_here
DEEPL_API_KEY=your_deepl_key_here  # Optional
```

### Testing:
```bash
npm test
npm run test:ui
```

## 📝 Recent Production Fixes

- ✅ Fixed hardcoded Railway URLs in svelte.config.js
- ✅ Updated railway.toml with clear environment variable instructions
- ✅ Fixed Svelte component compilation issues
- ✅ Resolved API route syntax errors
- ✅ Added proper error handling for missing API keys
