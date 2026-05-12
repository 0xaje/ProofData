"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

// In a real app, this would be your published contract address
const MODULE_ADDRESS = "0xedb90d56ac0bc2553b546f4c4ca433bd1d8c58ceb1fc51314a74cefed867edff";

export default function Home() {
  const { account, connected, signAndSubmitTransaction, network } = useWallet();
  const [isRegistering, setIsRegistering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<{hash: string, storagePointer: string, datasetId: string, aptosTxHash: string} | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{datasetId: number, aptosTxHash: string} | null>(null);
  const [downloadedData, setDownloadedData] = useState<string | null>(null);

  const [datasets] = useState([
    {
      id: 1,
      title: "DeFi Protocol Metrics 2026",
      desc: "Aggregated TVL, volume, and active user metrics across top 50 protocols.",
      price: "0.15", // Reduced price so a standard Devnet wallet can afford it!
      owner: "0x456...abc"
    },
    {
      id: 2,
      title: "ZK Rollup Benchmarks",
      desc: "Performance and cost analysis of major ZK rollups vs optimistic rollups.",
      price: "0.05",
      owner: "0x789...def"
    },
    {
      id: 3,
      title: "Web3 User Demographics",
      desc: "Anonymized global adoption rates and wallet activity analysis.",
      price: "0.25",
      owner: "0x123...ghi"
    }
  ]);

  const handlePurchase = async (datasetId: number | string) => {
    if (!connected || !account?.address) {
      alert("Please connect your Aptos wallet first to purchase data!");
      return;
    }

    const dataset = datasets.find(d => d.id === datasetId);
    // For featured datasets, we use their mock ID, for newly registered ones we use their returned ID
    const effectiveId = dataset ? dataset.id.toString() : datasetId.toString();
    
    try {
      // 1. CALL THE SMART CONTRACT TO PAY AND ACCESS
      console.log(`Purchasing dataset ${effectiveId} via contract...`);
      
      const txResponse = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::dataset_registry::pay_and_access`,
          typeArguments: [],
          functionArguments: [effectiveId]
        }
      });
      
      // Ensure the hash has the 0x prefix
      const aptosTxHash = txResponse.hash.startsWith("0x") ? txResponse.hash : `0x${txResponse.hash}`;
      
      // 2. Hit the backend payment trigger using connected wallet address
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const payRes = await fetch(`${backendUrl}/dataset/${effectiveId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerAddress: account.address.toString() })
      });
      const payData = await payRes.json();
      
      if (!payRes.ok) throw new Error(payData.error || "Backend payment processing failed.");
      
      // 3. Show Success Modal
      setPurchaseResult({ datasetId: Number(effectiveId) || 0, aptosTxHash });
      setDownloadedData(null);

      // 4. Download the dataset
      const dataRes = await fetch(`${backendUrl}/dataset/${effectiveId}?buyerAddress=${account.address.toString()}`);
      
      if (!dataRes.ok) {
        const errText = await dataRes.text();
        throw new Error(errText || "Failed to download dataset contents.");
      }

      const textData = await dataRes.text();
      setDownloadedData(textData);

    } catch (error: any) {
      if (error.message && error.message.includes("User rejected")) {
        console.log("User rejected transaction");
      } else {
        let errorMsg = error.message || "Transaction failed";
        if (errorMsg.includes("E_DATASET_NOT_FOUND")) {
          errorMsg = "This dataset is not yet registered on the blockchain. Please register a dataset first using the 'Register Data' button!";
        }
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !account?.address) {
      alert("Please connect your Aptos wallet first to register data!");
      return;
    }
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    try {
      const priceInOctas = Math.floor(parseFloat(price || "0") * 100000000);
      
      const formData = new FormData();
      formData.append('dataset', file);
      formData.append('price', priceInOctas.toString());

      // 1. Upload & Register (Backend now handles both)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/dataset/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadResult({
        hash: data.hash,
        storagePointer: data.storage_pointer,
        datasetId: data.dataset_id,
        aptosTxHash: data.aptos_tx_hash || "Registration pending"
      });
      setFile(null);
      setPrice("");
    } catch (error: any) {
      console.error("Registration failed:", error);
      alert(`Registration Failed: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #34D399, #3B82F6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            ProofData Marketplace
          </h1>
          <p style={{ color: '#9CA3AF', marginTop: '0.5rem' }}>Decentralized Data Monetization on Aptos & Shelby</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Cancel' : 'Register Data'}
          </button>
        </div>
      </header>

      {isRegistering && (
        <section style={{ maxWidth: '600px', margin: '0 auto 3rem', padding: '2rem', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #374151' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Register New Dataset</h2>
          
          {uploadResult ? (
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ color: '#34D399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Upload & On-Chain Registration Successful!
              </h3>
              
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                <p style={{ color: '#9CA3AF', marginBottom: '0.2rem' }}>Aptos Transaction Hash (Real On-Chain):</p>
                <a 
                  href={`https://explorer.shelby.xyz/testnet/txn/${uploadResult.aptosTxHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#34D399', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 'bold' }}
                >
                  {uploadResult.aptosTxHash} ↗
                </a>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                <p style={{ color: '#9CA3AF', marginBottom: '0.2rem' }}>Shelby Storage Transaction Hash:</p>
                <a 
                  href={`https://explorer.shelby.xyz/testnet/txn/${uploadResult.hash.startsWith('0x') ? uploadResult.hash : '0x' + uploadResult.hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#60A5FA', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  {uploadResult.hash} ↗
                </a>
              </div>
              
              <button 
                className="btn" 
                style={{ width: '100%', marginTop: '0.5rem', backgroundColor: '#059669', borderColor: '#059669' }} 
                onClick={() => {
                  setUploadResult(null);
                  setIsRegistering(false);
                }}
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF' }}>Upload File (CSV, JSON, etc)</label>
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1F2937', color: 'white', borderRadius: '6px', border: '1px solid #374151' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9CA3AF' }}>Dataset Price (APT)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 0.15"
                  style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1F2937', color: 'white', borderRadius: '6px', border: '1px solid #374151' }}
                />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>
                Upload to Shelby & Register On-Chain
              </button>
            </form>
          )}
        </section>
      )}

      {purchaseResult && (
        <section style={{ maxWidth: '800px', margin: '0 auto 3rem', padding: '2rem', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #10B981' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#34D399' }}>✅ Purchase Verified!</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>Your Aptos payment was confirmed and the dataset has been retrieved from Shelby.</p>
          
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <p style={{ color: '#9CA3AF', marginBottom: '0.2rem' }}>Aptos Payment Hash (Real On-Chain):</p>
            <a 
              href={`https://explorer.shelby.xyz/testnet/txn/${purchaseResult.aptosTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#34D399', textDecoration: 'underline', wordBreak: 'break-all', fontWeight: 'bold' }}
            >
              {purchaseResult.aptosTxHash} ↗
            </a>
          </div>

          <div style={{ backgroundColor: '#1F2937', padding: '1rem', borderRadius: '8px', border: '1px solid #374151' }}>
            <h3 style={{ color: '#E5E7EB', marginBottom: '0.5rem' }}>Dataset Viewer</h3>
            {downloadedData ? (
              <textarea 
                readOnly 
                value={downloadedData} 
                style={{ width: '100%', height: '200px', backgroundColor: '#000', color: '#10B981', padding: '1rem', borderRadius: '6px', border: '1px solid #374151', fontFamily: 'monospace', fontSize: '0.85rem' }} 
              />
            ) : (
              <p style={{ color: '#9CA3AF' }}>Loading dataset contents from Shelby...</p>
            )}
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#374151', borderColor: '#374151' }} 
            onClick={() => {
              setPurchaseResult(null);
              setDownloadedData(null);
            }}
          >
            Close Viewer
          </button>
        </section>
      )}

      <section id="explore">
        <h2 style={{ fontSize: '2rem', marginTop: '2rem' }}>Featured Datasets</h2>
        <div className="datasets-grid">
          {datasets.map((dataset) => (
            <div className="dataset-card" key={dataset.id}>
              <h3 className="card-title">{dataset.title}</h3>
              <p className="card-desc">{dataset.desc}</p>
              
              <div className="card-footer">
                <div className="price-tag">
                  <span className="price-symbol">◎</span> {dataset.price}
                </div>
                <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => handlePurchase(dataset.id)}>
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
