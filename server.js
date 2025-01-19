import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { query } from './db/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// Serve the Whop data endpoint
app.get('/api/whop-data', async (req, res) => {
    try {
        const result = await query(`
            SELECT platform_metrics, top_communities 
            FROM whop_data 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        const whopData = result.rows[0] || { platform_metrics: {}, top_communities: [] };
        res.json(whopData);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to load Whop data',
            details: error.message 
        });
    }
});

// Add new scraping endpoint
app.post('/api/scrape', async (req, res) => {
    try {
        const pythonProcess = spawn('python', ['process_revenue_data.py']);
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                res.status(500).json({ success: false, error: 'Scraping failed' });
                return;
            }
            res.json({ success: true, message: 'Data updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: 'Failed to start scraping',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;  // Changed from 3000 to 4000
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});
