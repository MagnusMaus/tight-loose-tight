// Job Search Service for intelligent job searching
const JobSearchService = {
    // Optimized job collection using single-word search terms
    searchJobsIntelligent: async (query, location, currentMessages, shownJobUrls = new Set(), userRadius = null) => {
        console.log('🎯 Starting optimized single-word job collection');
        console.log('📍 User specified radius:', userRadius || 'Not specified');
        
        try {
            const userRegion = location || AppConstants.JOB_SEARCH.DEFAULT_LOCATION;
            
            // Generate profession-specific single-word search terms
            const userProfile = { messages: currentMessages };
            const searchTerms = Helpers.generateSingleWordSearchTerms(userProfile);
            
            // Collect 10-25 jobs using sequential single-word searches
            const collectedJobs = await Helpers.collectJobsSequentially(searchTerms, userRegion, 10, 25);
            
            if (collectedJobs.length === 0) {
                console.log('📭 No jobs found with any search terms');
                return null;
            }
            
            // Filter out already shown jobs
            console.log(`📋 Total jobs collected: ${collectedJobs.length}`);
            console.log(`🔍 Already shown jobs: ${shownJobUrls.size}`);
            
            const newJobs = collectedJobs.filter(job => {
                const jobKey = job.url || `${job.title}_${job.company}`;
                const isNew = !shownJobUrls.has(jobKey);
                if (!isNew) {
                    console.log(`   ⏭️  Skipping already shown: "${job.title}" at ${job.company}`);
                }
                return isNew;
            });
            
            console.log(`✨ New jobs after filtering: ${newJobs.length}`);
            
            if (newJobs.length === 0) {
                console.log('⚠️  All collected jobs were already shown');
                return null;
            }
            
            console.log(`🎉 SUCCESS! Collected ${newJobs.length} NEW jobs for analysis!`);
            return {
                jobs: newJobs,
                query: `Sequential search with terms: ${searchTerms.join(', ')}`,
                location: userRegion
            };
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in searchJobsIntelligent:', error);
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
        
        // Debug: Log actual job structure
        console.log('🔍 DEBUG: First job object structure:', JSON.stringify(foundJobs.jobs[0], null, 2));
        
        // Create job analysis prompt as system context
        const jobAnalysisSystemPrompt = systemPrompt + `

[JOB-RANKING-MODUS]
Hier sind ${Math.min(foundJobs.jobs.length, 5)} Jobs zur Analyse:

${foundJobs.jobs.slice(0, 5).map((job, i) => `Job ${i + 1}: ${job.title || 'Kein Titel'} bei ${job.company || job.employer || 'Unbekanntes Unternehmen'} in ${job.location || job.workingPlace || 'Unbekannter Ort'}
Beschreibung: ${job.description || job.htmlContent || job.content || 'Keine Beschreibung verfügbar'}
URL: ${job.url || job.externalUrl || '#'}`).join('\n\n')}

AUFGABE:
1. Bewerte ALLE Jobs (50% psychografisch, 30% fachlich, 20% Umfeld)
2. Erstelle JOB_CARD für JEDEN Job mit 75%+ Fit-Score
3. Sortiere nach Fit-Score (beste zuerst)  
4. Bei Fit-Score unter 75%: SCHWEIGEN (kein Output)

MEHRFACH-OUTPUT Erlaubt:
- Mehrere JOB_CARDs nacheinander für verschiedene Jobs
- Jede JOB_CARD separat mit [JOB_CARD:{...}]
- Keine zusätzlichen Texte zwischen den Karten`;
        
        // Simple user message to trigger analysis
        const userPrompt = `Analysiere diese ${foundJobs.jobs.length} Jobs für mein Profil und erstelle Job Cards für alle passenden Stellen.`;
        
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