// Netlify Function für sichere Claude API Aufrufe
// WITH INPUT VALIDATION

exports.handler = async (event, context) => {
  // Set timeout to 25 seconds for complex CV analysis and job matching
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Nur POST-Anfragen erlauben
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Request-Body parsen
    const { messages, system } = JSON.parse(event.body);

    // ========================================
    // ✨ NEW: INPUT VALIDATION
    // ========================================

    // 1. Check if messages exists and is an array
    if (!messages) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: messages' })
      };
    }

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages must be an array' })
      };
    }

    // 2. Check if array is not empty
    if (messages.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages array cannot be empty' })
      };
    }

    // 3. Limit number of messages (prevent huge conversations)
    const MAX_MESSAGES = 100;
    if (messages.length > MAX_MESSAGES) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.` 
        })
      };
    }

    // 4. Validate each message in the array
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // Check if message has required fields
      if (!msg.role || !msg.content) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: `Message at index ${i} is missing 'role' or 'content'` 
          })
        };
      }

      // Check if role is valid
      if (msg.role !== 'user' && msg.role !== 'assistant') {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: `Invalid role '${msg.role}' at index ${i}. Must be 'user' or 'assistant'.` 
          })
        };
      }

      // Check if content is a string
      if (typeof msg.content !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: `Content at index ${i} must be a string` 
          })
        };
      }

      // Limit individual message length
      const MAX_MESSAGE_LENGTH = 50000; // ~50KB per message
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: `Message at index ${i} is too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` 
          })
        };
      }
    }

    // 5. Validate system prompt if provided
    if (system) {
      if (typeof system !== 'string') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'System prompt must be a string' })
        };
      }

      const MAX_SYSTEM_LENGTH = 20000; // Increased from 10000
      console.log(`📏 System prompt length: ${system.length} chars`);
      if (system.length > MAX_SYSTEM_LENGTH) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            error: `System prompt too long. Current: ${system.length}, Maximum: ${MAX_SYSTEM_LENGTH} characters.` 
          })
        };
      }
    }

    // ========================================
    // ALL VALIDATION PASSED! Now call Claude API
    // ========================================

    // Calculate total request size for debugging
    const totalContentLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const systemLength = system ? system.length : 0;
    
    console.log(`✅ Validation passed. Processing request:`, {
      messageCount: messages.length,
      totalContentLength,
      systemLength,
      totalRequestSize: totalContentLength + systemLength
    });

    // Retry logic for temporary errors
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES} after ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt)); // Exponential backoff
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: messages,
            system: system
          })
        });

        if (response.ok) {
          // Success!
          if (attempt > 1) {
            console.log(`✅ Request succeeded on attempt ${attempt}`);
          }
          
          const data = await response.json();
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
          };
        }
        
        // Handle error response
        const errorText = await response.text();
        console.error(`❌ Claude API error (attempt ${attempt}):`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const errorMessage = errorData.error?.message || errorData.message || errorText;
        
        // Check if it's a retryable error
        if (response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 529) {
          lastError = new Error(`Claude API returned ${response.status}: ${errorMessage}`);
          console.log(`⚠️ Retryable error (${response.status}), will retry...`);
          continue; // Retry
        } else {
          // Non-retryable error - throw immediately
          throw new Error(`Claude API returned ${response.status}: ${errorMessage}`);
        }
        
      } catch (fetchError) {
        lastError = fetchError;
        console.error(`❌ Fetch error (attempt ${attempt}):`, fetchError.message);
        
        if (attempt === MAX_RETRIES) {
          break; // Exit retry loop
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('All retry attempts failed');

    // This code is now inside the retry loop above

  } catch (error) {
    console.error('❌ Function error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Always provide some error details for debugging
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message, // Always show error message
        timestamp: new Date().toISOString()
      })
    };
  }
};
