#!/bin/bash

# AI Intake Assistant - Server Management Script
# Usage: ./server.sh [start-ai|start-static|stop|restart-ai|restart-static|status]

PORT=3073

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if server is running
check_server() {
    if lsof -Pi :$PORT -t >/dev/null ; then
        return 0  # Server is running
    else
        return 1  # Server is not running
    fi
}

# Function to stop the server
stop_server() {
    if check_server; then
        echo -e "${YELLOW}Stopping server on port $PORT...${NC}"
        kill -9 $(lsof -t -i:$PORT) 2>/dev/null
        sleep 1
        if check_server; then
            echo -e "${RED}Failed to stop server${NC}"
            return 1
        else
            echo -e "${GREEN}Server stopped successfully${NC}"
            return 0
        fi
    else
        echo -e "${YELLOW}Server is not running on port $PORT${NC}"
        return 0
    fi
}

# Function to start server in OpenAI mode
start_openai() {
    if check_server; then
        echo -e "${RED}Server is already running on port $PORT${NC}"
        echo "Use './server.sh restart-openai' to restart in OpenAI mode"
        return 1
    fi
    echo -e "${GREEN}Starting server in OpenAI GPT-5 mode...${NC}"
    npm run dev:openai
}

# Function to start server in Ollama mode
start_ollama() {
    if check_server; then
        echo -e "${RED}Server is already running on port $PORT${NC}"
        echo "Use './server.sh restart-ollama' to restart in Ollama mode"
        return 1
    fi
    echo -e "${GREEN}Starting server in Local Ollama GPT-OSS mode...${NC}"
    npm run dev:ollama
}

# Function to start server in static mode
start_static() {
    if check_server; then
        echo -e "${RED}Server is already running on port $PORT${NC}"
        echo "Use './server.sh restart-static' to restart in static mode"
        return 1
    fi
    echo -e "${GREEN}Starting server in Static mode...${NC}"
    npm run dev:static
}

# Function to show status
show_status() {
    if check_server; then
        echo -e "${GREEN}✓ Server is running on port $PORT${NC}"
        echo ""
        echo "Server Details:"
        lsof -i :$PORT | grep LISTEN
        echo ""
        echo "URL: http://localhost:$PORT"

        # Try to detect mode by checking process
        if ps aux | grep -v grep | grep "NEXT_PUBLIC_USE_OPENAI=true" >/dev/null; then
            echo -e "Mode: ${GREEN}AI-Powered${NC}"
        elif ps aux | grep -v grep | grep "NEXT_PUBLIC_USE_OPENAI=false" >/dev/null; then
            echo -e "Mode: ${YELLOW}Static${NC}"
        else
            echo "Mode: Unknown (check .env file)"
        fi
    else
        echo -e "${RED}✗ Server is not running on port $PORT${NC}"
    fi
}

# Main script logic
case "$1" in
    start-openai)
        start_openai
        ;;
    start-ollama)
        start_ollama
        ;;
    start-static)
        start_static
        ;;
    stop)
        stop_server
        ;;
    restart-openai)
        stop_server
        sleep 1
        start_openai
        ;;
    restart-ollama)
        stop_server
        sleep 1
        start_ollama
        ;;
    restart-static)
        stop_server
        sleep 1
        start_static
        ;;
    status)
        show_status
        ;;
    *)
        echo "AI Intake Assistant - Server Management"
        echo "========================================"
        echo ""
        echo "Usage: ./server.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start-openai     - Start server with OpenAI GPT-5"
        echo "  start-ollama     - Start server with Local Ollama GPT-OSS"
        echo "  start-static     - Start server in Static mode"
        echo "  stop             - Stop the server"
        echo "  restart-openai   - Restart server with OpenAI"
        echo "  restart-ollama   - Restart server with Ollama"
        echo "  restart-static   - Restart server in Static mode"
        echo "  status           - Show server status"
        echo ""
        echo "Examples:"
        echo "  ./server.sh start-ollama    # Fast local mode"
        echo "  ./server.sh start-openai    # OpenAI GPT-5 mode"
        echo "  ./server.sh start-static    # No AI, predefined questions"
        echo "  ./server.sh status"
        echo ""
        show_status
        ;;
esac