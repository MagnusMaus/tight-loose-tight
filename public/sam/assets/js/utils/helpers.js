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

    // Generate query variants for job search
    generateQueryVariants: (query) => {
        const variants = [query];
        const words = query.split(' ').filter(w => w.length > 2);
        
        // Add German equivalent translations for international terms
        const germanEquivalents = {
            'COO': ['Betriebsleiter', 'Geschäftsführer', 'Prokurist', 'Operations Manager'],
            'Chief Operating Officer': ['Betriebsleiter', 'Geschäftsführer Operations', 'Leiter Operations'],
            'Head of Inhouse Consulting': ['Leiter Interne Beratung', 'Manager Consulting', 'Berater', 'Change Manager'],
            'Operations Director': ['Betriebsleiter', 'Operations Manager', 'Leiter Betrieb', 'Produktionsleiter'],
            'Change Manager': ['Change Manager', 'Transformation Manager', 'Organisationsentwickler'],
            'Business Development': ['Geschäftsentwicklung', 'Business Development', 'Vertriebsleiter'],
            'Consulting': ['Beratung', 'Unternehmensberatung', 'Berater'],
            'Director': ['Leiter', 'Direktor', 'Manager'],
            'Manager': ['Manager', 'Leiter', 'Führungskraft']
        };
        
        // Check for German equivalents
        Object.keys(germanEquivalents).forEach(key => {
            if (query.toLowerCase().includes(key.toLowerCase())) {
                variants.push(...germanEquivalents[key]);
            }
        });
        
        // Original word-based variants
        if (words.length >= 3) {
            variants.push(words.slice(0, 2).join(' '));
            variants.push(words[0] + ' ' + words[words.length - 1]);
            variants.push(words[0]);
            variants.push(words[words.length - 1]);
        } else if (words.length === 2) {
            variants.push(words[0] + ' Manager');
            variants.push(words[0]);
            variants.push(words[1]);
        } else if (words.length === 1) {
            variants.push(words[0] + ' Manager');
        }
        
        // Remove duplicates and keep order
        const unique = [...new Set(variants)];
        console.log('📊 Query variants:', unique);
        return unique;
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

    // Generate concise job summary for saved jobs list
    generateJobSummary: (job) => {
        if (!job.description) return '';
        
        const description = job.description;
        const pros = job.pros || [];
        
        // Strategy 1: Extract role definition
        let roleDescription = '';
        const rolePatterns = [
            /(?:Diese Position|Die Rolle|Als .+? bei|Diese Stelle|Der Job)\s+(.+?)[.!]/i,
            /(?:Du wirst|Sie werden|Du übernimmst)\s+(.+?)[.!]/i,
            /(?:verbindet|kombiniert|bietet)\s+(.+?)\s+(?:mit|und)/i
        ];
        
        for (const pattern of rolePatterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[1].length > 20 && match[1].length < 120) {
                roleDescription = match[1].trim();
                break;
            }
        }
        
        // Strategy 2: Extract key benefit/fit reason
        let benefitDescription = '';
        const benefitPatterns = [
            /(?:perfekt|ideal|genau richtig|maßgeschneidert)\s+(.{20,100}?)[.!]/i,
            /(?:Hier kannst du|Du kannst|Sie können)\s+(.{20,80}?)[.!]/i,
            /(?:nutzen|einsetzen|ausschöpfen)\s+(.{15,80}?)[.!]/i
        ];
        
        for (const pattern of benefitPatterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[1].length > 15) {
                benefitDescription = match[1].trim();
                break;
            }
        }
        
        // Strategy 3: Use pros as fallback
        if (!roleDescription && !benefitDescription && pros.length > 0) {
            benefitDescription = pros[0].length < 100 ? pros[0] : pros[0].substring(0, 80) + '...';
        }
        
        // Strategy 4: Create manual summary based on job title and fit score
        if (!roleDescription && !benefitDescription) {
            if (job.fitScore >= 85) {
                benefitDescription = `Ausgezeichnete Passung für dein Profil (${job.fitScore}% Fit)`;
            } else if (job.fitScore >= 75) {
                benefitDescription = `Sehr gute Passung für deine Ziele (${job.fitScore}% Fit)`;
            } else {
                benefitDescription = `Interessante Möglichkeit (${job.fitScore}% Fit)`;
            }
        }
        
        // Combine role and benefit into concise summary
        let summary = '';
        if (roleDescription && benefitDescription) {
            // Both available - pick shorter one or combine smartly
            if (roleDescription.length + benefitDescription.length < 140) {
                summary = `${roleDescription}. ${benefitDescription}.`;
            } else {
                summary = roleDescription.length < benefitDescription.length ? roleDescription : benefitDescription;
            }
        } else if (roleDescription) {
            summary = roleDescription;
        } else if (benefitDescription) {
            summary = benefitDescription;
        }
        
        // Clean up and ensure proper ending
        summary = summary.trim();
        if (summary && !summary.endsWith('.') && !summary.endsWith('!')  && !summary.endsWith('?')) {
            summary += '.';
        }
        
        // Final length check - aim for 2-3 lines max
        if (summary.length > 180) {
            const lastSpace = summary.lastIndexOf(' ', 177);
            summary = summary.substring(0, lastSpace) + '...';
        }
        
        return summary;
    }
};

// Export for global use
window.Helpers = Helpers;