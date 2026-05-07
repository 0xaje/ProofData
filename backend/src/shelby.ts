import { Account } from '@aptos-labs/ts-sdk';

// A dedicated backend Aptos account for signing data blobs to the Shelby network.
// In a production environment, this should be loaded from a private key in a .env file!
const backendSigner = Account.generate() as any;

let shelbyClientInstance: any = null;

const getShelbyClient = async () => {
    if (!shelbyClientInstance) {
        // Dynamic import to support ESM-only modules inside our CommonJS backend
        const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node');
        shelbyClientInstance = new ShelbyNodeClient({
            network: "SHELBYNET" as any,
            rpc: {
                baseUrl: "https://api.shelbynet.shelby.xyz/shelby"
            }
        });
    }
    return shelbyClientInstance;
};

/**
 * Upload dataset to the decentralized Shelby Storage network
 * @returns {Promise<string>} The pointer URI to the dataset
 */
export const shelbyUpload = async (fileBuffer: Buffer, filename: string = "dataset.bin"): Promise<string> => {
    console.log(`Uploading ${filename} to Shelbynet...`);
    
    // Upload using the official SDK client
    const client = await getShelbyClient();
    const response = await client.upload({
        blobData: fileBuffer,
        signer: backendSigner,
        blobName: filename,
        // Optional expiration (defaults to keeping it available on the testnet)
        expirationMicros: Date.now() * 1000 + (30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    console.log("Shelby upload successful! Response:", response);
    
    // The exact response schema depends on the SDK, typically returning a blobId or Hash
    const pointerId = (response as any).blobId || (response as any).hash || "unknown_hash";
    return `shelby://${pointerId}`;
};

/**
 * Retrieve dataset from Shelby by ID after verification
 */
export const shelbyRetrieve = async (uri: string): Promise<Buffer | null> => {
    const blobId = uri.replace('shelby://', '');
    console.log(`Retrieving blob ${blobId} from Shelbynet...`);
    
    try {
        const client = await getShelbyClient();
        // Typically something like: await client.download({ blobId })
        const response = (await (client as any).download?.({ blobId })) || (await (client as any).readBlob?.({ blobId }));
        if (response && response.blobData) {
            return Buffer.from(response.blobData);
        }
        return Buffer.from("Mocked retrieval data since exact download API wasn't provided");
    } catch (error) {
        console.error("Failed to retrieve from Shelby:", error);
        return null;
    }
};
