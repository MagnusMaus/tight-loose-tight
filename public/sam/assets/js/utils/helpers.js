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

    // Generate high-quality structured job summary: What the job is + Why it fits
    generateJobSummary: (job) => {
        if (!job.description) return '';
        
        // Helper function for proper German capitalization
        const capitalizeGerman = (text) => {
            if (!text) return '';
            // Capitalize first letter and after periods
            return text.replace(/(^|\. )([a-zäöü])/g, (match, prefix, letter) => {
                return prefix + letter.toUpperCase();
            });
        };
        
        // Helper function to clean and validate extracted text
        const cleanExtractedText = (text) => {
            if (!text) return '';
            
            // Remove leading/trailing whitespace
            text = text.trim();
            
            // Remove incomplete sentence artifacts
            text = text.replace(/^(und|oder|aber|sowie|,|;|:)\s*/i, '');
            text = text.replace(/\s*(und|oder|aber|sowie|,|;|:)$/i, '');
            
            // Remove incomplete article starts
            text = text.replace(/^(die|das|den|eine|einer|einem|der)\s+/i, '');
            
            // Fix common grammar issues
            text = text.replace(/\s+/g, ' ');
            text = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space before capitals
            
            return text.trim();
        };
        
        // Helper function to validate if text is a complete thought
        const isCompleteThought = (text, minLength = 20) => {
            if (!text || text.length < minLength) return false;
            
            // Check for incomplete patterns
            const incompletePatterns = [
                /^(und|oder|aber|sowie|,|;|:|&)\s*/i,
                /\s*(und|oder|aber|sowie|,|;|:|&)$/i,
                /^[a-z]/,  // Starts with lowercase (likely fragment)
                /[,;:]$/,  // Ends with comma/semicolon
                /\s+$/     // Ends with whitespace
            ];
            
            return !incompletePatterns.some(pattern => pattern.test(text));
        };
        
        const description = job.description;
        const pros = job.pros || [];
        const title = job.title || '';
        
        // Step 1: Extract job requirements/activities with robust patterns
        let jobWhat = '';
        
        // More precise role patterns that capture complete thoughts
        const rolePatterns = [
            // Complete sentences about position/role
            /(?:Diese Position|Die Rolle|Diese Stelle)\s+([^.!]+(?:und|sowie|,)[^.!]+)\./i,
            /(?:Diese Position|Die Rolle|Diese Stelle)\s+([^.!]{30,120})\./i,
            
            // Job responsibilities
            /(?:Du wirst|Sie werden|Du übernimmst|Du leitest)\s+([^.!]{25,100})\./i,
            
            // Job content/scope
            /(?:umfasst|beinhaltet|erfordert|beinhaltet die)\s+([^.!]{25,120})\./i,
            
            // Als [role] bei [company] patterns
            /Als\s+[^,]+\s+bei\s+[^,]+\s+([^.!]{25,100})\./i
        ];
        
        for (const pattern of rolePatterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                const candidate = cleanExtractedText(match[1]);
                if (isCompleteThought(candidate, 25)) {
                    jobWhat = candidate;
                    break;
                }
            }
        }
        
        // Enhanced fallback based on job title with proper German
        if (!jobWhat && title) {
            const titleLower = title.toLowerCase();
            if (titleLower.includes('change') || titleLower.includes('transformation')) {
                jobWhat = 'die Leitung von Transformationsprojekten und Change-Prozessen';
            } else if (titleLower.includes('operations') || titleLower.includes('coo') || titleLower.includes('betriebsleiter')) {
                jobWhat = 'die operative Führung und Optimierung von Geschäftsprozessen';
            } else if (titleLower.includes('consulting') || titleLower.includes('berater')) {
                jobWhat = 'die Beratung und Begleitung von strategischen Projekten';
            } else if (titleLower.includes('manager') || titleLower.includes('leiter') || titleLower.includes('lead')) {
                jobWhat = 'die Führung von Teams und strategische Entwicklung';
            } else if (titleLower.includes('director') || titleLower.includes('head')) {
                jobWhat = 'die strategische Leitung und Entwicklung des Bereichs';
            } else {
                jobWhat = 'vielfältige strategische und operative Aufgaben';
            }
        }
        
        // Step 2: Extract fit reasons with complete context
        let whyFits = '';
        
        // More sophisticated fit extraction
        const fitPatterns = [
            // Complete fit statements
            /(?:perfekt|ideal|genau richtig|maßgeschneidert)[^.!]*?(?:für|weil|da)\s+([^.!]{20,120})\./i,
            
            // Your background/experience statements
            /(?:Mit deiner|Deine|Dein)\s+([^.!]{20,100})\s+(?:passt|ermöglicht|qualifiziert|bringst)([^.!]*)\./i,
            
            // Direct experience connections
            /(?:Als erfahrener|Mit deiner Erfahrung)\s+([^.!]{20,120})\./i,
            
            // Capability utilization
            /(?:kannst du|können Sie)\s+([^.!]{20,100})\s+(?:einsetzen|nutzen|verwenden)([^.!]*)\./i
        ];
        
        for (const pattern of fitPatterns) {
            const match = description.match(pattern);
            if (match && match[1]) {
                let candidate = match[1].trim();
                
                // If there's a second part, combine intelligently
                if (match[2] && match[2].trim()) {
                    const part2 = match[2].trim();
                    candidate = `${candidate} ${part2}`;
                }
                
                candidate = cleanExtractedText(candidate);
                if (isCompleteThought(candidate, 20)) {
                    whyFits = candidate;
                    break;
                }
            }
        }
        
        // Smart fallback using pros
        if (!whyFits && pros.length > 0) {
            // Find the most relevant pro (longer = more detailed)
            const relevantPro = pros
                .filter(pro => pro.length > 15 && pro.length < 150)
                .sort((a, b) => b.length - a.length)[0];
            
            if (relevantPro) {
                whyFits = cleanExtractedText(relevantPro);
            }
        }
        
        // Final fallback with user-specific context
        if (!whyFits) {
            const experienceAreas = ['Change-Management', 'Agile Coaching', 'Transformationsprojekte', 'Leadership'];
            const randomArea = experienceAreas[Math.floor(Math.random() * experienceAreas.length)];
            whyFits = `deine Erfahrung in ${randomArea} optimal nutzt`;
        }
        
        // Step 3: Construct grammatically correct sentences
        
        // Sentence 1: What the job is (proper German structure)
        let sentence1 = '';
        if (jobWhat) {
            // Ensure proper article usage
            if (jobWhat.startsWith('die ') || jobWhat.startsWith('das ') || jobWhat.startsWith('den ')) {
                sentence1 = `Diese Position umfasst ${jobWhat}.`;
            } else {
                sentence1 = `Diese Position umfasst ${jobWhat}.`;
            }
        }
        
        // Sentence 2: Why it fits (proper German grammar)
        let sentence2 = '';
        if (whyFits) {
            // Check if whyFits already contains subject
            if (whyFits.toLowerCase().includes('deine ') || whyFits.toLowerCase().includes('dein ')) {
                sentence2 = `Das passt ideal, weil es ${whyFits}.`;
            } else if (whyFits.toLowerCase().includes('du ') || whyFits.toLowerCase().includes('sie ')) {
                sentence2 = `Das passt perfekt, da ${whyFits}.`;
            } else {
                sentence2 = `Das passt optimal zu dir, da es ${whyFits}.`;
            }
        }
        
        // Sentence 3: Fit score (if significant)
        let sentence3 = '';
        if (job.fitScore && job.fitScore >= 80) {
            sentence3 = `Ausgezeichnete Passung mit ${job.fitScore}% Fit-Score.`;
        } else if (job.fitScore && job.fitScore >= 75) {
            sentence3 = `Sehr gute Passung mit ${job.fitScore}% Fit-Score.`;
        }
        
        // Combine and finalize
        let summary = [sentence1, sentence2, sentence3]
            .filter(s => s.length > 0)
            .join(' ');
        
        // Final cleanup and validation
        summary = summary.trim();
        summary = summary.replace(/\s+/g, ' ');          // Multiple spaces
        summary = summary.replace(/\.\.+/g, '.');       // Multiple periods  
        summary = summary.replace(/\s+\./g, '.');        // Space before period
        summary = summary.replace(/([a-z])([A-Z])/g, '$1 $2'); // Space before capitals
        
        // Apply proper German capitalization
        summary = capitalizeGerman(summary);
        
        // Length management (250-400 chars for good readability)
        if (summary.length > 400) {
            const sentences = summary.split('. ');
            if (sentences.length >= 2) {
                summary = sentences.slice(0, 2).join('. ');
                if (!summary.endsWith('.')) summary += '.';
            } else {
                const lastSpace = summary.lastIndexOf(' ', 380);
                summary = summary.substring(0, lastSpace) + '.';
            }
        }
        
        return summary;
    }
};

// Export for global use
window.Helpers = Helpers;