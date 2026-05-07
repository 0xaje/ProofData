import express from 'express';
import cors from 'cors';
import datasetRoutes from './routes/dataset.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Main API Router
app.use('/dataset', datasetRoutes);

// --- Simple REST API standard responses ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ProofData API Layer 2 is running (Modular Architecture)' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`ProofData Backend Layer 2 running on port ${PORT}`);
});
