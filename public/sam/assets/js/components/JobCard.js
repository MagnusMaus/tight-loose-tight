// Job Card Component
const JobCard = ({ job, onAction }) => {
    const getFitScoreClass = (score) => {
        if (score >= 80) return 'fit-score-high';
        if (score >= 60) return 'fit-score-medium';
        return 'fit-score-low';
    };

    return React.createElement('div', { 
        className: 'job-card',
        key: job.id 
    }, [
        // Fit Score Badge
        React.createElement('div', {
            key: 'fit-score',
            className: `fit-score-badge ${getFitScoreClass(job.fitScore)}`
        }, `${job.fitScore}% Match`),

        // Job Title
        React.createElement('h3', {
            key: 'title',
            className: 'job-title'
        }, job.title),

        // Company, Location, Salary
        React.createElement('div', {
            key: 'meta',
            className: 'job-meta'
        }, [
            React.createElement('span', { key: 'company' }, `🏢 ${job.company}`),
            React.createElement('span', { key: 'location' }, `📍 ${job.location}`),
            job.salary && React.createElement('span', { key: 'salary' }, `💰 ${job.salary}`)
        ].filter(Boolean)),

        // Description
        React.createElement('p', {
            key: 'description',
            className: 'job-description'
        }, job.description),

        // Pros
        job.pros && job.pros.length > 0 && React.createElement('div', {
            key: 'pros',
            className: 'job-pros'
        }, [
            React.createElement('div', {
                key: 'pros-title',
                className: 'job-pros-title'
            }, '✅ Was passt:'),
            React.createElement('ul', {
                key: 'pros-list',
                className: 'job-pros-list'
            }, job.pros.map((pro, i) => 
                React.createElement('li', { key: i }, pro)
            ))
        ]),

        // Cons
        job.cons && job.cons.length > 0 && React.createElement('div', {
            key: 'cons',
            className: 'job-cons'
        }, [
            React.createElement('div', {
                key: 'cons-title',
                className: 'job-cons-title'
            }, '⚠️ Beachte:'),
            React.createElement('ul', {
                key: 'cons-list',
                className: 'job-cons-list'
            }, job.cons.map((con, i) => 
                React.createElement('li', { key: i }, con)
            ))
        ]),

        // Action Buttons
        React.createElement('div', {
            key: 'actions',
            className: 'job-actions'
        }, [
            React.createElement('button', {
                key: 'apply',
                className: 'job-action-button job-action-apply',
                onClick: () => onAction(job.id, 'apply')
            }, [
                React.createElement(Icons.CheckCircle, { key: 'icon' }),
                'Bewerben'
            ]),
            
            React.createElement('button', {
                key: 'save',
                className: 'job-action-button job-action-save',
                onClick: () => onAction(job.id, 'save')
            }, [
                React.createElement(Icons.BookmarkPlus, { key: 'icon' }),
                'Speichern & weiter'
            ]),
            
            React.createElement('button', {
                key: 'reject',
                className: 'job-action-button job-action-reject',
                onClick: () => onAction(job.id, 'reject')
            }, [
                React.createElement(Icons.Trash2, { key: 'icon' }),
                'Verwerfen'
            ])
        ])
    ].filter(Boolean));
};

// Export for global use
window.JobCard = JobCard;