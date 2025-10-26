// Job Search Service for intelligent job searching
const JobSearchService = {
    // Main intelligent tiered search function
    searchJobsIntelligent: async (query, location, currentMessages, shownJobUrls = new Set()) => {
        console.log('🎯 Starting intelligent tiered search for:', query);
        
        try {
            // Generate query variants and location tiers
            const queryVariants = Helpers.generateQueryVariants(query);
            const userRegion = location || AppConstants.JOB_SEARCH.DEFAULT_LOCATION;
            const locationTiers = Helpers.generateLocationTiers(userRegion);
            
            let attemptNumber = 0;
            let foundJobs = null;
            
            // Try all combinations: Query variants × Location tiers
            for (const queryVariant of queryVariants) {
                if (foundJobs) break; // Stop if jobs found
                
                for (const locationTier of locationTiers) {
                    attemptNumber++;
                    
                    console.log(`🔍 Attempt ${attemptNumber}: "${queryVariant}" in ${locationTier.location} (${locationTier.radius}km) [${locationTier.label}]`);
                    
                    try {
                        const data = await ApiService.searchJobs(queryVariant, locationTier.location, locationTier.radius);
                        
                        console.log(`📊 Result: ${data.total || 0} jobs found`);
                        
                        if (data.jobs && data.jobs.length > 0) {
                            // Filter already shown jobs immediately
                            console.log(`   📋 Total jobs from API: ${data.jobs.length}`);
                            console.log(`   🔍 Already shown jobs: ${shownJobUrls.size}`);
                            
                            const newJobs = data.jobs.filter(job => {
                                const jobKey = job.url || `${job.title}_${job.company}`;
                                const isNew = !shownJobUrls.has(jobKey);
                                if (!isNew) {
                                    console.log(`   ⏭️  Skipping already shown: "${job.title}" at ${job.company}`);
                                }
                                return isNew;
                            });
                            
                            console.log(`   ✨ New jobs after filtering: ${newJobs.length}`);
                            
                            // Only if NEW jobs after filtering -> count as success
                            if (newJobs.length > 0) {
                                console.log(`🎉 SUCCESS! Found ${newJobs.length} NEW jobs!`);
                                foundJobs = {
                                    jobs: newJobs,
                                    query: queryVariant,
                                    location: locationTier.location
                                };
                                break; // Success - stop inner loop
                            } else {
                                console.log('⚠️  All jobs were already shown - continuing search...');
                            }
                        } else {
                            console.log('📭 No jobs, trying next combination...');
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error in attempt ${attemptNumber}:`, error);
                        // Continue with next combination
                    }
                }
            }
            
            return foundJobs;
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in searchJobsIntelligent:', error);
            throw error;
        }
    },

    // Send jobs to Sam for analysis and get job card
    analyzeJobsWithSam: async (foundJobs, currentMessages, systemPrompt) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 DEBUG: Sending jobs to Sam for ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Jobs found: ${foundJobs.jobs.length}`);
        console.log(`   Query: "${foundJobs.query}"`);
        console.log(`   Location: "${foundJobs.location}"`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const jobsContext = `[SYSTEM: JOB-ANALYSE-MODUS]

Hier sind ${foundJobs.jobs.length} Jobs von der Bundesagentur für "${foundJobs.query}" in "${foundJobs.location}":

${foundJobs.jobs.slice(0, 5).map((job, i) => `
Job ${i + 1}:
- Titel: ${job.title}
- Firma: ${job.company}
- Ort: ${job.location}
- Beschreibung: ${job.description}
- Link: ${job.url}
`).join('\n')}

DEINE AUFGABE:
1. Bewerte ALLE 5 Jobs intern (50% psychografisch, 30% Skills, 20% Umfeld)
2. Wähle den BESTEN Job basierend auf dem Persönlichkeitsprofil
3. Erstelle EINE JOB_CARD für diesen Job

KRITISCH WICHTIG: 
✅ Erstelle NUR eine JOB_CARD - KEINEN zusätzlichen Chat-Text!
✅ Alle deine Analyse gehört IN die JOB_CARD (description, pros, cons)
❌ KEINEN TRIGGER_SEARCH verwenden!
❌ KEINEN Text vor oder nach der JOB_CARD!
❌ Dieser Prompt bedeutet NICHT "suche weitere Jobs"

Format:
[JOB_CARD:{
  "description": "Hier deine ausführliche persönliche Analyse warum dieser Job perfekt passt - 3-4 Sätze mit psychografischem Fit",
  "pros": ["Spezifische Gründe basierend auf Persönlichkeitsprofil"],
  "cons": ["Was beachtenswert ist"],
  ...
}]

Begründe IN der JOB_CARD warum dieser Job zum Persönlichkeitsprofil passt.`;

        const updatedMessages = [...currentMessages, {
            role: 'user',
            content: jobsContext
        }];

        try {
            const samData = await ApiService.chatWithSam(updatedMessages, systemPrompt, { isJobAnalysis: true });
            const assistantMessage = samData.content[0].text;
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🤖 SAM\'S ANALYSIS RESPONSE:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(assistantMessage);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return assistantMessage;
            
        } catch (error) {
            console.error('❌ Error in analyzeJobsWithSam:', error);
            throw error;
        }
    }
};

// Export for global use
window.JobSearchService = JobSearchService;