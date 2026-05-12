import { Request, Response } from 'express';
import * as datasetService from '../services/dataset.service';

export const uploadDataset = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No dataset file provided' });
            return;
        }

        const { price } = req.body;
        const { datasetId, storagePointer, hash, onChainTxHash } = await datasetService.processUpload(req.file.buffer, price);
        
        res.json({
            message: onChainTxHash 
                ? 'Dataset uploaded to Shelby and registered on-chain successfully.' 
                : 'Dataset uploaded to Shelby successfully. On-chain registration pending or failed.',
            dataset_id: datasetId,
            storage_pointer: storagePointer,
            hash,
            aptos_tx_hash: onChainTxHash
        });
    } catch (error) {
        console.error('Upload controller error:', error);
        res.status(500).json({ error: 'Failed to upload dataset' });
    }
};

export const getDataset = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const uri = req.query.uri as string;

        const result = await datasetService.retrieveDataset(id, uri);
        if (!result) {
            res.status(404).json({ error: 'Dataset not found in Shelby' });
            return;
        }

        if (!result.verified) {
            res.status(409).json({ error: 'Integrity Verification Failed: Hash mismatch!' });
            return;
        }

        res.setHeader('Content-Disposition', `attachment; filename="dataset_${id}.dat"`);
        res.send(result.buffer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve dataset' });
    }
};

export const payForDataset = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { buyerAddress } = req.body;

        if (!buyerAddress) {
            res.status(400).json({ error: 'Buyer address is required' });
            return;
        }

        const txHash = await datasetService.processPayment(id, buyerAddress);

        res.json({
            message: 'Payment simulated / transaction triggered',
            access_token: txHash
        });
    } catch (error) {
        res.status(500).json({ error: 'Payment flow failed' });
    }
};

export const verifyDataset = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const uri = req.query.uri as string;

        const verification = await datasetService.verifyIntegrity(id, uri);
        if (!verification) {
            res.status(404).json({ error: 'Dataset not found' });
            return;
        }

        res.json({
            dataset_id: id,
            on_chain_hash: verification.onChainHash,
            computed_hash: verification.computedHash,
            verification_result: verification.verified
        });
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
};
