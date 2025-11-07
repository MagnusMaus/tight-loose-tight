// API Service for handling all backend communications
const ApiService = {
    // Chat with Sam (Claude API)
    chatWithSam: async (messages, systemPrompt, options = {}) => {
        try {
            console.log('🌐 Calling Sam API for chat...');
            
            // Use extended timeout for job analysis or CV analysis
            let timeout = AppConstants.TIMEOUTS.API_TIMEOUT;
            if (options.isJobAnalysis) {
                timeout = AppConstants.TIMEOUTS.JOB_ANALYSIS_TIMEOUT;
            } else if (options.isCVAnalysis) {
                timeout = AppConstants.TIMEOUTS.CV_ANALYSIS_TIMEOUT;
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(AppConstants.API_ENDPOINTS.CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    system: systemPrompt
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ API Response NOT OK:', response.status, errorData);
                throw new Error(`API returned ${response.status}: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ API Response received successfully');
            return data;
            
        } catch (error) {
            console.error('❌ Error in chatWithSam:', error);
            
            // Enhanced error handling for specific cases
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout/1000} seconds. Please try again.`);
            } else if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
                throw new Error('Server timeout - please try again in a moment.');
            } else if (error.message.includes('Failed to execute \'json\'')) {
                throw new Error('Invalid server response - please refresh and try again.');
            }
            
            throw error;
        }
    },

    // Search jobs via Arbeitsagentur API
    searchJobs: async (query, location, radius = AppConstants.JOB_SEARCH.DEFAULT_RADIUS) => {
        try {
            console.log('🔍 Searching jobs:', { query, location, radius });
            
            const response = await fetch(AppConstants.API_ENDPOINTS.SEARCH_JOBS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    location: location,
                    radius: radius,
                    size: AppConstants.LIMITS.SEARCH_RESULTS_SIZE
                })
            });
            
            if (!response.ok) {
                console.error('❌ Job search API error:', response.status, response.statusText);
                throw new Error(`Job search API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Job search completed:', data.total || 0, 'jobs found');
            return data;
            
        } catch (error) {
            console.error('❌ Error in searchJobs:', error);
            throw error;
        }
    },

    // Parse CV file
    parseCV: async (fileData, fileName, fileType) => {
        try {
            console.log('📄 Parsing CV file:', fileName);
            
            const response = await fetch(AppConstants.API_ENDPOINTS.PARSE_CV, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileData: fileData,
                    fileName: fileName,
                    fileType: fileType
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ CV parsing error:', response.status, errorData);
                throw new Error(errorData.error || 'CV parsing failed');
            }
            
            const data = await response.json();
            console.log('✅ CV parsed successfully');
            return data;
            
        } catch (error) {
            console.error('❌ Error in parseCV:', error);
            throw error;
        }
    },

    // Generate job summary for saved jobs (separate from main flow)
    generateJobSummary: async (jobCard) => {
        console.log('📝 Generating summary for saved job:', jobCard.title);
        
        const summaryPrompt = `Erstelle eine informative 2-3 Satz Zusammenfassung für die Saved Jobs Liste:

Job: ${jobCard.title} bei ${jobCard.company}
Ort: ${jobCard.location || 'Nicht angegeben'}
Beschreibung: ${jobCard.description}
Vorteile: ${(jobCard.pros || []).join(', ')}

Anforderungen:
- 2-3 vollständige deutsche Sätze (maximal 300 Zeichen)
- Satz 1: Konkrete Kernaufgaben und Verantwortlichkeiten
- Satz 2: Spezifische Fit-Gründe (warum passt es genau?)
- Satz 3: Optional - besondere Chancen/Highlights
- Keine Wiederholung von Titel/Firma (stehen separat)
- Vermeide generische Phrasen wie "passt gut zu deinem Profil"
- Sei spezifisch und informativ
- Perfekte deutsche Grammatik

Format: [Konkreter Satz 1]. [Spezifischer Fit-Grund]. [Optional: Highlight].`;
        
        try {
            const data = await ApiService.chatWithSam(
                [{ role: 'user', content: summaryPrompt }],
                'Du bist ein Experte für präzise deutsche Textzusammenfassungen. Erstelle professionelle, grammatisch korrekte Zusammenfassungen für Job-Listen.',
                { timeout: 15000 } // Shorter timeout for summaries
            );
            
            const summary = data.content[0].text.trim();
            console.log('✅ Job summary generated successfully');
            return summary;
            
        } catch (error) {
            console.error('❌ Error generating job summary:', error);
            
            // Enhanced fallback based on job data
            let fallback = '';
            const title = jobCard.title.toLowerCase();
            const company = jobCard.company || '';
            const pros = jobCard.pros || [];
            
            // Create meaningful fallback based on available data
            if (title.includes('change') || title.includes('transformation')) {
                fallback = `Führung von Change-Prozessen und Transformationsprojekten.`;
            } else if (title.includes('operations') || title.includes('coo')) {
                fallback = `Operative Leitung und Optimierung von Geschäftsprozessen.`;
            } else if (title.includes('manager') || title.includes('lead')) {
                fallback = `Management-Rolle mit Team- und Prozessverantwortung.`;
            } else if (title.includes('consultant') || title.includes('berater')) {
                fallback = `Strategische Beratung und Projektbegleitung.`;
            } else {
                fallback = `Verantwortungsvolle Position mit strategischem Fokus.`;
            }
            
            // Add fit reason from pros if available
            if (pros.length > 0) {
                const shortPro = pros[0].length > 60 ? pros[0].substring(0, 60) + '...' : pros[0];
                fallback += ` ${shortPro}`;
            } else {
                fallback += ` Nutzt deine Expertise in Leadership und strategischer Entwicklung.`;
            }
            
            console.log('⚠️ Using enhanced fallback summary');
            return fallback;
        }
    }
};

// Export for global use
window.ApiService = ApiService;