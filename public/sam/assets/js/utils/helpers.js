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

    // Generate structured job summary: What the job is + Why it fits
    generateJobSummary: (job) => {
        if (!job.description) return '';
        
        const description = job.description;
        const pros = job.pros || [];
        const title = job.title || '';
        
        // Step 1: Extract job requirements/activities
        let jobWhat = '';
        
        // Look for role descriptions with various patterns
        const rolePatterns = [
            // "Diese Position...", "Die Rolle..."
            /(?:Diese Position|Die Rolle|Diese Stelle)\s+(.+?)(?=\.|!|$|Dein|Mit deiner|Als erfahrener)/i,
            // "Als [Title] bei [Company]..."
            /Als\s+.+?\s+(?:bei|für)\s+.+?\s+(.+?)(?=\.|!|$|Dein|Mit deiner|Als erfahrener)/i,
            // "Du wirst...", "Sie werden..."
            /(?:Du wirst|Sie werden|Du übernimmst|Du leitest|Du managst)\s+(.+?)(?=\.|!|$|Dein|Mit deiner)/i,
            // Job involves/requires patterns
            /(?:umfasst|beinhaltet|erfordert)\s+(.+?)(?=\.|!|$|Dein|Mit deiner)/i
        ];
        
        for (const pattern of rolePatterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[1].trim().length > 25) {
                jobWhat = match[1].trim();
                // Clean up common artifacts
                jobWhat = jobWhat.replace(/^(die |das |den |eine |der )/i, '');
                break;
            }
        }
        
        // Fallback: Use job title + generic activity
        if (!jobWhat && title) {
            if (title.toLowerCase().includes('change')) {
                jobWhat = 'Leitung von Transformationsprojekten und Change-Prozessen';
            } else if (title.toLowerCase().includes('operations') || title.toLowerCase().includes('coo')) {
                jobWhat = 'Operative Führung und Optimierung von Geschäftsprozessen';
            } else if (title.toLowerCase().includes('consulting') || title.toLowerCase().includes('berater')) {
                jobWhat = 'Beratung und Begleitung von strategischen Projekten';
            } else if (title.toLowerCase().includes('manager') || title.toLowerCase().includes('leiter')) {
                jobWhat = 'Führung von Teams und strategische Entwicklung';
            } else {
                jobWhat = 'Verantwortung für strategische und operative Aufgaben';
            }
        }
        
        // Step 2: Extract personal fit reasons
        let whyFits = '';
        
        const fitPatterns = [
            // Direct fit statements
            /(?:Mit deiner|Deine|Dein)\s+(.+?)\s+(?:bringst du|machst du|passt|ermöglicht|qualifiziert)(.+?)(?=\.|!|$)/i,
            // Perfect/ideal statements
            /(?:perfekt|ideal|genau richtig|maßgeschneidert)\s+(.+?)(?=\.|!|$)/i,
            // "Als erfahrener..." statements
            /Als erfahrener\s+(.+?)\s+(?:bringst du|hast du|passt|ermöglicht)(.+?)(?=\.|!|$)/i
        ];
        
        for (const pattern of fitPatterns) {
            const match = description.match(pattern);
            if (match) {
                if (match.length > 2 && match[2]) {
                    // Two-part match
                    whyFits = `${match[1]} ${match[2]}`.trim();
                } else if (match[1]) {
                    // Single part match
                    whyFits = match[1].trim();
                }
                if (whyFits.length > 20) break;
            }
        }
        
        // Fallback: Use pros or create from fit score
        if (!whyFits && pros.length > 0) {
            // Combine first 2 pros
            whyFits = pros.slice(0, 2).join(', ');
        }
        
        if (!whyFits) {
            const skills = ['Change-Expertise', 'Agile-Erfahrung', 'Leadership-Skills', 'strategisches Denken'];
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            whyFits = `nutzt deine ${randomSkill} und internationale Ambition`;
        }
        
        // Step 3: Construct final summary (2-3 sentences)
        let summary = '';
        
        // Sentence 1: What the job is
        const sentence1 = `Diese Position umfasst ${jobWhat.toLowerCase()}.`;
        
        // Sentence 2: Why it fits
        let sentence2 = '';
        if (whyFits.length > 0) {
            if (whyFits.toLowerCase().includes('deine') || whyFits.toLowerCase().includes('dein')) {
                sentence2 = `${whyFits.charAt(0).toUpperCase()}${whyFits.slice(1)}.`;
            } else {
                sentence2 = `Das passt perfekt, da es ${whyFits.toLowerCase()}.`;
            }
        }
        
        // Sentence 3: Fit score context (if high score)
        let sentence3 = '';
        if (job.fitScore && job.fitScore >= 80) {
            sentence3 = ` Ausgezeichnete Passung mit ${job.fitScore}% Fit-Score.`;
        } else if (job.fitScore && job.fitScore >= 75) {
            sentence3 = ` Sehr gute Passung mit ${job.fitScore}% Fit-Score.`;
        }
        
        // Combine sentences
        summary = sentence1;
        if (sentence2) {
            summary += ` ${sentence2}`;
        }
        if (sentence3) {
            summary += sentence3;
        }
        
        // Clean up
        summary = summary.trim();
        summary = summary.replace(/\s+/g, ' '); // Remove extra spaces
        summary = summary.replace(/\.\.+/g, '.'); // Remove multiple dots
        
        // Length management - aim for 250-350 chars (2-3 sentences)
        if (summary.length > 350) {
            const lastPeriod = summary.lastIndexOf('.', 300);
            if (lastPeriod > 200) {
                summary = summary.substring(0, lastPeriod + 1);
            } else {
                const lastSpace = summary.lastIndexOf(' ', 300);
                summary = summary.substring(0, lastSpace) + '.';
            }
        }
        
        return summary;
    }
};

// Export for global use
window.Helpers = Helpers;