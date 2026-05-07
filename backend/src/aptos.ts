import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Configure Aptos Client (we assume Testnet for now)
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
export const aptos = new Aptos(aptosConfig);

// The address where your ProofData contract is deployed
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x123'; // Replace with real deployment address

export const verifyPayment = async (datasetId: string, buyerAddress: string): Promise<boolean> => {
    try {
        // In a real implementation, we would query the specific AccessEvent emitted by the contract.
        // For simplicity, we fetch events for the given contract address and filter.
        
        const events = await (aptos as any).getAccountEventsByEventType({
            accountAddress: CONTRACT_ADDRESS,
            eventType: `${CONTRACT_ADDRESS}::dataset_registry::AccessLog`,
        });
        
        // Let's assume we search for an event matching datasetId and buyerAddress
        const hasPaid = events.some((e: any) => 
            e.data.dataset_id === datasetId && 
            e.data.buyer === buyerAddress
        );

        return hasPaid;
    } catch (error) {
        console.error('Error verifying payment:', error);
        return false;
    }
};
