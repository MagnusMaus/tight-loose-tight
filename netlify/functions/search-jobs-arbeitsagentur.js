const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { query, location, radius = 100, size = 25 } = JSON.parse(event.body);

    // ========================================
    // ✨ NEW: INPUT VALIDATION (ADDED)
    // ========================================

    // 1. Validate query (required)
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter is required' })
      };
    }

    if (typeof query !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query must be a string' })
      };
    }

    // Limit query length
    if (query.length > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query too long. Maximum 200 characters.' })
      };
    }

    // 2. Validate location (optional, but if provided must be valid)
    if (location !== undefined && location !== null && location !== '') {
      if (typeof location !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Location must be a string' })
        };
      }

      if (location.length > 100) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Location too long. Maximum 100 characters.' })
        };
      }
    }

    // 3. Validate radius
    if (typeof radius !== 'number' || radius < 0 || radius > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Radius must be a number between 0 and 200' })
      };
    }

    // 4. Validate size
    if (typeof size !== 'number' || size < 1 || size > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Size must be a number between 1 and 100' })
      };
    }

    // ========================================
    // EXISTING CODE BELOW - UNCHANGED
    // ========================================

    console.log('Arbeitsagentur API search:', { query, location, radius, size });

    // Build query parameters
    const params = new URLSearchParams({
      'was': query,                    // Job title/keywords
      'wo': location || '',            // Location
      'angebotsart': '1',              // 1 = Jobs, 2 = Ausbildung
      'umkreis': radius.toString(),    // Radius in km
      'size': size.toString(),         // Results per page
      'page': '1',                     // Page number
      'pav': 'false'                   // Private Arbeitsvermittlung
    });

    // Call Arbeitsagentur API
    const response = await fetch(
      `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/app/jobs?${params}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': 'jobboerse-jobsuche',
          'User-Agent': 'Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; iOS 15.1.0) Alamofire/5.4.4',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Arbeitsagentur API error:', response.status, response.statusText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Arbeitsagentur API error',
          status: response.status 
        })
      };
    }

    const data = await response.json();
    
    // Transform to our format
    const jobs = (data.stellenangebote || []).map(job => ({
      id: job.refnr,
      title: job.titel,
      company: job.arbeitgeber || 'Nicht angegeben',
      location: job.arbeitsort?.ort || location || 'Deutschland',
      description: job.beruf || job.titel,
      employmentType: job.arbeitszeit,
      salary: job.angebotstext?.includes('Gehalt') ? 'Siehe Beschreibung' : null,
      url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${job.refnr}`,
      raw: job // Keep full data for Sam to analyze
    }));

    console.log(`✅ Found ${jobs.length} jobs from Arbeitsagentur`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'OK',
        total: data.maxErgebnisse || jobs.length,
        jobs: jobs,
        source: 'arbeitsagentur'
      })
    };

  } catch (error) {
    console.error('Error in search-jobs-arbeitsagentur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
