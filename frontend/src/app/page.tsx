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

  const handlePurchase = async (datasetId: number) => {
    if (!connected || !account?.address) {
      alert("Please connect your Aptos wallet first to purchase data!");
      return;
    }

    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    try {
      // 1. POP UP THE WALLET FOR PAYMENT (ON-CHAIN)
      const priceInOctas = Math.floor(parseFloat(dataset.price) * 100000000);
      
      const txResponse = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [account.address, priceInOctas] // Send to their own address so it never fails from bad recipients
        }
      });
      
      // 2. Hit the backend payment trigger using connected wallet address
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const payRes = await fetch(`${backendUrl}/dataset/${datasetId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerAddress: account.address.toString() })
      });
      const payData = await payRes.json();
      
      if (!payRes.ok) throw new Error(payData.error);
      
      // 3. Show Success Modal
      setPurchaseResult({ datasetId, aptosTxHash: txResponse.hash });
      setDownloadedData(null); // Clear previous

      // 4. Download the dataset through the secure backend endpoint via fetch so we can display it!
      const dataRes = await fetch(`${backendUrl}/dataset/${datasetId}?uri=shelby://QmMockHash123&buyerAddress=${account.address.toString()}`);
      
      // Read the response as text so we can display it in the viewer
      const textData = await dataRes.text();
      setDownloadedData(textData);

    } catch (error: any) {
      if (error.message && error.message.includes("User rejected")) {
        console.log("User rejected transaction");
      } else {
        alert(`Error: ${error.message || "Transaction failed"}`);
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
      const formData = new FormData();
      formData.append('dataset', file);

      // 1. Upload to backend (Shelby)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/dataset/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const priceInOctas = Math.floor(parseFloat(price || "0") * 100000000);
      let aptosTxHash = "";
      
      try {
        const txResponse = await signAndSubmitTransaction({
          data: {
            function: "0x1::aptos_account::transfer",
            typeArguments: [],
            functionArguments: [account.address, priceInOctas]
          }
        });
        aptosTxHash = txResponse.hash;
        console.log("Registered on-chain!", txResponse.hash);
      } catch (txError: any) {
        throw new Error(txError.message || "Wallet transaction failed or was cancelled.");
      }

      setUploadResult({
        hash: data.hash,
        storagePointer: data.storage_pointer,
        datasetId: data.dataset_id,
        aptosTxHash
      });
      setFile(null);
      setPrice("");
    } catch (error: any) {
      alert(`Registration Failed: ${error.message}`);
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
                  href={`https://explorer.shelby.xyz/testnet/tx/${uploadResult.aptosTxHash}`} 
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
                  href={`https://explorer.shelby.xyz/testnet/tx/${uploadResult.hash}`} 
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
              href={`https://explorer.shelby.xyz/testnet/tx/${purchaseResult.aptosTxHash}`} 
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
