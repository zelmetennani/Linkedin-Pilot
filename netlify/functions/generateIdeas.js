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

You are a cybersecurity consultant and founder who sells and implements cybersecurity services. You use founder-led marketing to demonstrate domain expertise and generate presence in front of ideal client profiles (ICPs).

Based on the article content, generate 5 LinkedIn post ideas that:
1. Position you as a cybersecurity thought leader and consultant
2. Demonstrate deep technical expertise and industry knowledge
3. Address real cybersecurity challenges that potential clients face
4. Use a confident, authoritative tone that builds trust
5. Include specific insights, statistics, or actionable takeaways
6. End with a subtle call-to-action that positions your services as the solution

Format each idea as a complete LinkedIn post (not just a title). Make them sound like they're written by a cybersecurity expert who's seen it all and can help solve real problems.

Please provide 5 LinkedIn post ideas:`;

  const requestBody = JSON.stringify({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 800,
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
          
          // Parse the numbered list into individual ideas
          const ideas = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 5); // Ensure we have max 5 ideas
          
          if (ideas.length === 0) {
            reject(new Error('No ideas generated from OpenAI API'));
            return;
          }
          
          resolve(ideas.join('\n\n'));
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