import 'dotenv/config';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xedb90d56ac0bc2553b546f4c4ca433bd1d8c58ceb1fc51314a74cefed867edff";
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY environment variable is not set");
    process.exit(1);
}

const config = new AptosConfig({ 
    network: (process.env.NETWORK as Network) || Network.CUSTOM,
    fullnode: process.env.FULLNODE_URL || "https://api.shelbynet.shelby.xyz/v1"
});
const aptos = new Aptos(config);

async function initialize() {
    console.log("Checking if registry needs initialization...");
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    try {
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${CONTRACT_ADDRESS}::dataset_registry::initialize`,
                functionArguments: [],
            },
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        console.log("Registry initialized!");
    } catch (e: any) {
        if (e.message.includes("ALREADY_INITIALIZED") || e.message.includes("E_ALREADY_INITIALIZED")) {
            console.log("Registry already initialized.");
        } else {
            throw e;
        }
    }
}

async function register(id: string, pointer: string, price: number) {
    console.log(`Registering dataset ${id}...`);
    const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    try {
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${CONTRACT_ADDRESS}::dataset_registry::register_dataset`,
                functionArguments: [
                    id,
                    pointer,
                    new Uint8Array([1, 2, 3, 4]), // Dummy hash bytes
                    price
                ],
            },
        });

        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
        const response = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        console.log(`Dataset ${id} registered! Hash: ${response.hash}`);
    } catch (e: any) {
        if (e.message.includes("DATASET_ALREADY_EXISTS") || e.message.includes("E_DATASET_ALREADY_EXISTS")) {
            console.log(`Dataset ${id} already exists.`);
        } else {
            throw e;
        }
    }
}

async function main() {
    try {
        await initialize();
        await register("1", "shelby://featured_1", 15000000);
        await register("2", "shelby://featured_2", 5000000);
        await register("3", "shelby://featured_3", 25000000);
        console.log("All featured datasets registration complete!");
    } catch (e: any) {
        console.error("Failed to register:", e.message);
        if (e.message.includes("Module not found")) {
            console.error("CRITICAL: The smart contract is not deployed at " + CONTRACT_ADDRESS);
        }
    }
}

main();
