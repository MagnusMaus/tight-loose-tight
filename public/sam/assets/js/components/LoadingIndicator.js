// Loading Indicator Component
const LoadingIndicator = ({ isSearchingJobs = false, isUploadingCV = false }) => {
    return React.createElement('div', { className: 'loading-indicator' }, [
        React.createElement('div', { 
            key: 'avatar',
            className: 'message-avatar'
        }),
        React.createElement('div', { 
            key: 'content',
            className: 'loading-content'
        }, [
            React.createElement('div', { 
                key: 'dot1',
                className: 'bounce-dot',
                style: { animationDelay: '0s' }
            }),
            React.createElement('div', { 
                key: 'dot2',
                className: 'bounce-dot',
                style: { animationDelay: '0.2s' }
            }),
            React.createElement('div', { 
                key: 'dot3',
                className: 'bounce-dot',
                style: { animationDelay: '0.4s' }
            }),
            React.createElement('span', { 
                key: 'text',
                className: 'loading-text'
            }, isUploadingCV ? 'Analysiere Lebenslauf...' : isSearchingJobs ? 'Durchsuche Jobbörse...' : 'Sam tippt...')
        ])
    ]);
};

// Export for global use
window.LoadingIndicator = LoadingIndicator;