import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWalletProvider } from "../components/AptosWalletProvider";
import WalletConnectButton from "../components/WalletConnectButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofData | Decentralized Data Marketplace",
  description: "Secure, on-chain data marketplace built on Aptos and Shelby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWalletProvider>
          <div className="container">
            <header className="header">
              <div className="nav-logo">
                <span className="gradient-text">Proof</span>Data
              </div>
              <nav>
                <WalletConnectButton />
              </nav>
            </header>
            {children}
          </div>
        </AppWalletProvider>
      </body>
    </html>
  );
}
