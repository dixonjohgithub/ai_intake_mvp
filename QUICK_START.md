# AI Intake Assistant - Quick Start Guide

## Three Modes Available

The AI Intake Assistant supports three operational modes, controlled via environment variables:

### 1. **Ollama Mode (Recommended for Demos)**
- **Speed**: Fastest (~1-3 seconds response time)
- **Requirements**: Local Ollama installation with GPT-OSS:20b model
- **Network**: No internet required
- **Cost**: Free, unlimited usage
- **Quality**: Good for most use cases
- **Best for**: Demonstrations, development, testing

### 2. **OpenAI Mode**
- **Speed**: Moderate (~3-5 seconds response time)
- **Requirements**: OpenAI API key
- **Network**: Internet connection required
- **Cost**: Pay per API usage
- **Quality**: Highest quality responses (GPT-5)
- **Best for**: Production deployments, complex reasoning tasks

### 3. **Static Mode**
- **Speed**: Instant
- **Requirements**: None
- **Network**: Not required
- **Cost**: Free
- **Quality**: Predefined questions and responses
- **Best for**: Predictable demos, testing UI flow

## Quick Commands

### Start the Server

```bash
# Recommended for demos - Local Ollama
./server.sh start-ollama

# For production - OpenAI GPT-5
./server.sh start-openai

# For testing - Static mode
./server.sh start-static
```

### Switch Modes (Restart)

```bash
# Switch to Ollama
./server.sh restart-ollama

# Switch to OpenAI
./server.sh restart-openai

# Switch to Static
./server.sh restart-static
```

### Server Management

```bash
# Check status
./server.sh status

# Stop server
./server.sh stop
```

## First-Time Setup

### For Ollama Mode (Recommended)

1. Install Ollama:
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. Download the model:
   ```bash
   ollama pull gpt-oss:20b
   ```

3. Start Ollama service (if not already running):
   ```bash
   ollama serve
   ```

4. Start the application:
   ```bash
   ./server.sh start-ollama
   ```

### For OpenAI Mode

1. Add your API key to `.env`:
   ```env
   OPENAI_API_KEY=your-api-key-here
   ```

2. Start the application:
   ```bash
   ./server.sh start-openai
   ```

### For Static Mode

Just start the application:
```bash
./server.sh start-static
```

## Verify Installation

Run the test script to check all modes:
```bash
./test-modes.sh
```

## Access the Application

Once started, open your browser to:
```
http://localhost:3073
```

## Mode Indicators

The application displays the active mode in the UI:
- 🟢 **OpenAI GPT-5** - Cloud-based AI
- 🔵 **Local Ollama GPT-OSS** - Local AI model
- 🟠 **Static Mode** - Predefined questions

## Troubleshooting

### Ollama Issues
- Ensure Ollama is running: `ollama serve`
- Check model is installed: `ollama list`
- Verify API is accessible: `curl http://localhost:11434/api/tags`

### OpenAI Issues
- Check API key in `.env`
- Verify internet connection
- Check API quota/billing

### Port Conflicts
- Default port is 3073
- Check what's using it: `lsof -i :3073`
- Stop conflicting process or change port in scripts

## Performance Tips

### For Demos
1. Use **Ollama mode** for best performance
2. Pre-start Ollama 5 minutes before demo
3. Send a test message to warm up the model
4. Have Static mode as backup

### For Development
- Use Ollama for rapid iteration
- No API costs
- Fast response times
- Works offline

## Support

- Full documentation: See `OLLAMA_SETUP.md` for detailed Ollama setup
- Environment setup: See `DUAL_MODE_SETUP.md` for configuration details
- Main documentation: See `README.md` for complete project information