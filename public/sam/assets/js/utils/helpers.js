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

    // Generate high-quality job summary using template approach
    generateJobSummary: (job) => {
        if (!job.title && !job.company) return '';
        
        const title = job.title || '';
        const company = job.company || '';
        const pros = job.pros || [];
        const fitScore = job.fitScore || 0;
        
        // Step 1: Classify job type and determine role description
        const classifyJobType = (title) => {
            const titleLower = title.toLowerCase();
            
            if (titleLower.includes('change') || titleLower.includes('transformation')) {
                return {
                    activity: 'Change-Management und Transformationsprojekte',
                    verb: 'leitest'
                };
            }
            if (titleLower.includes('operations') || titleLower.includes('coo') || titleLower.includes('betriebsleiter')) {
                return {
                    activity: 'operative Prozesse und Geschäftsoptimierung',
                    verb: 'verantwortest'
                };
            }
            if (titleLower.includes('consulting') || titleLower.includes('berater')) {
                return {
                    activity: 'strategische Beratung und Projektbegleitung',
                    verb: 'führst durch'
                };
            }
            if (titleLower.includes('manager') || titleLower.includes('lead')) {
                return {
                    activity: 'Teamführung und strategische Entwicklung',
                    verb: 'übernimmst'
                };
            }
            if (titleLower.includes('director') || titleLower.includes('head')) {
                return {
                    activity: 'strategische Bereichsleitung',
                    verb: 'verantwortest'
                };
            }
            if (titleLower.includes('senior') || titleLower.includes('lead')) {
                return {
                    activity: 'komplexe Fachaufgaben und Projektleitung',
                    verb: 'übernimmst'
                };
            }
            
            // Generic fallback
            return {
                activity: 'strategische und operative Aufgaben',
                verb: 'übernimmst'
            };
        };
        
        // Step 2: Extract fit reasons from pros (structured data)
        const getFitReason = (pros) => {
            if (!pros || pros.length === 0) {
                return 'deine vielseitige Erfahrung in Change-Management und Leadership optimal nutzt';
            }
            
            // Look for the most descriptive pro
            const meaningfulPros = pros.filter(pro => 
                pro.length > 10 && 
                pro.length < 120 &&
                !pro.toLowerCase().includes('fit') &&
                !pro.toLowerCase().includes('score')
            );
            
            if (meaningfulPros.length === 0) {
                return 'deine Expertise in Transformation und strategischer Führung ideal eingesetzt wird';
            }
            
            // Take the first meaningful pro and make it grammatically correct
            let reason = meaningfulPros[0].trim();
            
            // Clean up and make it fit grammatically
            reason = reason.replace(/^[\-\*\+]\s*/, ''); // Remove bullet points
            reason = reason.replace(/^(deine|dein|du|sie)\s+/i, ''); // Remove personal pronouns at start
            
            // Make first letter lowercase for proper grammar in sentence
            if (reason.length > 0) {
                reason = reason.charAt(0).toLowerCase() + reason.slice(1);
            }
            
            // Ensure it makes sense as "da es [reason]"
            if (!reason.includes('deine') && !reason.includes('dein')) {
                reason = `deine ${reason}`;
            }
            
            // Add proper ending if missing
            if (!reason.includes('nutzt') && !reason.includes('passt') && !reason.includes('ermöglicht')) {
                reason += ' optimal nutzt';
            }
            
            return reason;
        };
        
        // Step 3: Build summary using templates
        const jobType = classifyJobType(title);
        const fitReason = getFitReason(pros);
        
        // Template construction with proper German grammar
        let summary = '';
        
        // Sentence 1: Role and activity
        if (company) {
            summary = `Als ${title} bei ${company} ${jobType.verb} du ${jobType.activity}.`;
        } else {
            summary = `In dieser Position als ${title} ${jobType.verb} du ${jobType.activity}.`;
        }
        
        // Sentence 2: Fit reason
        summary += ` Das passt hervorragend, da es ${fitReason}.`;
        
        // Sentence 3: Fit score (if significant)
        if (fitScore >= 80) {
            summary += ` Ausgezeichnete Passung mit ${fitScore}% Fit-Score.`;
        } else if (fitScore >= 75) {
            summary += ` Sehr gute Passung mit ${fitScore}% Fit-Score.`;
        }
        
        // Final cleanup
        summary = summary.trim();
        summary = summary.replace(/\s+/g, ' '); // Remove extra spaces
        summary = summary.replace(/\.\s*\./g, '.'); // Remove double periods
        
        // Ensure proper capitalization
        summary = summary.charAt(0).toUpperCase() + summary.slice(1);
        
        // Length management - keep it readable (300-450 chars)
        if (summary.length > 450) {
            const sentences = summary.split('. ');
            if (sentences.length >= 2) {
                summary = sentences.slice(0, 2).join('. ');
                if (!summary.endsWith('.')) summary += '.';
            }
        }
        
        return summary;
    }
};

// Export for global use
window.Helpers = Helpers;