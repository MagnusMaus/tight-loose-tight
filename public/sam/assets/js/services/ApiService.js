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
    }
};

// Export for global use
window.ApiService = ApiService;