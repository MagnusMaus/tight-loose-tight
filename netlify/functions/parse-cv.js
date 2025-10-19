exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { fileData, fileName, fileType } = JSON.parse(event.body);
    
    // ========================================
    // ✨ NEW: INPUT VALIDATION (ADDED)
    // ========================================
    
    // 1. Check required fields
    if (!fileData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: fileData' })
      };
    }
    
    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: fileName' })
      };
    }
    
    if (!fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: fileType' })
      };
    }
    
    // 2. Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' 
        })
      };
    }
    
    // 3. Validate file size (base64 is ~33% larger than original file)
    const estimatedSizeInBytes = (fileData.length * 3) / 4;
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB limit
    
    if (estimatedSizeInBytes > maxSizeInBytes) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'File too large. Maximum file size is 10MB.' 
        })
      };
    }
    
    // 4. Validate filename (prevent path traversal attacks)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid filename' })
      };
    }
    
    // 5. Validate base64 format
    if (typeof fileData !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File data must be a base64 string' })
      };
    }
    
    // ========================================
    // EXISTING CODE BELOW - UNCHANGED
    // ========================================
    
    // Claude API Call mit PDF
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
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: fileType,
                data: fileData
              }
            },
            {
              type: 'text',
              text: `Bitte extrahiere die wichtigsten Informationen aus diesem Lebenslauf. Fokussiere dich auf:
- Berufliche Stationen (Positionen, Unternehmen, Zeiträume)
- Ausbildung und Qualifikationen
- Fähigkeiten und Kompetenzen
- Besondere Erfolge oder Projekte

Formatiere die Ausgabe strukturiert und prägnant.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const extractedText = data.content[0].text;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        text: extractedText,
        fileName: fileName
      })
    };
    
  } catch (error) {
    console.error('Error parsing CV:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Fehler beim Verarbeiten des Lebenslaufs',
        message: error.message 
      })
    };
  }
};
