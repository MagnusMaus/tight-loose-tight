// Job Summary Component with async loading
const JobSummary = ({ job }) => {
    const [summary, setSummary] = React.useState('Lade Zusammenfassung...');
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
        const loadSummary = async () => {
            try {
                const generatedSummary = await Helpers.generateJobSummary(job);
                setSummary(generatedSummary);
            } catch (error) {
                setSummary('Zusammenfassung nicht verfügbar.');
            } finally {
                setIsLoading(false);
            }
        };
        
        loadSummary();
    }, [job.id]);
    
    return React.createElement('p', {
        className: `saved-job-summary ${isLoading ? 'loading' : ''}`,
        style: isLoading ? { fontStyle: 'italic', color: '#9ca3af' } : {}
    }, summary);
};

// Saved Jobs Panel Component
const SavedJobsPanel = ({ savedJobs, showSavedJobs, onClose, onRemoveJob }) => {
    if (!showSavedJobs) return null;

    return React.createElement('div', {
        className: 'saved-jobs-panel'
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            className: 'saved-jobs-panel-header'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'saved-jobs-panel-title'
            }, 'Gespeicherte Jobs'),
            React.createElement('button', {
                key: 'close',
                className: 'saved-jobs-close-button',
                onClick: onClose
            }, '×')
        ]),
        
        // Content
        React.createElement('div', {
            key: 'content',
            className: 'saved-jobs-panel-content'
        }, [
            savedJobs.length === 0 ? 
                React.createElement('p', {
                    key: 'empty',
                    className: 'saved-jobs-empty'
                }, 'Noch keine Jobs gespeichert') :
                React.createElement('div', {
                    key: 'list',
                    className: 'saved-jobs-list'
                }, savedJobs
                    .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)) // Sort by fit score descending
                    .map((job) => 
                    React.createElement('div', {
                        key: job.id,
                        className: 'saved-job-item'
                    }, [
                        React.createElement('h4', {
                            key: 'title',
                            className: 'saved-job-title'
                        }, job.title),
                        React.createElement('div', {
                            key: 'meta-row',
                            className: 'saved-job-meta-row'
                        }, [
                            React.createElement('p', {
                                key: 'meta',
                                className: 'saved-job-meta'
                            }, `${job.company} · ${job.location}`),
                            job.fitScore && React.createElement('span', {
                                key: 'fit-score',
                                className: `saved-job-fit-score ${job.fitScore >= 85 ? 'excellent' : job.fitScore >= 75 ? 'good' : 'fair'}`,
                                title: `${job.fitScore}% Passung`
                            }, `${job.fitScore}% ✓`)
                        ].filter(Boolean)),
                        React.createElement(JobSummary, {
                            key: 'summary',
                            job: job
                        }),
                        React.createElement('div', {
                            key: 'actions',
                            className: 'saved-job-actions'
                        }, [
                            React.createElement('button', {
                                key: 'apply',
                                className: 'saved-job-apply',
                                onClick: () => window.open(job.applyUrl || job.url, '_blank')
                            }, [
                                React.createElement(Icons.CheckCircle, { key: 'icon' }),
                                'Bewerben'
                            ]),
                            React.createElement('button', {
                                key: 'remove',
                                className: 'saved-job-remove',
                                onClick: () => onRemoveJob(job.id)
                            }, [
                                React.createElement(Icons.Trash2, { key: 'icon' })
                            ])
                        ])
                    ])
                ))
        ])
    ]);
};

// Export for global use
window.SavedJobsPanel = SavedJobsPanel;