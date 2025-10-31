// API Service for handling all backend communications
const ApiService = {
    // Chat with Sam (Claude API)
    chatWithSam: async (messages, systemPrompt, options = {}) => {
        try {
            console.log('🌐 Calling Sam API for chat...');
            
            // Use extended timeout for CV analysis
            const timeout = options.isJobAnalysis ? AppConstants.TIMEOUTS.CV_ANALYSIS_TIMEOUT : AppConstants.TIMEOUTS.API_TIMEOUT;
            
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
        
        const summaryPrompt = `Erstelle eine präzise 2-Satz Zusammenfassung für die Saved Jobs Liste:

Job: ${jobCard.title} bei ${jobCard.company}
Ort: ${jobCard.location || 'Nicht angegeben'}
Beschreibung: ${jobCard.description}
Vorteile: ${(jobCard.pros || []).join(', ')}

Anforderungen:
- Genau 2 vollständige deutsche Sätze
- Satz 1: Kernaufgabe/Herausforderung der Position
- Satz 2: Warum es zum Profil passt  
- Keine Wiederholung von Titel/Firma (stehen separat)
- Perfekte deutsche Grammatik
- Abgeschlossene Gedanken
- Maximal 200 Zeichen total

Format: [Satz 1]. [Satz 2].`;
        
        try {
            const data = await this.chatWithSam(
                [{ role: 'user', content: summaryPrompt }],
                'Du bist ein Experte für präzise deutsche Textzusammenfassungen. Erstelle professionelle, grammatisch korrekte Zusammenfassungen für Job-Listen.',
                { timeout: 15000 } // Shorter timeout for summaries
            );
            
            const summary = data.content[0].text.trim();
            console.log('✅ Job summary generated successfully');
            return summary;
            
        } catch (error) {
            console.error('❌ Error generating job summary:', error);
            // Fallback to basic summary if API fails
            const fallback = `${jobCard.title.includes('Change') ? 'Change-Management' : jobCard.title.includes('Operations') ? 'Operations-Management' : 'Strategische'} Position mit hoher Verantwortung. Passt gut zu deinem Profil.`;
            console.log('⚠️ Using fallback summary');
            return fallback;
        }
    }
};

// Export for global use
window.ApiService = ApiService;