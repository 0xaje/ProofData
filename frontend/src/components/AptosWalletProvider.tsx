"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren, useEffect, useState } from "react";

export function AppWalletProvider({ children }: PropsWithChildren) {
  const [autoConnect, setAutoConnect] = useState(false);

  useEffect(() => {
    setAutoConnect(true);
  }, []);

  return (
    <AptosWalletAdapterProvider autoConnect={autoConnect}>
      {children}
    </AptosWalletAdapterProvider>
  );
}
