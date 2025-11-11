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

    // UNIFIED INTELLIGENT SEARCH STRATEGY ENGINE
    executeIntelligentJobSearch: async (userProfile, location, userRadius = 25) => {
        console.log('🚀 Starting Unified Intelligent Search Strategy');
        console.log('📋 User Profile Analysis:', { location, userRadius });
        
        const searchEngine = {
            results: [],
            usedJobUrls: new Set(),
            searchStats: {
                phase1: { queries: 0, jobs: 0, relevant: 0 },
                phase2: { queries: 0, jobs: 0, relevant: 0 },
                phase3: { queries: 0, jobs: 0, relevant: 0 },
                phase4: { queries: 0, jobs: 0, relevant: 0 }
            }
        };
        
        try {
            // PHASE 0: Claude's Specific Query (if different from profile-based)
            const claudeQuery = userProfile.query;
            if (claudeQuery && claudeQuery !== 'undefined') {
                console.log(`🎯 PHASE 0: Claude's Targeted Search for "${claudeQuery}"`);
                const targetedResult = await Helpers.executeTargetedSearch(claudeQuery, location, userRadius, searchEngine);
                if (targetedResult.success) {
                    console.log('🎉 Phase 0 SUCCESS - Claude\'s targeted search found sufficient jobs!');
                    return targetedResult;
                }
            }
            
            // Phase 1: High-Precision Multi-Word Search
            const phase1Result = await Helpers.executePhase1MultiWordSearch(userProfile, location, userRadius, searchEngine);
            if (phase1Result.success) {
                console.log('🎉 Phase 1 SUCCESS - High-precision search found sufficient jobs!');
                return phase1Result;
            }
            
            // Phase 2: Smart Single-Word with Term Prioritization  
            const phase2Result = await Helpers.executePhase2SmartSingleWord(userProfile, location, userRadius, searchEngine);
            if (phase2Result.success) {
                console.log('🎉 Phase 2 SUCCESS - Smart single-word search found sufficient jobs!');
                return phase2Result;
            }
            
            // Phase 3: Geographic Expansion
            const phase3Result = await Helpers.executePhase3GeographicExpansion(userProfile, location, userRadius, searchEngine);
            if (phase3Result.success) {
                console.log('🎉 Phase 3 SUCCESS - Geographic expansion found sufficient jobs!');
                return phase3Result;
            }
            
            // Phase 4: Fallback Diversification
            const phase4Result = await Helpers.executePhase4FallbackDiversification(userProfile, location, searchEngine);
            console.log('🏁 Phase 4 COMPLETE - Fallback search executed');
            return phase4Result;
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in Unified Search Strategy:', error);
            return { 
                success: false, 
                jobs: [], 
                error: error.message,
                searchStats: searchEngine.searchStats 
            };
        }
    },

    // PHASE 0: Claude's Targeted Search (respects Claude's specific query)
    executeTargetedSearch: async (claudeQuery, location, radius, searchEngine) => {
        console.log('🎯 PHASE 0: Claude\'s Targeted Search');
        console.log(`🔍 Searching specifically for: "${claudeQuery}"`);
        const startTime = Date.now();
        
        try {
            // Search directly for Claude's query and related variations
            const searchTerms = [
                claudeQuery, // Direct search
                `${claudeQuery} Manager`, // Manager variation
                `${claudeQuery} Director`, // Director variation
                `${claudeQuery} Leader`, // Leader variation
            ];
            
            const targetJobs = 15;
            let collectedJobs = 0;
            
            for (const term of searchTerms) {
                if (collectedJobs >= targetJobs) break;
                
                console.log(`🔍 Phase 0 Query: "${term}" in ${location} (${radius}km)`);
                
                try {
                    const data = await ApiService.searchJobs(term, location, radius);
                    const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 10, `P0-${term}`);
                    collectedJobs += validJobs;
                    
                } catch (error) {
                    console.error(`❌ Phase 0 Error for "${term}":`, error.message);
                    continue;
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Phase 0 completed in ${duration}ms`);
            console.log(`📊 Phase 0 Results: ${searchTerms.length} queries, ${collectedJobs} jobs`);
            
            const success = searchEngine.results.length >= 8; // Lower threshold for targeted search
            return {
                success,
                jobs: searchEngine.results,
                phase: 'phase0-targeted',
                searchStats: { phase0: { queries: searchTerms.length, jobs: collectedJobs } },
                duration
            };
            
        } catch (error) {
            console.error('❌ Phase 0 Error:', error);
            return { success: false, jobs: [], error: error.message, phase: 'phase0-targeted' };
        }
    },

    // PHASE 1: High-Precision Multi-Word Search
    executePhase1MultiWordSearch: async (userProfile, location, radius, searchEngine) => {
        console.log('🎯 PHASE 1: High-Precision Multi-Word Search');
        const startTime = Date.now();
        
        try {
            // Generate high-precision 2-word combinations
            const multiWordTerms = Helpers.generateMultiWordSearchTerms(userProfile);
            console.log(`📝 Generated ${multiWordTerms.length} multi-word terms:`, multiWordTerms);
            
            const targetJobs = 15; // Target for quick high-quality results
            let collectedJobs = 0;
            
            for (const term of multiWordTerms) {
                if (collectedJobs >= targetJobs) break;
                
                searchEngine.searchStats.phase1.queries++;
                console.log(`🔍 P1 Query ${searchEngine.searchStats.phase1.queries}: "${term}" (${radius}km)`);
                
                try {
                    const data = await ApiService.searchJobs(term, location, radius);
                    const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 5, `P1-${term}`);
                    collectedJobs += validJobs;
                    searchEngine.searchStats.phase1.jobs += validJobs;
                    
                } catch (error) {
                    console.error(`❌ P1 Error for "${term}":`, error.message);
                    continue;
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Phase 1 completed in ${duration}ms`);
            console.log(`📊 P1 Results: ${searchEngine.searchStats.phase1.queries} queries, ${searchEngine.searchStats.phase1.jobs} jobs`);
            
            // Success if we have good initial results  
            const success = searchEngine.results.length >= 10;
            return {
                success,
                jobs: searchEngine.results,
                phase: 'phase1',
                searchStats: searchEngine.searchStats,
                duration
            };
            
        } catch (error) {
            console.error('❌ Phase 1 Error:', error);
            return { success: false, jobs: [], error: error.message, phase: 'phase1' };
        }
    },

    // Generate smart multi-word search combinations
    generateMultiWordSearchTerms: (userProfile) => {
        console.log('🔧 Generating multi-word search terms');
        
        const userText = (userProfile.messages || []).map(m => m.content).join(' ').toLowerCase();
        const multiWordTerms = [];
        
        // Agile/Scrum profile
        if (userText.includes('agile') || userText.includes('scrum') || userText.includes('coach')) {
            multiWordTerms.push('Agile Coach', 'Scrum Master', 'Change Management', 'Transformation Manager');
        }
        
        // Lean/Operations profile  
        if (userText.includes('lean') || userText.includes('operations') || userText.includes('prozess')) {
            multiWordTerms.push('Lean Manager', 'Operations Excellence', 'Process Manager', 'Continuous Improvement');
        }
        
        // Technical/Engineering profile
        if (userText.includes('elektriker') || userText.includes('sps') || userText.includes('automatisierung')) {
            multiWordTerms.push('SPS Programmierer', 'Automatisierungstechniker', 'Elektro Techniker', 'Steuerungs Technik');
        }
        
        // IT/Software profile
        if (userText.includes('entwickler') || userText.includes('programmier') || userText.includes('software')) {
            multiWordTerms.push('Software Entwickler', 'Web Entwickler', 'Full Stack', 'Backend Entwickler');
        }
        
        // Business/Management profile  
        if (userText.includes('manager') || userText.includes('business') || userText.includes('strategie')) {
            multiWordTerms.push('Business Development', 'Strategic Manager', 'Team Leader', 'Project Manager');
        }
        
        // Fallback combinations if no specific profile
        if (multiWordTerms.length === 0) {
            multiWordTerms.push('Team Leader', 'Project Manager', 'Business Manager', 'Process Specialist');
        }
        
        console.log(`📊 Generated ${multiWordTerms.length} multi-word terms:`, multiWordTerms);
        return multiWordTerms.slice(0, 5); // Limit to top 5 for efficiency
    },

    // Validate and add jobs with deduplication
    validateAndAddJobs: async (data, searchEngine, maxPerQuery, source) => {
        if (!data.jobs || data.jobs.length === 0) {
            console.log(`   📭 No jobs from ${source}`);
            return 0;
        }
        
        console.log(`   📋 Processing ${data.jobs.length} jobs from ${source}`);
        let addedCount = 0;
        
        for (const job of data.jobs.slice(0, maxPerQuery)) {
            const jobKey = job.url || `${job.title}_${job.company}`;
            
            if (!searchEngine.usedJobUrls.has(jobKey)) {
                searchEngine.usedJobUrls.add(jobKey);
                searchEngine.results.push({
                    ...job,
                    searchSource: source,
                    addedAt: new Date().toISOString()
                });
                addedCount++;
            }
        }
        
        console.log(`   ✨ Added ${addedCount} new unique jobs from ${source}`);
        return addedCount;
    },

    // PHASE 2: Smart Single-Word with Term Prioritization
    executePhase2SmartSingleWord: async (userProfile, location, radius, searchEngine) => {
        console.log('🎯 PHASE 2: Smart Single-Word with Term Prioritization');
        const startTime = Date.now();
        
        try {
            // Generate prioritized single-word terms (avoid generics like "Manager")
            const prioritizedTerms = Helpers.generatePrioritizedSingleWordTerms(userProfile);
            console.log(`📝 Generated ${prioritizedTerms.length} prioritized terms:`, prioritizedTerms);
            
            const targetAdditionalJobs = 20; // Add to existing results
            let collectedJobs = 0;
            
            for (const termObj of prioritizedTerms) {
                if (collectedJobs >= targetAdditionalJobs) break;
                
                searchEngine.searchStats.phase2.queries++;
                console.log(`🔍 P2 Query ${searchEngine.searchStats.phase2.queries}: "${termObj.term}" [Priority: ${termObj.priority}/10] (${radius}km)`);
                
                try {
                    const data = await ApiService.searchJobs(termObj.term, location, radius);
                    const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 7, `P2-${termObj.term}`);
                    collectedJobs += validJobs;
                    searchEngine.searchStats.phase2.jobs += validJobs;
                    
                } catch (error) {
                    console.error(`❌ P2 Error for "${termObj.term}":`, error.message);
                    continue;
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Phase 2 completed in ${duration}ms`);
            console.log(`📊 P2 Results: ${searchEngine.searchStats.phase2.queries} queries, ${searchEngine.searchStats.phase2.jobs} jobs`);
            
            // Success if we now have sufficient total results
            const success = searchEngine.results.length >= 15;
            return {
                success,
                jobs: searchEngine.results,
                phase: 'phase2',
                searchStats: searchEngine.searchStats,
                duration
            };
            
        } catch (error) {
            console.error('❌ Phase 2 Error:', error);
            return { success: false, jobs: [], error: error.message, phase: 'phase2' };
        }
    },

    // Generate prioritized single-word terms with quality scoring
    generatePrioritizedSingleWordTerms: (userProfile) => {
        console.log('🔧 Generating prioritized single-word terms');
        
        const userText = (userProfile.messages || []).map(m => m.content).join(' ').toLowerCase();
        const terms = [];
        
        // Agile/Scrum profile - HIGH PRIORITY
        if (userText.includes('agile') || userText.includes('scrum') || userText.includes('coach')) {
            terms.push(
                { term: 'Agile', priority: 9 },
                { term: 'Scrum', priority: 9 },
                { term: 'Change', priority: 8 },
                { term: 'Coach', priority: 7 },
                { term: 'Transformation', priority: 6 }
            );
        }
        
        // Lean/Operations profile - HIGH PRIORITY  
        if (userText.includes('lean') || userText.includes('operations') || userText.includes('prozess')) {
            terms.push(
                { term: 'Lean', priority: 9 },
                { term: 'Operations', priority: 8 },
                { term: 'Prozess', priority: 7 },
                { term: 'Optimierung', priority: 6 },
                { term: 'Excellence', priority: 5 }
            );
        }
        
        // Technical/Engineering profile - HIGH PRIORITY
        if (userText.includes('elektriker') || userText.includes('sps') || userText.includes('automatisierung')) {
            terms.push(
                { term: 'SPS', priority: 10 },
                { term: 'Automatisierung', priority: 9 },
                { term: 'Elektriker', priority: 8 },
                { term: 'Steuerung', priority: 7 },
                { term: 'Technik', priority: 6 }
            );
        }
        
        // IT/Software profile - HIGH PRIORITY
        if (userText.includes('entwickler') || userText.includes('programmier') || userText.includes('software')) {
            terms.push(
                { term: 'Entwickler', priority: 9 },
                { term: 'Software', priority: 8 },
                { term: 'Frontend', priority: 7 },
                { term: 'Backend', priority: 7 },
                { term: 'Java', priority: 6 }
            );
        }
        
        // Business terms - LOWER PRIORITY (avoid generic "Manager")
        if (userText.includes('business') || userText.includes('strategie')) {
            terms.push(
                { term: 'Business', priority: 5 },
                { term: 'Strategie', priority: 5 },
                { term: 'Consultant', priority: 4 }
                // Notably EXCLUDING "Manager" (too generic)
            );
        }
        
        // Remove duplicates and sort by priority
        const uniqueTerms = terms.reduce((acc, current) => {
            const existing = acc.find(item => item.term === current.term);
            if (!existing || current.priority > existing.priority) {
                return acc.filter(item => item.term !== current.term).concat([current]);
            }
            return acc;
        }, []);
        
        const sortedTerms = uniqueTerms
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 6); // Top 6 terms only
        
        console.log(`📊 Prioritized terms:`, sortedTerms.map(t => `${t.term}(${t.priority})`));
        return sortedTerms;
    },

    // PHASE 3: Geographic Expansion
    executePhase3GeographicExpansion: async (userProfile, originalLocation, originalRadius, searchEngine) => {
        console.log('🎯 PHASE 3: Geographic Expansion');
        const startTime = Date.now();
        
        try {
            // Expand search radius progressively
            const expansionRadii = [
                originalRadius * 2, // Double original radius
                originalRadius * 3, // Triple original radius  
                200 // Nationwide fallback
            ];
            
            // Get best performing search terms from previous phases
            const bestTerms = Helpers.getBestPerformingTerms(userProfile, searchEngine);
            console.log(`📝 Re-running best terms with expanded radius:`, bestTerms);
            
            for (const expandedRadius of expansionRadii) {
                if (searchEngine.results.length >= 20) break; // Sufficient results
                
                console.log(`🌍 Expanding search radius to ${expandedRadius}km`);
                
                for (const term of bestTerms) {
                    if (searchEngine.results.length >= 25) break; // Max results
                    
                    searchEngine.searchStats.phase3.queries++;
                    console.log(`🔍 P3 Query ${searchEngine.searchStats.phase3.queries}: "${term}" (${expandedRadius}km)`);
                    
                    try {
                        const data = await ApiService.searchJobs(term, originalLocation, expandedRadius);
                        const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 5, `P3-${term}-${expandedRadius}km`);
                        searchEngine.searchStats.phase3.jobs += validJobs;
                        
                    } catch (error) {
                        console.error(`❌ P3 Error for "${term}" at ${expandedRadius}km:`, error.message);
                        continue;
                    }
                }
                
                // Check if we now have sufficient results
                if (searchEngine.results.length >= 15) {
                    console.log(`✅ Geographic expansion successful at ${expandedRadius}km radius`);
                    break;
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Phase 3 completed in ${duration}ms`);
            console.log(`📊 P3 Results: ${searchEngine.searchStats.phase3.queries} queries, ${searchEngine.searchStats.phase3.jobs} jobs`);
            
            const success = searchEngine.results.length >= 12; // Lower threshold for expanded search
            return {
                success,
                jobs: searchEngine.results,
                phase: 'phase3',
                searchStats: searchEngine.searchStats,
                duration
            };
            
        } catch (error) {
            console.error('❌ Phase 3 Error:', error);
            return { success: false, jobs: [], error: error.message, phase: 'phase3' };
        }
    },

    // Get best performing terms from previous search phases
    getBestPerformingTerms: (userProfile, searchEngine) => {
        // For now, return the most specific terms from user profile
        // In future, could track which terms actually returned relevant jobs
        const userText = (userProfile.messages || []).map(m => m.content).join(' ').toLowerCase();
        
        if (userText.includes('agile') || userText.includes('coach')) {
            return ['Agile Coach', 'Agile', 'Change'];
        } else if (userText.includes('lean') || userText.includes('operations')) {
            return ['Lean Manager', 'Lean', 'Operations'];
        } else if (userText.includes('elektriker') || userText.includes('sps')) {
            return ['SPS Programmierer', 'SPS', 'Automatisierung'];
        } else if (userText.includes('entwickler') || userText.includes('software')) {
            return ['Software Entwickler', 'Entwickler', 'Software'];
        } else {
            return ['Team Leader', 'Specialist', 'Coordinator'];
        }
    },

    // PHASE 4: Fallback Diversification
    executePhase4FallbackDiversification: async (userProfile, originalLocation, searchEngine) => {
        console.log('🎯 PHASE 4: Fallback Diversification (Last Resort)');
        const startTime = Date.now();
        
        try {
            // Try major job centers if original location didn't yield enough results
            const majorCities = ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln'];
            const fallbackTerms = Helpers.getFallbackTerms(userProfile);
            
            console.log(`📝 Fallback terms:`, fallbackTerms);
            console.log(`🏙️ Will try major cities if needed:`, majorCities);
            
            // First try broader terms in original location
            for (const term of fallbackTerms) {
                if (searchEngine.results.length >= 20) break;
                
                searchEngine.searchStats.phase4.queries++;
                console.log(`🔍 P4 Query ${searchEngine.searchStats.phase4.queries}: "${term}" in ${originalLocation} (100km)`);
                
                try {
                    const data = await ApiService.searchJobs(term, originalLocation, 100);
                    const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 3, `P4-${term}`);
                    searchEngine.searchStats.phase4.jobs += validJobs;
                    
                } catch (error) {
                    console.error(`❌ P4 Error for "${term}":`, error.message);
                    continue;
                }
            }
            
            // If still insufficient, try major cities (only if user allows)
            if (searchEngine.results.length < 10) {
                console.log('📢 Trying major job centers as last resort');
                
                for (const city of majorCities.slice(0, 2)) { // Only try top 2 cities
                    if (searchEngine.results.length >= 15) break;
                    
                    for (const term of fallbackTerms.slice(0, 2)) { // Only best fallback terms
                        searchEngine.searchStats.phase4.queries++;
                        console.log(`🔍 P4 Query ${searchEngine.searchStats.phase4.queries}: "${term}" in ${city}`);
                        
                        try {
                            const data = await ApiService.searchJobs(term, city, 50);
                            const validJobs = await Helpers.validateAndAddJobs(data, searchEngine, 2, `P4-${term}-${city}`);
                            searchEngine.searchStats.phase4.jobs += validJobs;
                            
                        } catch (error) {
                            console.error(`❌ P4 Error for "${term}" in ${city}:`, error.message);
                            continue;
                        }
                    }
                }
            }
            
            const duration = Date.now() - startTime;
            console.log(`⏱️ Phase 4 completed in ${duration}ms`);
            console.log(`📊 P4 Results: ${searchEngine.searchStats.phase4.queries} queries, ${searchEngine.searchStats.phase4.jobs} jobs`);
            
            // Phase 4 always "succeeds" - it's the final attempt
            return {
                success: searchEngine.results.length > 0,
                jobs: searchEngine.results,
                phase: 'phase4',
                searchStats: searchEngine.searchStats,
                duration,
                note: searchEngine.results.length > 0 ? 'Fallback search found some results' : 'No suitable jobs found in any search phase'
            };
            
        } catch (error) {
            console.error('❌ Phase 4 Error:', error);
            return { 
                success: false, 
                jobs: searchEngine.results, // Return whatever we have
                error: error.message, 
                phase: 'phase4' 
            };
        }
    },

    // Get fallback terms for difficult cases
    getFallbackTerms: (userProfile) => {
        const userText = (userProfile.messages || []).map(m => m.content).join(' ').toLowerCase();
        
        // Industry-adjacent terms that are broader but still relevant
        if (userText.includes('agile') || userText.includes('coach')) {
            return ['Consultant', 'Trainer', 'Berater', 'Koordinator'];
        } else if (userText.includes('lean') || userText.includes('operations')) {
            return ['Prozess', 'Qualität', 'Verbesserung', 'Koordinator'];
        } else if (userText.includes('elektriker') || userText.includes('sps')) {
            return ['Techniker', 'Wartung', 'Instandhaltung', 'Elektro'];
        } else if (userText.includes('entwickler') || userText.includes('software')) {
            return ['Informatiker', 'Analyst', 'Spezialist', 'Administrator'];
        } else {
            return ['Spezialist', 'Koordinator', 'Sachbearbeiter', 'Assistent'];
        }
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