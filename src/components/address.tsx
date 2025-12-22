import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;

type AddressProps = {
  onSuccess: (address: string) => void;
};

const Address = ({ onSuccess }: AddressProps) => {
  const { connect, account, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);

  // 🔑 LOGIN ONCE account is READY
  useEffect(() => {
    if (!account?.address || hasLoggedIn) return;

    const login = async () => {
      try {
        const address = account.address.toString();

        const res = await axios.post(`${backend}/api/wallet/login`, {
          address,
        });

        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("address", address);

        setHasLoggedIn(true);
        onSuccess(address);
        toast.success("Wallet connected");
      } catch (err) {
        console.error(err);
        toast.error("Wallet login failed");
      } finally {
        setLoading(false);
      }
    };

    login();
  }, [account?.address]);

  const handleConnect = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 🔥 ALWAYS connect if account not present
      if (!account?.address) {
        await connect("Petra");
      }
    } catch (err) {
      console.error(err);
      toast.error("Wallet connection failed");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      aria-busy={loading}
      className="relative text-4xl font-semibold text-white pb-2 hover:scale-105 transition disabled:opacity-60"
    >
      {loading ? "Connecting..." : "Connect to Aptos"}

      {loading && (
        <span className="absolute left-0 bottom-0 h-[2px] w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 bg-[length:200%_100%] animate-[gradient-move_1.5s_linear_infinite]" />
      )}
    </button>
  );
};

export default Address;
