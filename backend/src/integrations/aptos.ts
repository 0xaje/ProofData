import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const aptosConfig = new AptosConfig({ 
    network: Network.CUSTOM,
    fullnode: "https://api.shelbynet.shelby.xyz/v1",
    indexer: "https://api.shelbynet.shelby.xyz/v1/graphql"
});
export const aptos = new Aptos(aptosConfig);

export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xedb90d56ac0bc2553b546f4c4ca433bd1d8c58ceb1fc51314a74cefed867edff';

export const verifyPaymentEvent = async (datasetId: string, buyerAddress: string): Promise<boolean> => {
    try {
        const events = await (aptos as any).getAccountEventsByEventType({
            accountAddress: CONTRACT_ADDRESS,
            eventType: `${CONTRACT_ADDRESS}::dataset_registry::DatasetAccessed`,
        });
        
        const hasPaid = events.some((e: any) => 
            e.data.dataset_id === datasetId && 
            e.data.user === buyerAddress
        );

        return hasPaid;
    } catch (error) {
        console.error('Error verifying payment:', error);
        return false;
    }
};

export const fetchDatasetOnChainHash = async (datasetId: string): Promise<string | null> => {
    try {
        const payload = {
            function: `${CONTRACT_ADDRESS}::dataset_registry::get_dataset_info`,
            type_arguments: [],
            arguments: [datasetId]
        };
        const [owner, storage_pointer, hashBytes, price, version] = await (aptos as any).view(payload);
        
        // Convert hashBytes (vector<u8>) to hex string
        return Buffer.from(hashBytes.substring(2), 'hex').toString('hex');
    } catch (error) {
        console.error('Error fetching on-chain hash:', error);
        return null;
    }
};

export const triggerMockAptosPayment = async (datasetId: string, buyerAddress: string) => {
    // This mocks the pay_and_access function on chain for the simplified MVP flow
    return `mock_tx_hash_${Date.now()}`;
};
