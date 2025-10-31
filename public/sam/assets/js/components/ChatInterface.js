// Chat Interface Component
const ChatInterface = ({ 
    messages, 
    input, 
    isLoading, 
    isSearchingJobs, 
    isUploadingCV,
    jobCards,
    savedJobs,
    showSavedJobs,
    onInputChange, 
    onSend, 
    onFileUpload,
    onJobAction,
    onToggleSavedJobs,
    onCloseSavedJobs,
    onRemoveSavedJob,
    messagesEndRef,
    fileInputRef
}) => {
    return React.createElement('section', {
        className: 'chat-section'
    }, [
        // Chat Section Title
        React.createElement('h2', {
            key: 'chat-title',
            className: 'chat-section-title'
        }, 'Chatte mit Sam, um den Job zu finden, der genau zu dir passt:'),
        
        React.createElement('div', {
            key: 'container',
            className: 'chat-container'
        }, [
            // Chat Box
            React.createElement('div', {
                key: 'chat-box',
                className: 'chat-box'
            }, [
                // Saved Jobs Header
                savedJobs.length > 0 && React.createElement('div', {
                    key: 'saved-jobs-header',
                    className: 'saved-jobs-header'
                }, [
                    React.createElement('button', {
                        key: 'saved-jobs-btn',
                        className: 'saved-jobs-button',
                        onClick: onToggleSavedJobs
                    }, [
                        React.createElement(Icons.BookmarkPlus, { key: 'icon' }),
                        `Gespeicherte Jobs (${savedJobs.length})`
                    ])
                ]),

                // Messages Area
                React.createElement('div', {
                    key: 'messages-area',
                    className: 'messages-area'
                }, [
                    React.createElement('div', {
                        key: 'messages-container',
                        className: 'messages-container'
                    }, [
                        // Messages
                        ...messages.map((msg, idx) => 
                            React.createElement('div', {
                                key: idx,
                                className: `message ${msg.role}`
                            }, [
                                msg.role === 'assistant' && React.createElement('div', {
                                    key: 'avatar',
                                    className: 'message-avatar'
                                }),
                                React.createElement('div', {
                                    key: 'content',
                                    className: 'message-content'
                                }, msg.content)
                            ].filter(Boolean))
                        ),

                        // Loading Indicator
                        (isLoading || isSearchingJobs || isUploadingCV) && React.createElement(LoadingIndicator, {
                            key: 'loading',
                            isSearchingJobs,
                            isUploadingCV
                        }),

                        // Job Cards
                        jobCards.length > 0 && React.createElement('div', {
                            key: 'job-cards',
                            className: 'job-cards-container'
                        }, jobCards.map((job) => 
                            React.createElement(JobCard, {
                                key: job.id,
                                job,
                                onAction: onJobAction
                            })
                        )),

                        React.createElement('div', {
                            key: 'messages-end',
                            ref: messagesEndRef
                        })
                    ])
                ]),

                // Input Area
                React.createElement('div', {
                    key: 'input-area',
                    className: 'input-area'
                }, [
                    React.createElement('div', {
                        key: 'input-container',
                        className: 'input-container'
                    }, [
                        // Hidden file input
                        React.createElement('input', {
                            key: 'file-input',
                            type: 'file',
                            ref: fileInputRef,
                            onChange: onFileUpload,
                            accept: '.txt,.pdf,.doc,.docx',
                            className: 'file-input'
                        }),
                        
                        // File upload button
                        React.createElement('button', {
                            key: 'file-upload-btn',
                            className: 'file-upload-button',
                            onClick: () => fileInputRef.current?.click(),
                            disabled: isLoading || isSearchingJobs || isUploadingCV,
                            title: 'Lebenslauf hochladen'
                        }, React.createElement(Icons.FileUp)),

                        // Message input
                        React.createElement('textarea', {
                            key: 'message-input',
                            className: 'message-input',
                            value: input,
                            onChange: (e) => onInputChange(e.target.value),
                            onKeyPress: (e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSend();
                                }
                            },
                            placeholder: 'Oder schreib deine Antwort...',
                            disabled: isLoading || isSearchingJobs || isUploadingCV,
                            rows: 1
                        }),

                        // Send button
                        React.createElement('button', {
                            key: 'send-btn',
                            className: `send-button ${input.trim() && !isLoading && !isSearchingJobs && !isUploadingCV ? 'active' : ''}`,
                            onClick: onSend,
                            disabled: !input.trim() || isLoading || isSearchingJobs || isUploadingCV
                        }, '↑')
                    ]),
                    
                    React.createElement('div', {
                        key: 'input-footer',
                        className: 'input-footer'
                    }, 'Powered by Claude · Jobs von Bundesagentur für Arbeit')
                ])
            ])
        ]),

        // Saved Jobs Panel
        React.createElement(SavedJobsPanel, {
            key: 'saved-jobs-panel',
            savedJobs,
            showSavedJobs,
            onClose: onCloseSavedJobs,
            onRemoveJob: onRemoveSavedJob
        })
    ]);
};

// Export for global use
window.ChatInterface = ChatInterface;