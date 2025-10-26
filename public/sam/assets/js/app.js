// Main Application Entry Point
(function() {
    'use strict';
    
    console.log('🚀 TabiCoach App Starting...');
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📋 DOM Content Loaded');
        
        // Check if React is available
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            console.error('❌ React or ReactDOM not found!');
            return;
        }
        
        // Check if all components are loaded
        const requiredComponents = [
            'Icons', 'AppConstants', 'Helpers', 'ApiService', 
            'JobSearchService', 'CVParserService', 'LoadingIndicator',
            'JobCard', 'SavedJobsPanel', 'ChatInterface', 'SamCareerCoach'
        ];
        
        const missingComponents = requiredComponents.filter(component => 
            typeof window[component] === 'undefined'
        );
        
        if (missingComponents.length > 0) {
            console.error('❌ Missing components:', missingComponents);
            return;
        }
        
        console.log('✅ All components loaded successfully');
        
        // Get the root element
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            console.error('❌ Root element not found!');
            return;
        }
        
        // Create React root and render the app
        try {
            console.log('🎨 Rendering SamCareerCoach...');
            const { createRoot } = ReactDOM;
            const root = createRoot(rootElement);
            root.render(React.createElement(SamCareerCoach));
            console.log('✅ App rendered successfully!');
        } catch (error) {
            console.error('❌ Error rendering app:', error);
        }
    });
    
    // Global error handler
    window.addEventListener('error', function(event) {
        console.error('❌ Global error:', event.error);
    });
    
    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.error('❌ Unhandled promise rejection:', event.reason);
    });
    
    console.log('🔧 App initialization script loaded');
})();