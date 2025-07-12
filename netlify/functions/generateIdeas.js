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
    const { blog } = JSON.parse(event.body);
    
    if (!blog || !blog.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Blog content is required' })
      };
    }

    const ideas = await generateLinkedInIdeas(blog);
    
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

async function generateLinkedInIdeas(blogContent) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  const prompt = `Generate 5 engaging LinkedIn post ideas from this blog content. Each idea should be concise, professional, and highlight key insights. Format as a numbered list.

Blog content:
${blogContent.substring(0, 3000)}

Please provide 5 LinkedIn post ideas:`;

  const requestBody = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 500,
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