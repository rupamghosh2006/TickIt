import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAptosWallet = () => {
    if ("aptos" in window) return (window as any).aptos;
    window.open("https://petra.app/", "_blank");
    return null;
};

export default function Login() {
    const [wallet, setWallet] = useState<any>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [logoutOpen, setLogoutOpen] = useState(false);

    // 🔁 Restore session on page load
    useEffect(() => {
        const w = getAptosWallet();
        if (!w) return;

        setWallet(w);

        const savedAddress = localStorage.getItem("walletAddress");

        w.isConnected().then(async (isConnected: boolean) => {
            if (isConnected) {
                const acc = await w.account();
                setAccount(acc.address);
                localStorage.setItem("walletAddress", acc.address);
            } else if (savedAddress) {
                // UI restore only (wallet will reconnect on user action)
                setAccount(savedAddress);
            }
        });

        // 🔄 Listen for account changes
        if (w.onAccountChange) {
            w.onAccountChange((acc: any) => {
                if (acc?.address) {
                    setAccount(acc.address);
                    localStorage.setItem("walletAddress", acc.address);
                } else {
                    setAccount(null);
                    localStorage.removeItem("walletAddress");
                }
            });
        }
    }, []);

    // 🔐 Connect wallet
    const handleLogin = async () => {
        const w = getAptosWallet();
        if (!w) return;

        try {
            await w.connect();
            const acc = await w.account();

            setWallet(w);
            setAccount(acc.address);

            // ✅ Persist wallet address
            localStorage.setItem("walletAddress", acc.address);

            // Optional: send to backend
            await fetch(`${BACKEND_URL}/walletID`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: acc.address }),
            });
        } catch (e) {
            console.error("Wallet connection rejected:", e);
        }
    };

    // 🚪 Logout
    const handleLogout = async () => {
        if (!wallet) return;

        try {
            await wallet.disconnect();
        } catch {}

        localStorage.removeItem("walletAddress");
        setAccount(null);
        setLogoutOpen(false);
    };

    // 🔓 Not logged in
    if (!account) {
        return (
            <Button
                onClick={handleLogin}
                className="bg-white text-black dark:bg-black dark:text-white hover:opacity-80"
            >
                Login with Petra
            </Button>
        );
    }

    // 🔐 Logged in
    return (
        <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-black dark:bg-black dark:text-white">
                    {account.slice(0, 6)}...{account.slice(-4)}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Logout?</DialogTitle>
                </DialogHeader>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="secondary"
                        onClick={() => setLogoutOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
