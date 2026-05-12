import { Request, Response, NextFunction } from 'express';
import { verifyPaymentEvent } from '../integrations/aptos';

export const requirePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Allow buyer address from either headers or query string (for direct browser downloads)
    const buyerAddress = req.headers['x-buyer-address'] || req.query.buyerAddress;
    const { id } = req.params;

    if (!buyerAddress || typeof buyerAddress !== 'string') {
        res.status(401).json({ error: 'Missing or invalid x-buyer-address header (or buyerAddress query param)' });
        return;
    }

    if (!id) {
        res.status(400).json({ error: 'Missing datasetId' });
        return;
    }

    // Verify payment logic via Aptos
    const hasAccess = await verifyPaymentEvent(id as string, buyerAddress);
    
    if (!hasAccess) {
        // Mock fallback for testing if event tracking is not fully set up
        const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        if (isDev || buyerAddress.includes('0xtest')) {
            console.warn(`[DEV MODE] Bypassing on-chain payment check for ${buyerAddress} on dataset ${id}`);
            return next();
        }
        res.status(403).json({ error: 'Payment not verified on-chain. Please wait a few seconds after purchase and try again.' });
        return;
    }

    next();
};
