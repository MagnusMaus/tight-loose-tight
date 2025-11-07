// Utility Helper Functions
const Helpers = {
    // Generate greeting based on time of day
    getGreeting: () => {
        const hour = new Date().getHours();
        let timeOfDay;
        if (hour < 12) timeOfDay = 'Morgen';
        else if (hour < 18) timeOfDay = 'Mittag';
        else timeOfDay = 'Abend';

        return `Guten ${timeOfDay}, schön, dass du da bist. Mein Name ist Sam. Ich bin hier, um dich dabei zu unterstützen, deinen nächsten Karriereschritt zu finden.

Damit dieser Schritt genau zu dir passt, stelle ich dir gleich ein paar Fragen. Je offener und präziser du sie beantwortest, desto besser wird das Ergebnis. Keine Sorge! Deine Daten sind bei mir sicher. Sie sind von niemandem sonst einsehbar.

In welcher beruflichen Situation befindest du dich gerade?`;
    },

    // Generate unique ID
    generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),

    // Validate file type
    isValidFileType: (fileType) => {
        return AppConstants.FILE_TYPES.ALLOWED_CV_TYPES.includes(fileType);
    },

    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Scroll to element smoothly
    scrollToElement: (element) => {
        if (element) {
            element.scrollIntoView({ behavior: AppConstants.UI.SCROLL_BEHAVIOR });
        }
    },

    // Parse job card from text - UPDATED for multiple cards
    parseJobCard: (text) => {
        console.log('🔍 parseJobCard() called');
        console.log('   Input length:', text.length, 'chars');
        
        // Find [JOB_CARD: Start
        const startMatch = text.match(/\[JOB_CARD:\s*\{/);
        if (!startMatch) {
            console.log('   ❌ No [JOB_CARD:{...}] pattern found in text');
            return null;
        }
        
        const startIndex = startMatch.index + startMatch[0].length - 1; // Index of {
        
        // Find matching closing } through bracket counting
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = startIndex; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        
        if (endIndex === -1) {
            console.log('   ❌ No matching closing brace found');
            return null;
        }
        
        // Check if after } comes ]
        const afterBrace = text.substring(endIndex + 1).trimStart();
        if (!afterBrace.startsWith(']')) {
            console.log('   ❌ No closing ] found after }');
            return null;
        }
        
        const jsonString = text.substring(startIndex, endIndex + 1).trim();
        console.log('   ✅ [JOB_CARD:{...}] pattern found!');

        try {
            const jobData = JSON.parse(jsonString);
            console.log('   ✅ JSON parsed successfully!');
            
            // Remove the complete JOB_CARD from text
            const cardStart = startMatch.index;
            const cardEnd = endIndex + 1 + afterBrace.indexOf(']') + 1;
            const cleanText = (text.substring(0, cardStart) + text.substring(cardEnd)).trim();
            
            return { jobData, cleanText };
        } catch (e) {
            console.error('   ❌ Error parsing job card JSON:', e);
            return null;
        }
    },

    // Parse ALL job cards from text - NEW function for multi-card support
    parseAllJobCards: (text) => {
        console.log('🔍 parseAllJobCards() called');
        console.log('   Input length:', text.length, 'chars');
        
        const jobCards = [];
        let remainingText = text;
        let safetyCounter = 0;
        
        while (remainingText && safetyCounter < 10) { // Max 10 cards safety
            safetyCounter++;
            const result = Helpers.parseJobCard(remainingText);
            
            if (!result) {
                break; // No more cards found
            }
            
            jobCards.push(result.jobData);
            remainingText = result.cleanText;
            
            console.log(`   ✅ Parsed job card ${safetyCounter}: "${result.jobData.title || 'Unknown'}"`);
        }
        
        console.log(`   🏆 Total job cards found: ${jobCards.length}`);
        
        return {
            jobCards,
            cleanText: remainingText,
            count: jobCards.length
        };
    },

    // Generate optimized single-word search terms for job collection
    generateSingleWordSearchTerms: (userProfile) => {
        console.log('🔧 Generating single-word search terms for user profile');
        
        // Extract profession-specific core terms based on user input
        const coreTerms = [];
        const userText = (userProfile.messages || []).map(m => m.content).join(' ').toLowerCase();
        
        // Technical/Engineering profiles
        if (userText.includes('elektriker') || userText.includes('sps') || userText.includes('automatisierung')) {
            coreTerms.push('SPS', 'Automatisierung', 'Elektriker', 'Steuerung', 'Siemens', 'Technik', 'Elektrotechnik');
        }
        
        // IT/Software profiles  
        if (userText.includes('entwickler') || userText.includes('programmier') || userText.includes('software')) {
            coreTerms.push('Entwickler', 'Programmierer', 'Software', 'Java', 'Python', 'Frontend', 'Backend');
        }
        
        // Business/Management profiles
        if (userText.includes('manager') || userText.includes('leitung') || userText.includes('führung')) {
            coreTerms.push('Manager', 'Leitung', 'Führung', 'Team', 'Projekt');
        }
        
        // Operations/Lean profiles
        if (userText.includes('lean') || userText.includes('operations') || userText.includes('prozess')) {
            coreTerms.push('Lean', 'Operations', 'Prozess', 'Optimierung', 'Excellence');
        }
        
        // Fallback: Generic terms if no specific profile detected
        if (coreTerms.length === 0) {
            coreTerms.push('Manager', 'Techniker', 'Spezialist', 'Leiter');
        }
        
        console.log('📊 Generated search terms:', coreTerms);
        return coreTerms;
    },

    // Sequential job collection with single-word terms (10-25 jobs target)
    collectJobsSequentially: async (searchTerms, location, targetMin = 10, targetMax = 25) => {
        console.log(`🎯 Collecting jobs sequentially, target: ${targetMin}-${targetMax} jobs`);
        
        const allJobs = [];
        const usedJobUrls = new Set();
        
        for (const term of searchTerms) {
            if (allJobs.length >= targetMax) {
                console.log(`✅ Reached target max (${targetMax} jobs) - stopping collection`);
                break;
            }
            
            try {
                console.log(`🔍 Searching for: "${term}"`);
                const data = await ApiService.searchJobs(term, location, 50);
                
                if (data.jobs && data.jobs.length > 0) {
                    // Filter duplicates and add new jobs
                    const newJobs = data.jobs.filter(job => {
                        const jobKey = job.url || `${job.title}_${job.company}`;
                        if (usedJobUrls.has(jobKey)) return false;
                        usedJobUrls.add(jobKey);
                        return true;
                    });
                    
                    allJobs.push(...newJobs);
                    console.log(`   ✨ Added ${newJobs.length} new jobs (total: ${allJobs.length})`);
                    
                    // Stop if we have enough jobs
                    if (allJobs.length >= targetMin) {
                        console.log(`✅ Reached target minimum (${targetMin} jobs) - sufficient collection`);
                        break;
                    }
                } else {
                    console.log(`   📭 No jobs found for "${term}"`);
                }
                
            } catch (error) {
                console.error(`❌ Error searching for "${term}":`, error);
                continue; // Try next term
            }
        }
        
        console.log(`🏆 Job collection complete: ${allJobs.length} jobs collected`);
        return allJobs.slice(0, targetMax); // Limit to max
    },

    // Generate location tiers for job search
    generateLocationTiers: (userRegion = 'Hannover') => {
        const tiers = [
            // Round 1: User region local
            { location: userRegion, radius: 50, label: 'Lokal' },
            { location: userRegion, radius: 100, label: 'Regional' },
            
            // Round 2: Major cities for nationwide coverage
            { location: 'Berlin', radius: 100, label: 'Berlin Region' },
            { location: 'München', radius: 100, label: 'München Region' },
            { location: 'Hamburg', radius: 100, label: 'Hamburg Region' },
            
            // Round 3: Extended search
            { location: 'Frankfurt', radius: 150, label: 'Frankfurt erweitert' },
            { location: 'Köln', radius: 150, label: 'Köln erweitert' },
            
            // Round 4: Guaranteed fallback
            { location: 'Berlin', radius: 200, label: 'Berlin deutschlandweit' }
        ];
        
        console.log('📍 Location tiers:', tiers);
        return tiers;
    },

    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Format date
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Deep clone object
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    // Generate high-quality job summary using Claude API
    generateJobSummary: async (job) => {
        // Return cached summary if available
        if (job.generatedSummary) {
            return job.generatedSummary;
        }
        
        // Only generate for jobs with sufficient data
        if (!job.title || !job.description) {
            return 'Interessante Position für dein Profil.';
        }
        
        try {
            // Use the new API service to generate summary
            const summary = await ApiService.generateJobSummary(job);
            
            // Cache the result on the job object
            job.generatedSummary = summary;
            
            return summary;
            
        } catch (error) {
            console.error('❌ Failed to generate summary, using fallback:', error);
            
            // Fallback to simple template if API fails
            const fallback = `${job.title.includes('Change') ? 'Change-Management' : 
                              job.title.includes('Operations') ? 'Operations-Management' : 
                              'Strategische'} Position mit hoher Verantwortung. Passt gut zu deinem Profil.`;
            
            return fallback;
        }
    }
};

// Export for global use
window.Helpers = Helpers;