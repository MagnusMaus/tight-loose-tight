// Application Configuration
const AppConfig = {
    // Application metadata
    app: {
        name: 'TabiCoach',
        version: 'v2.0 Professional',
        description: 'AI-Powered Career Coach',
        author: 'tight-loose-tight.de'
    },
    
    // Environment settings
    environment: {
        development: window.location.hostname === 'localhost',
        production: window.location.hostname !== 'localhost'
    },
    
    // Feature flags
    features: {
        cvUpload: true,
        jobSearch: true,
        savedJobs: true,
        debugLogging: true // Set to false in production
    },
    
    // UI settings
    ui: {
        theme: 'default',
        animations: true,
        autoScroll: true,
        showLoadingIndicators: true
    },
    
    // Performance settings
    performance: {
        debounceDelay: 300,
        scrollDelay: 100,
        apiTimeout: 30000
    }
};

// Export for global use
window.AppConfig = AppConfig;

// Log configuration in development
if (AppConfig.features.debugLogging && AppConfig.environment.development) {
    console.log('🔧 App Configuration:', AppConfig);
}