// server.js - Updated with proper CORS
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 SECRET API KEY
const GEMINI_API_KEY = "AIzaSyAthN2yJkAz_OEqaGhSP14uGmYc7cslZ_0";

// 🔥 IMPORTANT: CORS Configuration
const allowedOrigins = [
    'https://faiz786-lada.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            // Check if it's a GitHub Pages URL
            if (origin.includes('.github.io')) {
                return callback(null, true);
            }
            
            const msg = 'CORS policy blocks this request';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Cyber AI Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root - Simple response for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Cyber AI Backend Server',
        endpoints: {
            health: 'GET /health',
            chat: 'POST /api/chat'
        },
        creator: 'The World of Cybersecurity',
        note: 'Server is running successfully!'
    });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('📩 Chat request received');
        
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: 'Bad Request',
                message: 'Messages array is required' 
            });
        }

        // Get last user message
        const lastMessage = messages[messages.length - 1]?.content || '';
        
        // Prepare request for Gemini API
        const geminiRequest = {
            contents: [{
                role: "user",
                parts: [{
                    text: `You are Cyber AI, created by 'The World of Cybersecurity'. 
Be helpful and concise. User's question: ${lastMessage}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500
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

        console.log('🤖 Calling Gemini API...');
        
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

        let aiResponse = "Hello! I'm Cyber AI. How can I help you?";
        
        if (response.data.candidates && response.data.candidates[0] && 
            response.data.candidates[0].content && response.data.candidates[0].content.parts) {
            aiResponse = response.data.candidates[0].content.parts[0].text;
            
            // Clean response
            aiResponse = aiResponse
                .replace(/gemini/gi, 'Cyber AI')
                .replace(/google/gi, '')
                .replace(/powered by.*/gi, '');
        }

        console.log('✅ Response generated successfully');
        
        // Return response in expected format
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
        console.error('❌ Gemini API Error:', error.response?.data || error.message);
        
        // Enhanced fallback response
        const userMessage = req.body.messages?.[req.body.messages.length - 1]?.content || '';
        const userMessageLower = userMessage.toLowerCase();
        
        let fallbackResponse = "Hello! I'm Cyber AI, created by 'The World of Cybersecurity'. ";
        
        if (userMessageLower.includes('python') || userMessageLower.includes('code')) {
            fallbackResponse += `\n\n🐍 **Python Example:**\n\n\`\`\`python\nprint("Hello from Cyber AI!")\n\`\`\``;
        } else if (userMessageLower.includes('cyber') || userMessageLower.includes('security')) {
            fallbackResponse += `\n\n🔐 **Cybersecurity Tip:** Always use strong passwords and enable 2FA.`;
        } else {
            fallbackResponse += `\n\nI can help with programming, cybersecurity, and AI topics.`;
        }
        
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
    console.error('💥 Server error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Please try again later.'
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
    console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
});
