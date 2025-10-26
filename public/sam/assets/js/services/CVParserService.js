// CV Parser Service for handling file uploads and parsing
const CVParserService = {
    // Validate CV file before upload
    validateFile: (file) => {
        const errors = [];
        
        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }
        
        // Check file type
        if (!Helpers.isValidFileType(file.type)) {
            errors.push('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
        }
        
        // Check file size
        if (file.size > AppConstants.LIMITS.MAX_CV_SIZE) {
            errors.push(`File too large. Maximum file size is ${Helpers.formatFileSize(AppConstants.LIMITS.MAX_CV_SIZE)}.`);
        }
        
        // Check filename for security
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
            errors.push('Invalid filename');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Convert file to base64
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                } catch (error) {
                    reject(new Error('Failed to convert file to base64'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    },

    // Parse CV file
    parseCV: async (file) => {
        try {
            console.log('📄 CV upload started for file:', file.name);
            
            // Validate file first
            const validation = CVParserService.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Convert to base64
            const base64Data = await CVParserService.fileToBase64(file);
            
            // Call API to parse CV
            const data = await ApiService.parseCV(base64Data, file.name, file.type);
            
            console.log('✅ CV parsed successfully');
            return data;
            
        } catch (error) {
            console.error('❌ CV parsing error:', error);
            throw error;
        }
    },

    // Create system message for CV data
    createCVSystemMessage: (cvData) => {
        return `[SYSTEM: Der Nutzer hat seinen Lebenslauf hochgeladen. Analysiere und antworte persönlich. Zeige NICHT die rohen Daten.]\n\n${cvData.text}`;
    }
};

// Export for global use
window.CVParserService = CVParserService;