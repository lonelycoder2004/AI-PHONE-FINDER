const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration (Move Above express.json)
const corsOptions = {
    origin: '*', // Allow all origins (for testing)
    methods: ['GET', 'POST'], // Allow only necessary methods
    allowedHeaders: ['Content-Type'], // Allow required headers
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json()); // JSON Middleware

// API Endpoint to handle user query
app.post('/api/query', (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Received query: ${query}`);

    // Spawn Python process with user query
    const pythonProcess = spawn('python', ['modelLLM.py', query]);

    let result = '';
    
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Error occured' });
        }
        try {
            const response = JSON.parse(result); // Parse JSON from Python output
            console.log('Python Response:', response);
            res.json(response);
        } catch (error) {
            console.error('Error parsing Python output:', error);
            res.status(500).json({ error: 'Error occured' });
        }
    });
});

// Start server on 0.0.0.0 to allow connections from emulator
app.listen(port,() => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
});
