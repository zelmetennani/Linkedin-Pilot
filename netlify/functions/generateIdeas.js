const https = require('https');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);
    
    if (!url || !url.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    const ideas = await generateLinkedInIdeas(url);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: ideas })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function generateLinkedInIdeas(url) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  const prompt = `Read the content from this URL: ${url}

You are a cybersecurity consultant and founder who sells and implements cybersecurity services. You use founder-led marketing to demonstrate domain expertise and generate presence in front of your ideal client profiles (ICPs), such as CISOs, CTOs, and business leaders in regulated industries.

Based on the article, generate 3 LinkedIn post ideas. For each idea, provide:
1. A psychologically enticing LinkedIn-style hook (1-2 sentences) that creates curiosity, addresses a pain point, or makes a bold statement that cybersecurity professionals and decision makers can't ignore
2. 30-50 words of meaningful, useful content that references the article's core concepts or fact patterns, but does NOT link to or directly quote the news source
3. A prompt or description for an image that could accompany the post on LinkedIn (e.g., "A photo of a cybersecurity team in a SOC," "A diagram of a ransomware attack chain," etc.)

Format your response as a JSON array of 3 objects, each with keys: "hook", "content", and "image". Do not include any extra text or explanation, just the JSON array.`;

  const requestBody = JSON.stringify({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 900,
    temperature: 0.7
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`OpenAI API error: ${response.error.message}`));
            return;
          }
          
          const content = response.choices[0].message.content;
          let ideas;
          try {
            ideas = JSON.parse(content);
          } catch {
            // fallback: try to extract JSON array from the response
            const match = content.match(/\[.*\]/s);
            if (match) {
              ideas = JSON.parse(match[0]);
            } else {
              reject(new Error('Failed to parse OpenAI API response as JSON array'));
              return;
            }
          }
          if (!Array.isArray(ideas) || ideas.length !== 3) {
            reject(new Error('Invalid response format from OpenAI API'));
            return;
          }
          resolve(ideas);
        } catch (error) {
          reject(new Error('Failed to parse OpenAI API response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('OpenAI API request timeout'));
    });
    
    req.write(requestBody);
    req.end();
  });
} 