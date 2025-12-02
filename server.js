// server.js - Backend with hidden API key
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 SECRET: API key is hidden on server (NOT in frontend)
const GEMINI_API_KEY = "AIzaSyAthN2yJkAz_OEqaGhSP14uGmYc7cslZ_0";

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (optional)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Cyber AI Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'Cyber AI Backend Server',
        endpoints: {
            health: 'GET /health',
            chat: 'POST /api/chat'
        },
        creator: 'The World of Cybersecurity'
    });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Extract last user message for system prompt
        const lastMessage = messages[messages.length - 1]?.content || '';
        
        // Prepare request for Gemini API
        const geminiRequest = {
            contents: [
                {
                    role: "user",
                    parts: [{
                        text: `You are Cyber AI, created by 'The World of Cybersecurity' and developed by Team Cybersecurity.
You are a helpful, accurate, and friendly AI assistant specialized in cybersecurity, programming, and AI topics.
Keep responses concise but informative. Format code properly with markdown.
Never mention that you are powered by Gemini or Google - you are simply "Cyber AI".

User's question: ${lastMessage}`
                    }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
                topP: 0.8,
                topK: 40
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            geminiRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        let aiResponse = "";
        
        if (response.data.candidates && response.data.candidates[0] && 
            response.data.candidates[0].content && response.data.candidates[0].content.parts) {
            aiResponse = response.data.candidates[0].content.parts[0].text;
            
            // Clean response from Gemini/Google mentions
            aiResponse = aiResponse
                .replace(/gemini/gi, 'Cyber AI')
                .replace(/google/gi, '')
                .replace(/powered by.*/gi, '')
                .replace(/I'm.*model/gi, "I'm Cyber AI")
                .replace(/I am.*AI/gi, "I am Cyber AI");
        } else {
            aiResponse = "I'm here to help! Could you please rephrase your question?";
        }

        // Return formatted response
        res.json({
            choices: [{
                message: {
                    role: "assistant",
                    content: aiResponse
                }
            }],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        
        // Enhanced fallback response
        const userMessage = req.body.messages?.[req.body.messages.length - 1]?.content || '';
        const userMessageLower = userMessage.toLowerCase();
        
        let fallbackResponse = "Hello! I'm Cyber AI, created by 'The World of Cybersecurity'. ";
        
        if (userMessageLower.includes('python') || userMessageLower.includes('code')) {
            fallbackResponse += `\n\n🐍 **Python Programming Help:**\n\n\`\`\`python\n# Example: Secure function\ndef secure_hash(input_string):\n    import hashlib\n    return hashlib.sha256(input_string.encode()).hexdigest()\n\nprint(f"Hash: {secure_hash('cybersecurity')}")\n\`\`\``;
        } else if (userMessageLower.includes('cyber') || userMessageLower.includes('security')) {
            fallbackResponse += `\n\n🔐 **Cybersecurity Essentials:**\n\n1. Use strong passwords\n2. Enable 2FA\n3. Regular updates\n4. Backup data\n5. Phishing awareness`;
        } else if (userMessageLower.includes('ai') || userMessageLower.includes('artificial')) {
            fallbackResponse += `\n\n🤖 **AI Insights:**\n\n• Machine Learning\n• Deep Learning\n• NLP\n• Computer Vision\n• AI Ethics`;
        } else {
            fallbackResponse += `\n\nI can help you with:\n\n• Programming\n• Cybersecurity\n• AI topics\n• Tech support\n\nAsk me anything specific!`;
        }
        
        fallbackResponse += "\n\n*(Enhanced response mode)*";
        
        res.json({
            choices: [{
                message: {
                    role: "assistant",
                    content: fallbackResponse
                }
            }],
            fallback: true,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong. Please try again later.'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Cyber AI Backend Server started on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`✅ API key is secure and hidden from clients`);
});
