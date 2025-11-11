// Job Search Service for intelligent job searching
const JobSearchService = {
    // UNIFIED INTELLIGENT SEARCH - 4-Phase Strategy
    searchJobsIntelligent: async (query, location, currentMessages, shownJobUrls = new Set(), userRadius = null) => {
        console.log('🎯 Starting UNIFIED INTELLIGENT SEARCH ENGINE');
        console.log('📍 User specified radius:', userRadius || 'Default (25km)');
        
        try {
            const userRegion = location || AppConstants.JOB_SEARCH.DEFAULT_LOCATION;
            const searchRadius = userRadius || 25; // Default to 25km
            
            // Create user profile for intelligent search
            const userProfile = { 
                messages: currentMessages,
                query: query,
                location: userRegion,
                radius: searchRadius
            };
            
            // Add Claude's specific search intent to profile for more targeted search
            console.log(`🎯 Claude's specific search query: "${query}"`);
            
            // Execute the 4-phase intelligent search strategy
            const searchResult = await Helpers.executeIntelligentJobSearch(userProfile, userRegion, searchRadius);
            
            if (!searchResult.success || searchResult.jobs.length === 0) {
                console.log('📭 Unified search found no suitable jobs');
                console.log('📊 Search Statistics:', JSON.stringify(searchResult.searchStats, null, 2));
                return null;
            }
            
            // Filter out already shown jobs
            console.log(`📋 Total jobs from unified search: ${searchResult.jobs.length}`);
            console.log(`🔍 Already shown jobs: ${shownJobUrls.size}`);
            console.log(`📈 Search completed in phase: ${searchResult.phase}`);
            
            const newJobs = searchResult.jobs.filter(job => {
                const jobKey = job.url || `${job.title}_${job.company}`;
                const isNew = !shownJobUrls.has(jobKey);
                if (!isNew) {
                    console.log(`   ⏭️  Skipping already shown: "${job.title}" at ${job.company}`);
                }
                return isNew;
            });
            
            console.log(`✨ New jobs after filtering: ${newJobs.length}`);
            
            if (newJobs.length === 0) {
                console.log('⚠️  All unified search results were already shown');
                return null;
            }
            
            // Add search metadata to jobs
            const enrichedJobs = newJobs.map(job => ({
                ...job,
                unifiedSearchPhase: searchResult.phase,
                searchDuration: searchResult.duration
            }));
            
            console.log('🎉 UNIFIED SEARCH SUCCESS!');
            console.log(`📊 Final Statistics:`, searchResult.searchStats);
            
            return {
                jobs: enrichedJobs,
                query: `Unified 4-phase search (completed in ${searchResult.phase})`,
                location: userRegion,
                searchMetadata: {
                    phase: searchResult.phase,
                    stats: searchResult.searchStats,
                    duration: searchResult.duration
                }
            };
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in Unified Search Engine:', error);
            throw error;
        }
    },

    // Send jobs to Sam for analysis and ranking - NEW MULTI-JOB APPROACH
    analyzeJobsWithSam: async (foundJobs, currentMessages, systemPrompt) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 DEBUG: Sending jobs to Sam for RANKING ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Jobs found: ${foundJobs.jobs.length}`);
        console.log(`   Query: "${foundJobs.query}"`);
        console.log(`   Location: "${foundJobs.location}"`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Debug: Log actual job structure and data transmission
        console.log('🔍 DEBUG: First job object structure:', JSON.stringify(foundJobs.jobs[0], null, 2));
        console.log('📤 DEBUG: About to send to Claude:', {
            jobCount: foundJobs.jobs.length,
            firstJobTitle: foundJobs.jobs[0]?.title,
            hasDescription: !!foundJobs.jobs[0]?.description
        });
        
        // System prompt with ranking instructions
        const jobAnalysisSystemPrompt = systemPrompt + `

[JOB-RANKING-MODUS AKTIVIERT]

AUFGABE:
1. Bewerte ALLE Jobs (50% psychografisch, 30% fachlich, 20% Umfeld)
2. Erstelle JOB_CARD für JEDEN Job mit 75%+ Fit-Score
3. Sortiere nach Fit-Score (beste zuerst)  
4. Bei Fit-Score unter 75%: SCHWEIGEN (kein Output)

MEHRFACH-OUTPUT Erlaubt:
- Mehrere JOB_CARDs nacheinander für verschiedene Jobs
- Jede JOB_CARD separat mit [JOB_CARD:{...}]
- Keine zusätzlichen Texte zwischen den Karten`;
        
        // User message WITH job data (Claude expects job data in user message, not system prompt)
        // Optimize: Send only top 3 jobs to reduce token usage while maintaining quality
        const topJobs = foundJobs.jobs.slice(0, 3);
        const userPrompt = `Analysiere diese ${topJobs.length} Jobs für mein Profil und erstelle Job Cards für alle passenden Stellen:

${topJobs.map((job, i) => `Job ${i + 1}: ${job.title || 'Kein Titel'} bei ${job.company || job.employer || 'Unbekanntes Unternehmen'} in ${job.location || job.workingPlace || 'Unbekannter Ort'}
Beschreibung: ${(job.description || job.htmlContent || job.content || 'Keine Beschreibung verfügbar').substring(0, 150)}...
URL: ${job.url || job.externalUrl || '#'}`).join('\n\n')}

Erstelle jetzt Job Cards für alle passenden Positionen (75%+ Fit-Score).`;
        
        // Debug: Verify user prompt contains job data  
        console.log('📝 DEBUG: User prompt length:', userPrompt.length);
        console.log('📝 DEBUG: User prompt preview:', userPrompt.substring(0, 200) + '...');
        
        const updatedMessages = [...currentMessages, {
            role: 'user',
            content: userPrompt
        }];

        try {
            const samData = await ApiService.chatWithSam(updatedMessages, jobAnalysisSystemPrompt, { isJobAnalysis: true });
            const assistantMessage = samData.content[0].text;
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🤖 SAM\'S RANKING RESPONSE:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(assistantMessage);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return assistantMessage;
            
        } catch (error) {
            console.error('❌ Error in analyzeJobsWithSam:', error);
            
            // Fallback: Return a simplified job card for the best job if API fails
            if (foundJobs.jobs && foundJobs.jobs.length > 0) {
                console.log('🚨 API failed - creating fallback job card for best job');
                const bestJob = foundJobs.jobs[0]; // Take first job as fallback
                
                const fallbackCard = `[JOB_CARD:{
  "title": "${bestJob.title}",
  "company": "${bestJob.company || 'Unbekannt'}", 
  "location": "${bestJob.location || foundJobs.location}",
  "salary": "${bestJob.salary || 'Nicht angegeben'}",
  "description": "Diese Position könnte interessant für dich sein. Leider konnte ich aufgrund eines technischen Problems keine detaillierte Analyse durchführen. Bitte prüfe die Details selbst.",
  "fitScore": 75,
  "pros": ["Passende Position gefunden", "Entspricht deinen Suchkriterien"],
  "cons": ["Technisches Problem bei der Analyse"],
  "applyUrl": "${bestJob.url || '#'}"
}]`;
                
                return fallbackCard;
            }
            
            throw error;
        }
    },

    // Extract user radius from conversation history
    extractUserRadius: (messages) => {
        console.log('🔍 Extracting user radius from conversation...');
        
        // Look for radius mentions in user messages
        const radiusPatterns = [
            /(\d+)\s*km/i,
            /25.*km/i,
            /50.*km/i, 
            /100.*km/i,
            /deutschlandweit/i,
            /deutschland/i,
            /überall/i,
            /bundesweit/i
        ];
        
        for (const message of messages.slice().reverse()) {
            if (message.role === 'user') {
                const content = message.content.toLowerCase();
                
                // Check for specific radius mentions
                for (const pattern of radiusPatterns) {
                    const match = content.match(pattern);
                    if (match) {
                        if (match[1]) {
                            // Numeric radius found
                            const radius = parseInt(match[1]);
                            console.log(`✅ Found user radius: ${radius}km`);
                            return radius;
                        } else if (content.includes('deutschlandweit') || content.includes('deutschland') || content.includes('überall') || content.includes('bundesweit')) {
                            // Nationwide search
                            console.log('✅ Found user preference: deutschlandweit (200km)');
                            return 200;
                        }
                    }
                }
                
                // Check for city-only vs regional preferences
                if (content.includes('nur') && (content.includes('stadt') || content.includes('lokal'))) {
                    console.log('✅ User wants local search only (25km)');
                    return 25;
                } else if (content.includes('region') || content.includes('umgebung')) {
                    console.log('✅ User wants regional search (50km)');
                    return 50;
                }
            }
        }
        
        console.log('⚠️ No user radius found in conversation');
        return null;
    },

    // Extract user location from conversation history  
    extractUserLocation: (messages) => {
        console.log('🏠 Extracting user location from conversation...');
        
        // German cities pattern
        const cityPatterns = [
            /(?:wohne|lebe|bin)\s+(?:in|aus)\s+([a-zäöüß]+)/i,
            /(?:ich komme aus|stamme aus)\s+([a-zäöüß]+)/i,
            /(?:mein wohnort|meine stadt)\s+(?:ist|:)\s*([a-zäöüß]+)/i,
            /(berlin|münchen|hamburg|köln|frankfurt|stuttgart|düsseldorf|dortmund|essen|leipzig|bremen|dresden|hannover|nürnberg|duisburg|bochum|wuppertal|bielefeld|bonn|münster|karlsruhe|mannheim|augsburg|wiesbaden|gelsenkirchen|mönchengladbach|braunschweig|chemnitz|kiel|aachen|halle|magdeburg|freiburg|krefeld|lübeck|oberhausen|erfurt|mainz|rostock|kassel|hagen|potsdam|saarbrücken|hamm|mülheim|ludwigshafen|leverkusen|oldenburg|osnabrück|solingen|heidelberg|herne|neuss|darmstadt|paderborn|regensburg|ingolstadt|würzburg|fürth|wolfsburg|offenbach|ulm|heilbronn|pforzheim|göttingen|bottrop|trier|recklinghausen|reutlingen|bremerhaven|koblenz|bergisch|gladbach|erlangen|jena|remscheid|salzgitter|moers|siegen|hildesheim)/i
        ];
        
        for (const message of messages.slice().reverse()) {
            if (message.role === 'user') {
                const content = message.content.toLowerCase();
                
                for (const pattern of cityPatterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        // Capitalize first letter for consistency
                        const city = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                        console.log(`✅ Found user location: ${city}`);
                        return city;
                    }
                }
            }
        }
        
        console.log('⚠️ No user location found in conversation');
        return null;
    }
};

// Export for global use
window.JobSearchService = JobSearchService;