"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useRef, useEffect } from "react";

export default function WalletConnectButton() {
  const { account, connected, connect, disconnect, wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = async () => {
    try {
      if (wallets && wallets.length > 0) {
        // Connect to the first available wallet
        await connect(wallets[0].name);
      } else {
        // If no wallet is found, redirect user to download it
        if (window.confirm("No Aptos wallet detected. Would you like to install Petra Wallet?")) {
          window.open("https://petra.app/", "_blank");
        }
      }
    } catch (e) {
      console.error("Wallet connection failed:", e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (e) {
      console.warn("Wallet disconnect warning:", e);
    }
    setIsOpen(false);
  };

  if (connected && account && account.address) {
    // In newer Aptos SDK versions, address might be an object that requires .toString()
    const addressStr = account.address.toString();
    
    return (
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {addressStr.slice(0, 6)}...{addressStr.slice(-4)}
        </button>

        {isOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "8px",
            minWidth: "120px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            zIndex: 50,
          }}>
            <button 
              onClick={handleDisconnect}
              style={{
                width: "100%",
                padding: "8px 12px",
                backgroundColor: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button className="btn btn-secondary" onClick={handleConnect}>
      Connect Wallet
    </button>
  );
}
