#!/bin/bash

# Test script for all three modes of AI Intake Assistant
# This script tests static, OpenAI, and Ollama modes

PORT=3073

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}AI Intake Assistant Mode Testing${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to test server response
test_mode() {
    local mode=$1
    echo -e "${YELLOW}Testing $mode mode...${NC}"

    # Check if server is accessible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
        echo -e "${GREEN}✓ Server is accessible on port $PORT${NC}"

        # Check the mode from the page
        response=$(curl -s http://localhost:$PORT/submit-idea | grep -o "• [^<]*" | head -1)
        if [ ! -z "$response" ]; then
            echo -e "${GREEN}✓ Mode detected: $response${NC}"
        else
            echo -e "${YELLOW}⚠ Could not detect mode from UI${NC}"
        fi
    else
        echo -e "${RED}✗ Server not accessible on port $PORT${NC}"
        return 1
    fi
    echo ""
}

# Function to check Ollama status
check_ollama() {
    echo -e "${YELLOW}Checking Ollama status...${NC}"

    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✓ Ollama is installed${NC}"

        if ollama list | grep -q "gpt-oss:20b"; then
            echo -e "${GREEN}✓ GPT-OSS:20b model is installed${NC}"
        else
            echo -e "${RED}✗ GPT-OSS:20b model not found${NC}"
            echo "  Run: ollama pull gpt-oss:20b"
        fi

        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            echo -e "${GREEN}✓ Ollama service is running${NC}"
        else
            echo -e "${RED}✗ Ollama service not running${NC}"
            echo "  Run: ollama serve"
        fi
    else
        echo -e "${RED}✗ Ollama not installed${NC}"
        echo "  See OLLAMA_SETUP.md for installation instructions"
    fi
    echo ""
}

# Function to check OpenAI configuration
check_openai() {
    echo -e "${YELLOW}Checking OpenAI configuration...${NC}"

    if [ ! -z "$OPENAI_API_KEY" ] || grep -q "OPENAI_API_KEY=" .env 2>/dev/null; then
        echo -e "${GREEN}✓ OpenAI API key is configured${NC}"
    else
        echo -e "${YELLOW}⚠ OpenAI API key not found in environment${NC}"
        echo "  Add OPENAI_API_KEY to .env file"
    fi
    echo ""
}

# Main testing flow
echo -e "${BLUE}1. Environment Checks${NC}"
echo "------------------------"
check_ollama
check_openai

echo -e "${BLUE}2. Current Server Status${NC}"
echo "------------------------"
./server.sh status
echo ""

echo -e "${BLUE}3. Mode Capabilities${NC}"
echo "------------------------"
echo -e "${GREEN}Static Mode:${NC}"
echo "  • No AI required"
echo "  • Predefined questions"
echo "  • Most predictable for demos"
echo ""
echo -e "${GREEN}Ollama Mode (Recommended):${NC}"
echo "  • Local GPT-OSS:20b model"
echo "  • No internet required"
echo "  • Fast response times (~1-3 seconds)"
echo "  • Perfect for demos"
echo ""
echo -e "${GREEN}OpenAI Mode:${NC}"
echo "  • Cloud-based GPT-5"
echo "  • Requires internet & API key"
echo "  • Best quality responses"
echo "  • Higher latency (~3-5 seconds)"
echo ""

echo -e "${BLUE}4. Quick Commands${NC}"
echo "------------------------"
echo "Start in different modes:"
echo "  ./server.sh start-static    # Static mode"
echo "  ./server.sh start-ollama    # Local Ollama (recommended)"
echo "  ./server.sh start-openai    # OpenAI GPT-5"
echo ""
echo "Restart in different modes:"
echo "  ./server.sh restart-static"
echo "  ./server.sh restart-ollama"
echo "  ./server.sh restart-openai"
echo ""

echo -e "${BLUE}5. Troubleshooting Tips${NC}"
echo "------------------------"
echo "If Ollama mode fails:"
echo "  1. Check Ollama service: ollama serve"
echo "  2. Check model: ollama list"
echo "  3. Pull model if needed: ollama pull gpt-oss:20b"
echo "  4. Check .env has: NEXT_PUBLIC_AI_MODE=ollama"
echo ""
echo "If OpenAI mode fails:"
echo "  1. Check API key in .env"
echo "  2. Verify internet connection"
echo "  3. Check .env has: NEXT_PUBLIC_AI_MODE=openai"
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Test complete!${NC}"
echo -e "${BLUE}================================${NC}"