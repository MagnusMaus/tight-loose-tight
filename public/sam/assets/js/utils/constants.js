// Application Constants
const AppConstants = {
    API_ENDPOINTS: {
        CHAT: '/.netlify/functions/chat',
        SEARCH_JOBS: '/.netlify/functions/search-jobs-arbeitsagentur',
        PARSE_CV: '/.netlify/functions/parse-cv'
    },
    
    LIMITS: {
        MAX_MESSAGES: 100,
        MAX_MESSAGE_LENGTH: 50000,
        MAX_CV_SIZE: 10 * 1024 * 1024, // 10MB
        SEARCH_RESULTS_SIZE: 25
    },
    
    FILE_TYPES: {
        ALLOWED_CV_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
    },
    
    TIMEOUTS: {
        API_TIMEOUT: 30000, // 30 seconds (5s longer than Netlify function timeout)
        CV_ANALYSIS_TIMEOUT: 35000, // 35 seconds for complex CV analysis
        JOB_ANALYSIS_TIMEOUT: 60000 // 60 seconds for complex job analysis with many jobs
    },
    
    UI: {
        TYPING_DELAY: 100,
        SCROLL_BEHAVIOR: 'smooth',
        ANIMATION_DURATION: 200
    },
    
    JOB_SEARCH: {
        DEFAULT_RADIUS: 100,
        MAX_RADIUS: 200,
        DEFAULT_LOCATION: 'Hannover'
    }
};

// Export for global use
window.AppConstants = AppConstants;