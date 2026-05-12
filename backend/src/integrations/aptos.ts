import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const aptosConfig = new AptosConfig({ 
    network: (process.env.NETWORK as Network) || Network.CUSTOM,
    fullnode: process.env.FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1",
});
export const aptos = new Aptos(aptosConfig);

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xedb90d56ac0bc2553b546f4c4ca433bd1d8c58ceb1fc51314a74cefed867edff';

export const verifyPaymentEvent = async (datasetId: string, buyerAddress: string): Promise<boolean> => {
    try {
        console.log(`Verifying payment for dataset: ${datasetId}, buyer: ${buyerAddress}`);
        
        // Verify by checking transactions from the buyer's account that call pay_and_access
        const transactions = await (aptos as any).getAccountTransactions({
            accountAddress: buyerAddress,
            options: { limit: 25 }
        });
        
        console.log(`Found ${transactions.length} transactions for buyer`);

        const hasPaid = transactions.some((tx: any) => {
            if (!tx.payload) return false;
            const fnId: string = tx.payload.function || '';
            const args: any[] = tx.payload.arguments || [];
            
            console.log(`Checking TX: ${fnId}, Args: ${JSON.stringify(args)}`);
            
            const isPayAndAccess = fnId === `${CONTRACT_ADDRESS}::dataset_registry::pay_and_access`;
            const matchesDataset = args.length > 0 && args[0] === datasetId;
            const txSuccess = tx.success === true;
            
            return isPayAndAccess && matchesDataset && txSuccess;
        });

        if (hasPaid) {
            console.log(`Payment verified for ${buyerAddress} on dataset ${datasetId}`);
        } else {
            console.log(`Payment NOT found for ${buyerAddress} on dataset ${datasetId}`);
        }

        return hasPaid;
    } catch (error) {
        console.error('Error verifying payment:', error);
        return false;
    }
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
