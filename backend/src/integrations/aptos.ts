import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const aptosConfig = new AptosConfig({ 
    network: (process.env.NETWORK as Network) || Network.CUSTOM,
    fullnode: process.env.FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1",
});
export const aptos = new Aptos(aptosConfig);

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xedb90d56ac0bc2553b546f4c4ca433bd1d8c58ceb1fc51314a74cefed867edff';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export const registerDatasetOnChain = async (id: string, storagePointer: string, hash: string, price: string): Promise<string> => {
    if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not set in backend environment");

    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    // Convert hex hash to byte array
    const hashHex = hash.startsWith('0x') ? hash.substring(2) : hash;
    const hashBytes = hashHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];

    try {
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${CONTRACT_ADDRESS}::dataset_registry::register_dataset`,
                functionArguments: [id, storagePointer, new Uint8Array(hashBytes), price],
            },
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        return response.hash;
    } catch (error: any) {
        console.error('Error registering dataset on-chain:', error.message);
        throw error;
    }
};

export const verifyPaymentEvent = async (datasetId: string, buyerAddress: string): Promise<boolean> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Verifying payment (Attempt ${attempt}/${MAX_RETRIES}) for dataset: ${datasetId}, buyer: ${buyerAddress}`);
            
            // Fetch recent transactions for the buyer
            const transactions = await aptos.getAccountTransactions({
                accountAddress: buyerAddress,
            });
            
            console.log(`Found ${transactions.length} transactions for buyer ${buyerAddress}`);

            const hasPaid = transactions.some((tx: any) => {
                if (!tx.payload || !('function' in tx.payload)) return false;
                
                const fnId: string = tx.payload.function;
                const args: any[] = tx.payload.arguments || [];
                
                const isPayAndAccess = fnId === `${CONTRACT_ADDRESS}::dataset_registry::pay_and_access`;
                // Compare IDs as strings to handle both numbers and strings robustly
                const matchesDataset = args.length > 0 && args[0].toString() === datasetId.toString();
                const txSuccess = tx.success === true;
                
                if (isPayAndAccess && matchesDataset) {
                    console.log(`Matching transaction found! Success: ${txSuccess}`);
                }
                
                return isPayAndAccess && matchesDataset && txSuccess;
            });

            if (hasPaid) {
                console.log(`Payment verified for ${buyerAddress} on dataset ${datasetId}`);
                return true;
            }

            if (attempt < MAX_RETRIES) {
                console.log(`Payment not found yet, retrying in ${RETRY_DELAY_MS}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        } catch (error) {
            console.error(`Error in verifyPaymentEvent (Attempt ${attempt}):`, error);
        }
    }

    console.log(`Payment NOT found for ${buyerAddress} on dataset ${datasetId} after ${MAX_RETRIES} attempts.`);
    return false;
};

export const fetchDatasetOnChainInfo = async (datasetId: string): Promise<{ owner: string, storagePointer: string, hash: string, price: string, version: string } | null> => {
    try {
        const payload = {
            function: `${CONTRACT_ADDRESS}::dataset_registry::get_dataset_info` as `${string}::${string}::${string}`,
            typeArguments: [],
            functionArguments: [datasetId] as any[]
        };
        const result = await aptos.view({ payload });
        const [owner, storage_pointer, hashBytes, price, version] = result as any[];
        
        let hashStr = "";
        if (typeof hashBytes === 'string') {
            hashStr = hashBytes.startsWith('0x') ? hashBytes.substring(2) : hashBytes;
        } else if (Array.isArray(hashBytes)) {
            hashStr = Buffer.from(hashBytes).toString('hex');
        }

        return {
            owner: owner.toString(),
            storagePointer: storage_pointer.toString(),
            hash: hashStr,
            price: price.toString(),
            version: version.toString()
        };
    } catch (error) {
        console.error('Error fetching on-chain info:', error);
        return null;
    }
};

export const fetchDatasetOnChainHash = async (datasetId: string): Promise<string | null> => {
    const info = await fetchDatasetOnChainInfo(datasetId);
    return info ? info.hash : null;
};

export const triggerMockAptosPayment = async (datasetId: string, buyerAddress: string) => {
    // This mocks the pay_and_access function on chain for the simplified MVP flow
    return `mock_tx_hash_${Date.now()}`;
};
