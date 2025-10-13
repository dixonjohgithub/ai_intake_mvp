# Ollama Local Model Setup

This guide explains how to set up and use the local Ollama GPT-OSS model with the AI Intake Assistant.

## Why Ollama?

Ollama provides:
- **Fast local inference** - No network latency
- **Privacy** - Data stays on your machine
- **No API costs** - Run unlimited queries
- **Demo-friendly** - Perfect for demonstrations

## Prerequisites

- macOS, Linux, or Windows
- At least 8GB RAM (16GB recommended for better performance)
- ~15GB disk space for the model

## Installation Steps

### 1. Install Ollama

#### macOS
```bash
# Download and install from the official website
curl -fsSL https://ollama.ai/install.sh | sh
```

Or download the installer from: https://ollama.com/download

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows
Download the installer from: https://ollama.com/download

### 2. Download the GPT-OSS Model

Once Ollama is installed, download the GPT-OSS:20b model:

```bash
ollama pull gpt-oss:20b
```

This will download approximately 12GB. The download may take 10-30 minutes depending on your internet speed.

### 3. Verify Installation

Test that Ollama is running:

```bash
ollama list
```

You should see `gpt-oss:20b` in the list.

### 4. Start Ollama Service

Ollama runs as a background service. To ensure it's running:

```bash
ollama serve
```

Leave this running in a terminal window, or it may already be running as a system service.

## Using with AI Intake Assistant

### Configuration

The application is already configured to support Ollama. The `.env` file includes:

```env
# AI Mode: "static" | "openai" | "ollama"
NEXT_PUBLIC_AI_MODE=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_API_KEY=ollama
```

### Starting the Server

Use the provided server management script:

```bash
# Start with Ollama (recommended for demos)
./server.sh start-ollama

# Or restart if already running
./server.sh restart-ollama
```

### Available Modes

1. **Ollama Mode** (Local, Fast)
   ```bash
   ./server.sh start-ollama
   ```
   - Uses local GPT-OSS model
   - No internet required
   - Fastest response times

2. **OpenAI Mode** (Cloud, Most Capable)
   ```bash
   ./server.sh start-openai
   ```
   - Uses OpenAI GPT-5
   - Requires API key
   - Best quality responses

3. **Static Mode** (No AI)
   ```bash
   ./server.sh start-static
   ```
   - Predefined questions
   - No AI required
   - Most predictable

## Performance Tips

### Optimize Ollama Performance

1. **Allocate More Memory**
   ```bash
   # Set before starting Ollama
   export OLLAMA_MAX_LOADED_MODELS=1
   export OLLAMA_NUM_PARALLEL=2
   ```

2. **Use GPU Acceleration** (if available)
   - Ollama automatically uses GPU when available
   - Check GPU usage: `ollama ps`

3. **Model Loading**
   - First request may be slower as model loads
   - Subsequent requests will be faster

### Troubleshooting

#### Ollama Not Responding

1. Check if Ollama is running:
   ```bash
   ps aux | grep ollama
   ```

2. Restart Ollama:
   ```bash
   killall ollama
   ollama serve
   ```

3. Check logs:
   ```bash
   journalctl -u ollama -f
   ```

#### Model Not Found

If you get "model not found" errors:

```bash
# List installed models
ollama list

# Re-download if needed
ollama pull gpt-oss:20b
```

#### Port Conflicts

If port 11434 is in use:

1. Check what's using it:
   ```bash
   lsof -i :11434
   ```

2. Update `.env` with different port:
   ```env
   OLLAMA_BASE_URL=http://localhost:11435/v1
   ```

## Alternative Models

You can also try other Ollama models:

```bash
# Smaller, faster models
ollama pull llama2:7b
ollama pull mistral

# Update .env
OLLAMA_MODEL=llama2:7b
```

## Monitoring

View Ollama status and loaded models:

```bash
# Show running models
ollama ps

# Show all available models
ollama list
```

## Demo Best Practices

For demonstrations:

1. **Pre-load the Model**
   - Start Ollama 5 minutes before demo
   - Send a test message to warm up

2. **Use Ollama Mode**
   - Faster responses than OpenAI
   - No network dependencies
   - Consistent performance

3. **Have Fallback Ready**
   - Keep Static mode as backup
   - Test switching between modes

## Support

For Ollama-specific issues:
- Documentation: https://github.com/ollama/ollama
- Discord: https://discord.gg/ollama

For AI Intake Assistant issues:
- Check the main README.md
- Review DUAL_MODE_SETUP.md