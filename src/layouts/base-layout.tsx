import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { Outlet, Navigate, useLocation } from "react-router";
import { Toaster } from "sonner";

const wallets = [new PetraWallet()];

export default function BaseLayout() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // If user is logged in and tries to go to login or home
  if (token && (location.pathname === "/" || location.pathname === "/login")) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is NOT logged in and tries dashboard
  if (!token && location.pathname === "/dashboard") {
    return <Navigate to="/login" replace />;
  }

  return (
    <AptosWalletAdapterProvider autoConnect={false} >
      <Toaster />
      <Outlet />
    </AptosWalletAdapterProvider>
  );
}
