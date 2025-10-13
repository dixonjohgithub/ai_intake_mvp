# AI Intake Assistant - Dual Mode Configuration

## Overview
The AI Intake Assistant now supports two operational modes controlled by a single environment variable:
- **Static Mode**: Uses predefined questions in a fixed sequence
- **AI-Powered Mode**: Uses OpenAI GPT-5 for dynamic, context-aware questions

## Configuration

### Setting the Mode
Edit the `.env` file and set:

```bash
# For AI-Powered Mode (Dynamic Questions)
NEXT_PUBLIC_USE_OPENAI=true

# For Static Mode (Predefined Questions)
NEXT_PUBLIC_USE_OPENAI=false
```

### Required for AI Mode
When using AI-Powered mode, ensure you have:
```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-5
```

## Mode Comparison

| Feature | Static Mode | AI-Powered Mode |
|---------|------------|-----------------|
| **Questions** | 14 predefined questions | Dynamic, context-aware |
| **Flow** | Fixed sequence | Adaptive based on responses |
| **Follow-ups** | None | Intelligent follow-up questions |
| **Suggestions** | Keyword-based | AI-generated recommendations |
| **API Calls** | None | Uses OpenAI API |
| **Offline Support** | ✅ Yes | ❌ Requires internet |
| **Cost** | Free | OpenAI API costs |
| **Response Time** | Instant | ~1-2 second API latency |

## Features Available in Both Modes

### 1. Smart Suggestions
Type `"suggest"` for any technical question to get recommendations:
- AI capabilities needed
- Data sources required
- Integration points

### 2. Progress Tracking
- Visual step indicators
- Progress percentage
- Step transitions

### 3. Undo/Redo
- Undo last response
- Redo previous action
- Auto-save every 30 seconds

### 4. Conversation Management
- Session persistence
- Resume interrupted sessions
- Export conversation data

## How It Works

### Static Mode Flow
1. User answers predefined question #1
2. System moves to question #2
3. Continues through all 14 questions
4. Generates final analysis

### AI-Powered Mode Flow
1. User provides initial idea description
2. AI analyzes response and generates most relevant next question
3. Questions adapt based on:
   - Information gaps
   - Business context
   - Technical requirements
   - Risk factors
4. AI determines when sufficient information is gathered
5. Generates comprehensive analysis

## Switching Between Modes

1. Stop the development server (Ctrl+C)
2. Edit `.env` file
3. Change `NEXT_PUBLIC_USE_OPENAI` value
4. Restart server: `npm run dev`

## Visual Indicators

The UI displays the current mode:
- **Green indicator**: "AI-Powered Mode"
- **Orange indicator**: "Static Mode"

## API Endpoints

### AI Mode Endpoints (when enabled)
- `/api/openai/generate-question` - Dynamic question generation
- `/api/openai/analyze` - Final analysis generation

### Static Mode
- No API calls required
- All logic runs client-side

## Troubleshooting

### AI Mode Not Working?
1. Check `.env` has `NEXT_PUBLIC_USE_OPENAI=true`
2. Verify `OPENAI_API_KEY` is valid
3. Ensure server was restarted after changes
4. Check browser console for API errors

### Static Mode Issues?
1. Clear browser cache
2. Check localStorage for corrupted data
3. Verify all question templates are loaded

## Best Practices

### When to Use Static Mode
- Demonstrations without API access
- Consistent question flow needed
- Cost-sensitive deployments
- Offline environments

### When to Use AI Mode
- Production deployments
- Complex, nuanced ideas
- Need adaptive questioning
- Want personalized experience

## Development Notes

### Key Files
- `/src/components/ConversationalFlowDual.tsx` - Dual-mode component
- `/src/lib/conversation/questionConfig.ts` - Static questions
- `/src/lib/ai/questionGenerator.ts` - AI question generation
- `/src/pages/api/openai/*` - OpenAI API endpoints

### Testing Both Modes
```bash
# Test Static Mode
NEXT_PUBLIC_USE_OPENAI=false npm run dev

# Test AI Mode
NEXT_PUBLIC_USE_OPENAI=true npm run dev
```

## Security Considerations

- Never commit `.env` with real API keys
- Use environment variables in production
- Implement rate limiting for API calls
- Monitor OpenAI usage and costs

## Future Enhancements

- Hybrid mode (mix of static and dynamic)
- Fallback to static if API fails
- Custom question templates
- Multi-language support