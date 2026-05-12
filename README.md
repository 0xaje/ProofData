# ProofData

ProofData is a decentralized platform for registering, purchasing, and verifying datasets. It leverages the **Shelby Protocol** for storage and the **Aptos Blockchain** (on Shelbynet) for immutable registry and payment verification.

## Features

- **On-Chain Registry**: Datasets are registered on the Aptos blockchain with unique IDs, storage pointers, and content hashes.
- **Verifiable Integrity**: Automatic verification of dataset integrity by comparing fetched data against on-chain hashes.
- **Secure Payments**: Integration with Shelbynet for seamless dataset access and monetization.
- **Featured Datasets**: Curated datasets pre-registered for immediate use.

## Architecture

- **Frontend**: Next.js application providing a sleek UI for browsing and purchasing datasets.
- **Backend**: Node.js/Express service handling file processing, Shelby integration, and Aptos event monitoring.
- **Smart Contracts**: Move-based registry contract deployed on Shelbynet.
- **Storage**: Shelby Protocol for decentralized data availability.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Aptos CLI (for contract deployment)

### Backend Setup

1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PRIVATE_KEY=your_private_key
   CONTRACT_ADDRESS=your_contract_address
   PORT=3001
   NETWORK=custom
   FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Smart Contract Deployment

1. Navigate to the `standalone` or `contracts` directory.
2. Compile the contract:
   ```bash
   aptos move compile
   ```
3. Publish to Shelbynet:
   ```bash
   aptos move publish
   ```

## Development

To register the initial featured datasets, use the provided script:
```bash
cd backend
npx ts-node src/scripts/register_featured.ts
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.