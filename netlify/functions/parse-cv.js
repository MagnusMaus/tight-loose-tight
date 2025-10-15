exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { fileData, fileName, fileType } = JSON.parse(event.body);
    
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
