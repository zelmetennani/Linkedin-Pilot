# LinkedIn Pilot

A web application that generates LinkedIn post ideas from blog content using OpenAI's GPT-3.5-turbo via Netlify Functions.

## Features

- Clean, modern UI with smooth animations
- Generates 5 engaging LinkedIn post ideas using OpenAI API
- Serverless architecture with Netlify Functions
- Graceful error handling and loading states
- CORS support for cross-origin requests

## Architecture

- **Frontend**: Single HTML page with vanilla JavaScript
- **Backend**: Netlify Function (`generateIdeas.js`)
- **AI**: OpenAI GPT-3.5-turbo via OpenAI API

## Setup

1. **Environment Variables**
   - Set `OPENAI_API_KEY` in your Netlify environment variables
   - For local development, create a `.env` file:
     ```bash
     cp env.example .env
     # Edit .env and add your actual OpenAI API key
     ```

2. **Local Development**
   ```bash
   npx netlify dev
   ```

3. **Deploy**
   - Connect your repository to Netlify
   - Deploy automatically on push

## API Endpoint

- **POST** `/.netlify/functions/generateIdeas`
- **Body**: `{ "blog": "Your blog content here..." }`
- **Response**: `{ "message": "1. First idea...\n\n2. Second idea...\n\n..." }`

## How It Works

1. User pastes blog content into the textarea
2. Frontend sends POST request to Netlify Function
3. Function sends content to OpenAI GPT-3.5-turbo
4. OpenAI generates 5 LinkedIn post ideas
5. Ideas are parsed and returned to frontend
6. Frontend displays ideas in beautiful list format

## File Structure

```
├── index.html                    # Main UI
├── netlify/
│   └── functions/
│       └── generateIdeas.js      # Serverless function
├── netlify.toml                  # Netlify configuration
├── env.example                   # Environment setup guide
└── README.md                     # This file
```

## Requirements

- OpenAI API key with access to GPT-3.5-turbo
- Netlify account for hosting and functions 