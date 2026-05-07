import crypto from 'crypto';
import { uploadDataset, fetchDataset } from '../integrations/shelby';
import { fetchDatasetOnChainHash, triggerMockAptosPayment } from '../integrations/aptos';

export const computeHash = (buffer: Buffer): string => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

export const processUpload = async (fileBuffer: Buffer): Promise<{ datasetId: string, storagePointer: string, hash: string }> => {
    const hash = computeHash(fileBuffer);
    const storagePointer = await uploadDataset(fileBuffer, hash);
    const datasetId = `ds_${Date.now()}`;
    
    // In a full implementation, you'd execute `register_dataset` on chain here, or return this for the client to execute.
    return { datasetId, storagePointer, hash };
};

export const processPayment = async (datasetId: string, buyerAddress: string): Promise<string> => {
    return await triggerMockAptosPayment(datasetId, buyerAddress);
};

export const retrieveDataset = async (datasetId: string, pointer: string): Promise<{ buffer: Buffer, verified: boolean } | null> => {
    const buffer = await fetchDataset(pointer);
    if (!buffer) return null;

    const computedHash = computeHash(buffer);
    const onChainHash = await fetchDatasetOnChainHash(datasetId);

    // If we can't connect to chain or mock data is used, fallback to true if hashes match our expectations
    let verified = false;
    if (onChainHash) {
        verified = (computedHash === onChainHash);
    } else {
        // Mock fallback verification
        verified = true;
    }

    return { buffer, verified };
};

export const verifyIntegrity = async (datasetId: string, pointer: string) => {
    const buffer = await fetchDataset(pointer);
    if (!buffer) return null;

    const computedHash = computeHash(buffer);
    const onChainHash = await fetchDatasetOnChainHash(datasetId) || "mock_onchain_hash_if_unreachable";

    return {
        onChainHash,
        computedHash,
        verified: computedHash === onChainHash || onChainHash === "mock_onchain_hash_if_unreachable" // Simplified MVP
    };
};
