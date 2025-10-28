// Main SamCareerCoach Component
const SamCareerCoach = () => {
    const [messages, setMessages] = React.useState([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [jobCards, setJobCards] = React.useState([]);
    const [savedJobs, setSavedJobs] = React.useState([]);
    const [showSavedJobs, setShowSavedJobs] = React.useState(false);
    const [isSearchingJobs, setIsSearchingJobs] = React.useState(false);
    const [isUploadingCV, setIsUploadingCV] = React.useState(false);
    const [shownJobUrls, setShownJobUrls] = React.useState(new Set());
    
    const messagesEndRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const chatSectionRef = React.useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        Helpers.scrollToElement(messagesEndRef.current);
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, jobCards]);

    // Initialize with greeting
    React.useEffect(() => {
        const greeting = Helpers.getGreeting();
        setMessages([{
            role: 'assistant',
            content: greeting
        }]);
    }, []);

    // Get system prompt
    const getSystemPrompt = () => {
        return `<Rolle und Ziel>
Du bist Sam, ein fortschrittlicher Karriere-Coach, der Menschen dabei unterstützt, ihren idealen beruflichen nächsten Schritt zu finden. Dein USP: Du verstehst den Nutzer besser als er sich selbst, indem du ein mehrdimensionales psychografisches Profil erstellst und darauf basierend perfekte Job-Matches findest.

<Mission>
Erstelle aus Dialog und gegebenenfalls CV ein tiefes Verständnis der Person (Fähigkeiten, Erfahrung + Psychografie) und finde Jobs mit höchstem "Fit-Score" - nicht nur fachlich, sondern vor allem psychografisch und kulturell. Du nutzt dabei den Mehrwert als kluges System und schließt aus den expliziten Informationen auf implizite Faktoren.

WICHTIG: Du hast Zugriff auf die Arbeitsagentur Jobbörse - die GRÖßTE deutsche Stellendatenbank mit INTELLIGENTER GESTAFFELTER SUCHE!

<PSYCHOGRAFISCHES PROFILING - DEINE KERNKOMPETENZ>

<WERTE & MOTIVATOREN>
Autonomie vs. Struktur: Braucht Freiraum oder klare Vorgaben?
Innovation vs. Stabilität: Risikobereitschaft bei Veränderungen?
Impact vs. Sicherheit: Gestaltungswille vs. Absicherungsbedürfnis?
Kollaboration vs. Expertise: Team-Player oder Fachexperte?
Wachstum vs. Balance: Karriereambition vs. Work-Life-Balance?

<ARBEITSPSYCHOLOGIE>
Entscheidungsstil: Analytisch, intuitiv, konsensbasiert?
Stressresilienz: Wie mit Druck/Deadlines umgehen?
Kommunikationspräferenz: Direkt, diplomatisch, präsentationsstark?
Lerntyp: Hands-on, theoretisch, mentorbasiert?
Führungsstil: Servant Leader, visionär, operativ?

<UMFELD-PRÄFERENZEN>
Unternehmenskultur: Startup-Chaos, Corporate-Struktur, Familienunternehmen?
Team-Dynamik: Kleine Teams, große Projekte, internationale Matrix?
Branche: Traditionell, Tech, Purpose-driven?
Arbeitsmodell: Remote, Office, hybrid, reiseintensiv

<PROFIL-ERKENNUNGSSTRATEGIE>
Aus Karrierewegen ableiten:
- HÄUFIGE JOBWECHSEL + VERSCHIEDENE BRANCHEN = "Change-Agent, niedrige Routine-Toleranz"
- LANGE BETRIEBSZUGEHÖRIGKEIT + INTERNE BEFÖRDERUNG = "Loyalität, Stabilität, Vertrauensaufbau"
- CONSULTING-HINTERGRUND = "Problemlöser, Kommunikator, Flexibilität"
- TECH ZU MANAGEMENT = "Analytisch + People-Skills, Brückenbauer"

Aus Wortwahl & Formulierungen:
- "Herausforderung suchen" → Wachstumsorientiert, geringe Risikoaversion
- "Team entwickeln" → Servant Leadership, People-fokussiert
- "Prozesse optimieren" → Systematisch, effizienzorientiert
- "Innovation vorantreiben" → Change-Agent, visionär

🎯 FIT-SCORE ALGORITHMUS:
FACHLICHER FIT (30%): Skills-Match, Erfahrungs-Level, Lernkurve
PSYCHOGRAFISCHER FIT (50%): Werte-Alignment, Arbeitstyp-Match, Stress-Faktoren
UMFELD-FIT (20%): Unternehmenskultur, Team-Struktur, Branche

JOB-SUCHE BEST PRACTICES:
- Verwende DEUTSCHE Suchbegriffe für die Arbeitsagentur API: "Betriebsleiter", "Change Manager", "Leiter Operations"
- Vermeide englische Titel wie "COO" oder "Director" - nutze deutsche Entsprechungen
- Psychografisch-basierte Suche: Denke an verwandte Rollen die zum Persönlichkeitsprofil passen
- Location: IMMER eine konkrete deutsche Stadt angeben ("Berlin", "München", "Hamburg", "Hannover")
- NIEMALS location leer lassen - die API verlangt konkrete Städte!
- Das System erweitert automatisch: spezifisch → breit, lokal → deutschlandweit

DEUTSCHE BEGRIFFE für internationale Rollen:
- COO → "Betriebsleiter", "Geschäftsführer Operations" 
- Head of Consulting → "Leiter Beratung", "Change Manager"
- Operations Director → "Betriebsleiter", "Operations Manager"
- Business Development → "Geschäftsentwicklung", "Vertriebsleiter"

PROAKTIVES VERHALTEN:
- Starte mit psychografisch präzisen Queries basierend auf dem Nutzerprofil
- Sage dem Nutzer NICHT, dass du suchst oder was du suchst
- Das System probiert automatisch Query-Varianten und verschiedene Locations
- Der Nutzer sieht nur erfolgreiche Ergebnisse

CV-UPLOAD: Zeige NIEMALS rohe CV-Daten, nur persönliche Antworten und Schlussfolgerungen.

====================================
KRITISCHE REGEL: TRIGGER_SEARCH vs JOB_CARD
====================================

Es gibt NUR ZWEI Situationen wo du diese Tags verwendest:

1️⃣ TRIGGER_SEARCH - VERWENDE NUR WENN:
   ✅ Du bereit bist eine NEUE Job-Suche zu starten
   ✅ User sagt "Speichern & weiter" oder "Zeige mir weitere Stellen"
   ✅ User lehnt einen Job ab
   ✅ Du NOCH KEINE Jobs zur Analyse bekommen hast

   ❌ NIEMALS verwenden wenn du bereits Jobs zur Analyse bekommen hast!

2️⃣ JOB_CARD - VERWENDE NUR WENN:
   ✅ Du hast gerade Jobs ZUR ANALYSE bekommen (System sendet dir 5 Jobs)
   ✅ Du sollst den BESTEN Job empfehlen
   ✅ Du siehst einen Job-Titel, Firma, Beschreibung in der Nachricht
   
   ❌ NIEMALS zusammen mit TRIGGER_SEARCH verwenden!

====================================

WENN DU JOBS ZUR ANALYSE BEKOMMST:
- Das System sendet dir 5 Jobs mit: Titel, Firma, Ort, Beschreibung
- Bewerte ALLE 5 Jobs intern (50% psychografisch, 30% fachlich, 20% Umfeld)
- Erstelle JOB_CARD für JEDEN Job mit Fit-Score 70%+
- Sortiere nach Fit-Score (beste zuerst)
- KEINEN TRIGGER_SEARCH verwenden!

MEHRFACH-OUTPUT ERLAUBT:
- Du kannst MEHRERE JOB_CARDs erstellen (eine pro passendem Job)
- Jede Karte separat mit [JOB_CARD:{...}]
- Jobs unter 70% Fit-Score: IGNORIEREN (keine Karte erstellen)
- Keine zusätzlichen Texte zwischen Karten

Format pro Job mit 70%+ Fit-Score:

[JOB_CARD:{
  "title": "Job Titel",
  "company": "Firma", 
  "location": "Ort",
  "salary": "Gehalt",
  "description": "Deine ausführliche persönliche Analyse warum dieser Job passt - 3-4 Sätze mit psychografischem Fit",
  "fitScore": 85,
  "pros": ["Spezifische Gründe warum es passt basierend auf Persönlichkeitsprofil"],
  "cons": ["Was beachtenswert ist oder nicht optimal passt"],
  "applyUrl": "https://..."
}]

BEISPIEL für 3 passende Jobs:
[JOB_CARD:{"title":"COO","fitScore":87,...}]
[JOB_CARD:{"title":"Operations Manager","fitScore":78,...}]
[JOB_CARD:{"title":"Change Manager","fitScore":74,...}]

WENN USER "SPEICHERN & WEITER" SAGT:
- User will mehr Optionen sehen
- Erstelle NEUEN TRIGGER_SEARCH (KEINE JOB_CARD!)
- Query kann ähnlich sein oder leicht variieren

Format:

Super! Ich schaue nach weiteren Positionen. 🔍

[TRIGGER_SEARCH:{
  "query": "...",
  "location": "..."
}]

====================================

GESPRÄCHSFÜHRUNG:
- Sei ein hilfreicher Sparringspartner und Coach, besonders bei Unsicherheiten
- Stelle **nur eine Frage pro Nachricht** und platziere sie **immer am Ende**
- Gib bei Fragen sinnvolle Antwortmöglichkeiten als Beispiele zur kognitiven Unterstützung
- Frage gezielt nach, um ein vollständiges Bild zu erhalten, bevor du zur nächsten Hauptfrage übergehst
- Nutze Emojis angemessen, um menschlicher zu wirken und Vertrauen aufzubauen
- Halte den Nutzer im Loop über deine Schlussfolgerungen, bleib dabei aber an der Oberfläche, um den Nutzer nicht zu überfordern. Maximal ein Satz.
- Gib eine grobe Einschätzung ab, wie viele Fragen noch im jeweiligen Abschnitt folgen werden

<Die drei Hauptfragen (nacheinander stellen)>

F1: Aktuelle Situation
"In welcher beruflichen Situation befindest du dich gerade?"

F2: Zukunftsvision  
"Wo möchtest du dich beruflich hinentwickeln? Falls dir die Frage schwerfällt: Was möchtest du in 3 bis 5 Jahren beruflich tun oder erreicht haben?"

F3: Fähigkeiten & Erfahrungen
"Welche (besonderen ✨) Fähigkeiten besitzt du? Gehe dabei gern auf deine gesammelten Erfahrungen ein. Wenn du möchtest, dann kannst du gerne dein CV hochladen, um es dir einfach zu machen. 😊📄"

PROFILERSTELLUNG - LIES ZWISCHEN DEN ZEILEN:
- Analysiere nach jeder Antwort: Explizite Aussagen, implizite Hinweise, Karrieremuster, Motivations-Indikatoren
- Erstelle laufend ein psychografisches Profil mit Werte-Scores (1-10 auf verschiedenen Dimensionen)
- Achte auf Vollständigkeit des Profils vor der Jobsuche
- Stelle Nachfragen zu wichtigen Details bevor du zur nächsten Hauptfrage übergehst

JOBEMPFEHLUNGEN (nach Profilvollständigung):
- IMMER nur EINEN Job pro Nachricht 
- Erkläre psychografischen Fit ausführlich - 50% des Fit-Scores!
- Fasse jedes Jobangebot sinnvoll zusammen - der Nutzer muss nicht auf den Link klicken
- Hebe hervor, was zum Nutzer passt und was nicht zu seinem Profil passt
- Erkläre transparent die Faktoren deiner Empfehlung
- Trenne einzelne Jobvorschläge strukturell klar voneinander ab
- Warte auf Feedback: Bewerben, Speichern oder Verwerfen?
- Falls verworfen: Frage nach der Begründung
- Du hörst NUR auf wenn User EXPLIZIT stoppt
- Priorisiere Qualität und Relevanz über Quantität`;
    };

    // Central function: Process Sam's response (with or without TRIGGER_SEARCH)
    const processSamResponse = async (assistantMessage, updatedMessages) => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 DEBUG: processSamResponse called');
        console.log('📝 FULL SAM RESPONSE:', assistantMessage);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // STEP 1: Check for TRIGGER_SEARCH (Priority!)
        const searchTrigger = assistantMessage.match(/\[TRIGGER_SEARCH:\s*(\{[\s\S]*?\})\s*\]/);
        
        console.log('🔍 DEBUG: Checking for TRIGGER_SEARCH...');
        console.log('   Found:', searchTrigger ? 'YES ✅' : 'NO ❌');
        
        if (searchTrigger) {
            console.log('🔍 DEBUG: TRIGGER_SEARCH detected!');
            
            try {
                const searchParams = JSON.parse(searchTrigger[1]);
                console.log('✅ Parsed successfully:', searchParams);
                
                // Remove TRIGGER_SEARCH from text
                const cleanMessage = assistantMessage.replace(/\[TRIGGER_SEARCH:\s*\{[\s\S]*?\}\s*\]/g, '').trim();
                
                // Show Sam's message (without TRIGGER_SEARCH)
                if (cleanMessage) {
                    console.log('💬 Adding clean message to chat');
                    setMessages(prev => [...prev, { role: 'assistant', content: cleanMessage }]);
                }
                
                setIsLoading(false);
                
                console.log('🚀 Starting job search with query:', searchParams.query, 'location:', searchParams.location);
                
                // Validate search parameters
                if (!searchParams.query || typeof searchParams.query !== 'string' || searchParams.query.trim().length === 0) {
                    console.error('❌ Invalid or empty query:', searchParams.query);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Entschuldige, ich konnte keine passenden Suchbegriffe aus deinem CV ableiten. Könntest du mir sagen, nach welcher Art von Position du suchst? 🤔'
                    }]);
                    setIsLoading(false);
                    return true;
                }
                
                // Start job search
                await searchJobs(searchParams.query, searchParams.location || 'Hannover', updatedMessages);
                return true; // Processed!
                
            } catch (e) {
                console.error('❌ Error parsing TRIGGER_SEARCH JSON:', e);
                
                // IMPORTANT: Even on parse error, remove TRIGGER_SEARCH and show cleaned message!
                const cleanMessage = assistantMessage.replace(/\[TRIGGER_SEARCH:\s*\{[\s\S]*?\}\s*\]/g, '').trim();
                if (cleanMessage) {
                    setMessages(prev => [...prev, { role: 'assistant', content: cleanMessage }]);
                }
                
                // Show error message
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Entschuldige, da gab es ein technisches Problem. Lass uns manuell weitersuchen - welche Art von Position interessiert dich am meisten? 🤔'
                }]);
                
                setIsLoading(false);
                return true; // Prevent showing raw TRIGGER_SEARCH!
            }
        }
        
        // STEP 2: Check for JOB_CARD(S) - Updated for multi-card support
        console.log('🔍 DEBUG: Checking for JOB_CARD(S)...');
        const parseResult = Helpers.parseAllJobCards(assistantMessage);
        console.log('   Found:', parseResult.count > 0 ? `YES ✅ (${parseResult.count} cards)` : 'NO ❌');
        
        if (parseResult.count > 0) {
            console.log(`📋 DEBUG: ${parseResult.count} JOB_CARD(S) detected and parsed!`);
            
            // Process all job cards
            const newCards = parseResult.jobCards.map(jobData => ({
                ...jobData,
                id: Helpers.generateId()
            }));
            
            // Add all cards to state
            setJobCards(prev => [...prev, ...newCards]);
            
            // Track all job URLs as "shown"
            const newJobKeys = new Set();
            parseResult.jobCards.forEach(jobData => {
                const jobKey = jobData.applyUrl || jobData.url || `${jobData.title}_${jobData.company}`;
                newJobKeys.add(jobKey);
                console.log(`✅ Added to shown jobs: "${jobData.title || 'Unknown'}"`);
            });
            
            setShownJobUrls(prev => new Set([...prev, ...newJobKeys]));
            
            // Show any additional text if present
            if (parseResult.cleanText && parseResult.cleanText.trim().length > 0) {
                console.log('💬 Additional text with job cards:', parseResult.cleanText);
                setMessages(prev => [...prev, { role: 'assistant', content: parseResult.cleanText }]);
            }
            
            return true;
        }
        
        // STEP 3: Normal text
        console.log('💬 DEBUG: Normal message (no TRIGGER_SEARCH or JOB_CARD)');
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        return true;
    };

    // Main job search function
    const searchJobs = async (query, location, currentMessages) => {
        setIsSearchingJobs(true);
        
        try {
            // Intelligent tiered search
            const foundJobs = await JobSearchService.searchJobsIntelligent(
                query, 
                location, 
                currentMessages, 
                shownJobUrls
            );
            
            if (!foundJobs) {
                // Try one more search with broader German terms before giving up
                console.log('🔄 No jobs found - trying broader German search terms...');
                const fallbackQueries = ['Manager', 'Leiter', 'Berater', 'Führungskraft'];
                
                for (const fallbackQuery of fallbackQueries) {
                    console.log(`🔄 Fallback search: ${fallbackQuery}`);
                    const fallbackJobs = await JobSearchService.searchJobsIntelligent(
                        fallbackQuery, 
                        location, 
                        currentMessages, 
                        shownJobUrls
                    );
                    
                    if (fallbackJobs) {
                        foundJobs = fallbackJobs;
                        break;
                    }
                }
                
                if (!foundJobs) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Ich habe sehr gründlich in verschiedenen Kategorien gesucht, aber momentan keine passenden Stellen gefunden. Das kann an der spezifischen Marktsituation liegen. Lass uns dein Profil etwas breiter fassen - welche verwandten Rollen würden dich auch interessieren? 🤔`
                    }]);
                    setIsSearchingJobs(false);
                    return null;
                }
            }
            
            // Send jobs to Sam for analysis and ranking
            const assistantMessage = await JobSearchService.analyzeJobsWithSam(
                foundJobs, 
                currentMessages, 
                getSystemPrompt()
            );
            
            // Process multiple job cards
            const parseResult = Helpers.parseAllJobCards(assistantMessage);
            
            if (parseResult.count > 0) {
                console.log(`🏆 Found ${parseResult.count} job cards!`);
                
                // Filter for quality jobs (70%+ fit score)
                const qualityJobs = parseResult.jobCards.filter(job => job.fitScore >= 70);
                console.log(`   ✨ Quality jobs (70%+): ${qualityJobs.length}`);
                
                if (qualityJobs.length > 0) {
                    // Add all quality jobs
                    const newCards = qualityJobs.map(jobData => ({
                        ...jobData,
                        id: Helpers.generateId()
                    }));
                    
                    setJobCards(prev => [...prev, ...newCards]);
                    
                    // Track all job URLs as "shown"
                    qualityJobs.forEach(jobData => {
                        const jobKey = jobData.applyUrl || jobData.url || `${jobData.title}_${jobData.company}`;
                        setShownJobUrls(prev => new Set([...prev, jobKey]));
                        console.log(`✅ Added quality job: "${jobData.title}" (${jobData.fitScore}%)`);
                    });
                    
                    // Show any additional text
                    if (parseResult.cleanText && parseResult.cleanText.trim().length > 0) {
                        setMessages(prev => [...prev, { role: 'assistant', content: parseResult.cleanText }]);
                    }
                    
                    // Check if we should continue searching (if all jobs are under 80% fit)
                    const highQualityJobs = qualityJobs.filter(job => job.fitScore >= 80);
                    if (highQualityJobs.length === 0 && qualityJobs.length > 0) {
                        console.log('🔄 All jobs under 80% fit - continuing search for better matches...');
                        // Continue searching in background for better matches
                        setTimeout(() => {
                            searchJobs(query, location, currentMessages);
                        }, 2000);
                    }
                    
                    setIsSearchingJobs(false);
                    return foundJobs.jobs;
                }
            }
            
            // No quality jobs found - try psychographic alternatives
            console.log('🧠 No quality jobs found - trying psychographic alternatives...');
            
            const psychographicAlternatives = [
                'Change Manager', 'Transformation Manager', 'Organisationsentwickler',
                'Business Development Manager', 'Strategie Manager', 'Prozess Manager',
                'Team Lead', 'Abteilungsleiter', 'Projektleiter', 'Product Manager',
                'Beratung', 'Consulting', 'Management Consultant', 'Berater'
            ];
            
            for (const altQuery of psychographicAlternatives) {
                console.log(`🔄 Trying psychographic alternative: ${altQuery}`);
                const altJobs = await JobSearchService.searchJobsIntelligent(
                    altQuery, 
                    location, 
                    currentMessages, 
                    shownJobUrls
                );
                
                if (altJobs) {
                    const altMessage = await JobSearchService.analyzeJobsWithSam(
                        altJobs, 
                        currentMessages, 
                        getSystemPrompt()
                    );
                    
                    const altParseResult = Helpers.parseAllJobCards(altMessage);
                    if (altParseResult.count > 0) {
                        const altQualityJobs = altParseResult.jobCards.filter(job => job.fitScore >= 70);
                        if (altQualityJobs.length > 0) {
                            console.log(`✅ Found ${altQualityJobs.length} quality jobs with alternative: ${altQuery}`);
                            
                            const newCards = altQualityJobs.map(jobData => ({
                                ...jobData,
                                id: Helpers.generateId()
                            }));
                            
                            setJobCards(prev => [...prev, ...newCards]);
                            
                            altQualityJobs.forEach(jobData => {
                                const jobKey = jobData.applyUrl || jobData.url || `${jobData.title}_${jobData.company}`;
                                setShownJobUrls(prev => new Set([...prev, jobKey]));
                            });
                            
                            setIsSearchingJobs(false);
                            return altJobs.jobs;
                        }
                    }
                }
            }
            
            console.log('⚠️ Exhausted all alternatives');
            setIsSearchingJobs(false);
            return null;
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in searchJobs:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                query: query,
                location: location
            });
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Technisches Problem bei der Suche nach "${query}" in ${location}. Das könnte an einer zu spezifischen Suchanfrage liegen. Lass uns es mit anderen Begriffen versuchen! 🔧`
            }]);
            setIsSearchingJobs(false);
            return null;
        }
    };

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingCV(true);
        console.log('📄 CV upload started');
        
        // Show immediate feedback about CV processing
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Ich lese deinen Lebenslauf... Das kann einen Moment dauern. ⏳'
        }]);
        
        try {
            const data = await CVParserService.parseCV(file);
            const fileMessage = CVParserService.createCVSystemMessage(data);
            
            const updatedMessages = [...messages, { role: 'user', content: fileMessage }];
            setIsUploadingCV(false);
            setIsLoading(true);

            const samData = await ApiService.chatWithSam(updatedMessages, getSystemPrompt(), { isJobAnalysis: true });
            const assistantMessage = samData.content[0].text;

            // Use central processing function!
            const messagesWithResponse = [...updatedMessages, { role: 'assistant', content: assistantMessage }];
            await processSamResponse(assistantMessage, messagesWithResponse);
            setIsLoading(false);
            
        } catch (error) {
            console.error('❌ CV upload error:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type
            });
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Fehler beim Verarbeiten deines CVs (${file?.name}). Das könnte an der Dateigröße oder dem Format liegen. Bitte versuche es mit einer PDF- oder Word-Datei unter 10MB nochmal. 🔧`
            }]);
            setIsUploadingCV(false);
            setIsLoading(false);
        }
    };

    // Handle send message
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const data = await ApiService.chatWithSam(updatedMessages, getSystemPrompt());
            const assistantMessage = data.content[0].text;

            // Use central processing function!
            const messagesWithResponse = [...updatedMessages, { role: 'assistant', content: assistantMessage }];
            await processSamResponse(assistantMessage, messagesWithResponse);

        } catch (error) {
            console.error('❌ Error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Technischer Fehler. Bitte nochmal versuchen.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle job actions
    const handleJobAction = async (jobId, action) => {
        console.log('🎬 DEBUG: handleJobAction called', action, jobId);
        
        const job = jobCards.find(j => j.id === jobId);
        if (!job) return;

        let userResponse = '';
        if (action === 'apply') {
            userResponse = `Ich möchte mich für "${job.title}" bewerben.`;
            if (job.applyUrl || job.url) window.open(job.applyUrl || job.url, '_blank');
        } else if (action === 'save') {
            console.log('💾 DEBUG: User clicked SAVE button - expecting TRIGGER_SEARCH in response!');
            setSavedJobs(prev => {
                if (prev.find(j => j.id === jobId)) return prev;
                return [...prev, job];
            });
            userResponse = `"${job.title}" gespeichert. Zeige mir weitere Stellen.`;
        } else if (action === 'reject') {
            userResponse = `"${job.title}" passt nicht.`;
        }

        console.log('📤 DEBUG: Sending to Sam:', userResponse);
        
        setJobCards(prev => prev.filter(j => j.id !== jobId));

        const userMessage = { role: 'user', content: userResponse };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const data = await ApiService.chatWithSam(updatedMessages, getSystemPrompt());
            const assistantMessage = data.content[0].text;
            
            // Use central processing function!
            const messagesWithResponse = [...updatedMessages, { role: 'assistant', content: assistantMessage }];
            await processSamResponse(assistantMessage, messagesWithResponse);

        } catch (error) {
            console.error('❌ Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Fehler. Lass uns weitermachen! 🔧'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement('div', { style: { backgroundColor: '#f9fafb' } }, [
        // Header
        React.createElement('header', {
            key: 'header',
            className: 'header'
        }, [
            React.createElement('div', {
                key: 'header-content',
                className: 'header-content'
            }, [
                React.createElement('h1', {
                    key: 'title',
                    className: 'header-title'
                }, 'TabiCoach'),
                React.createElement('span', {
                    key: 'version',
                    className: 'header-version'
                }, 'v2.0 Professional')
            ])
        ]),

        // Hero Section
        React.createElement('section', {
            key: 'hero',
            className: 'hero'
        }, [
            React.createElement('h2', {
                key: 'title',
                className: 'hero-title'
            }, [
                'Jobs, die zu ',
                React.createElement('span', {
                    key: 'highlight',
                    className: 'highlight'
                }, 'dir'),
                ' passen.'
            ]),
            React.createElement('p', {
                key: 'subtitle',
                className: 'hero-subtitle'
            }, 'Sam versteht deine Persönlichkeit und findet Rollen, die du wirklich lieben wirst.')
        ]),

        // Features Section
        React.createElement('section', {
            key: 'features',
            className: 'features'
        }, [
            React.createElement('h3', {
                key: 'title',
                className: 'features-title'
            }, 'TabiCoach ist viel mehr als eine Jobbörse'),

            React.createElement('div', {
                key: 'grid',
                className: 'features-grid'
            }, [
                // Feature 1
                React.createElement('div', {
                    key: 'feature1',
                    className: 'feature-card'
                }, [
                    React.createElement('div', {
                        key: 'icon',
                        className: 'feature-icon'
                    }, React.createElement(Icons.Brain)),
                    React.createElement('h4', {
                        key: 'title',
                        className: 'feature-title'
                    }, 'Sam versteht dich wirklich'),
                    React.createElement('p', {
                        key: 'description',
                        className: 'feature-description'
                    }, 'Ein kurzes Gespräch – und Sam kennt deine Werte, Motivationen und Arbeitsweise. Nicht nur deinen Lebenslauf.')
                ]),

                // Feature 2
                React.createElement('div', {
                    key: 'feature2',
                    className: 'feature-card'
                }, [
                    React.createElement('div', {
                        key: 'icon',
                        className: 'feature-icon'
                    }, React.createElement(Icons.Diamond)),
                    React.createElement('h4', {
                        key: 'title',
                        className: 'feature-title'
                    }, 'Finde auch versteckte Perlen'),
                    React.createElement('p', {
                        key: 'description',
                        className: 'feature-description'
                    }, 'Sam durchsucht tausende Jobs für dich – auch die mit unerwarteten Titeln. Kein perfekter Match bleibt dir verborgen.')
                ]),

                // Feature 3
                React.createElement('div', {
                    key: 'feature3',
                    className: 'feature-card'
                }, [
                    React.createElement('div', {
                        key: 'icon',
                        className: 'feature-icon'
                    }, React.createElement(Icons.Sparkles)),
                    React.createElement('h4', {
                        key: 'title',
                        className: 'feature-title'
                    }, 'Nur relevante Jobs, kein Rauschen'),
                    React.createElement('p', {
                        key: 'description',
                        className: 'feature-description'
                    }, 'Sam filtert für dich und zeigt nur Matches, die wirklich passen. Schluss mit endlosen Listen durchscrollen.')
                ])
            ])
        ]),

        // Chat Interface
        React.createElement(ChatInterface, {
            key: 'chat',
            messages,
            input,
            isLoading,
            isSearchingJobs,
            isUploadingCV,
            jobCards,
            savedJobs,
            showSavedJobs,
            onInputChange: setInput,
            onSend: handleSend,
            onFileUpload: handleFileUpload,
            onJobAction: handleJobAction,
            onToggleSavedJobs: () => setShowSavedJobs(!showSavedJobs),
            onCloseSavedJobs: () => setShowSavedJobs(false),
            onRemoveSavedJob: (jobId) => setSavedJobs(prev => prev.filter(j => j.id !== jobId)),
            messagesEndRef,
            fileInputRef
        })
    ]);
};

// Export for global use
window.SamCareerCoach = SamCareerCoach;