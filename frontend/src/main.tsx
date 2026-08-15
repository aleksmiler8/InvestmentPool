import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";
import "./i18n";

import { WalletProvider } from "./wallet";
import { bootstrapLiquidity } from "./bootstrap/liquidity";
bootstrapLiquidity().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <App />
    </WalletProvider>
  </React.StrictMode>
);