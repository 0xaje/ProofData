import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(__dirname, '../../shelby_storage');

if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const uploadDataset = async (fileBuffer: Buffer, hash: string): Promise<string> => {
    // Generate a CID (Content Identifier) based on the file content hash
    const cid = `Qm${hash.substring(0, 44)}`; // Mock IPFS-like CID format
    
    // Store the dataset using the CID as the reference
    const filePath = path.join(STORAGE_DIR, cid);
    fs.writeFileSync(filePath, fileBuffer);
    
    // Return the dataset reference (CID / pointer)
    return `shelby://${cid}`;
};

export const fetchDataset = async (pointer: string): Promise<Buffer | null> => {
    // Extract CID from the shelby pointer
    const cid = pointer.replace('shelby://', '');
    const filePath = path.join(STORAGE_DIR, cid);
    
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    }
    return null;
};
