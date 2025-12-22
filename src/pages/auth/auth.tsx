import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshGradient } from "@paper-design/shaders-react";
import axios from "axios";
import { toast } from "sonner";

import Address from "../../components/address";

const backend = import.meta.env.VITE_PUBLIC_BACKEND_URL;

const ls = {
    get: (k: string) => {
        try {
            return JSON.parse(localStorage.getItem(k) || "null");
        } catch {
            return localStorage.getItem(k);
        }
    },
    set: (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v)),
};

export default function Auth() {
    const navigate = useNavigate();

    const [address, setAddress] = useState<string | null>(ls.get("address"));

    useEffect(() => {
        if (address) {
            navigate("/dashboard");
        }
    }, [address, navigate]);

    return (
        <div className="relative h-screen flex items-center justify-center overflow-hidden text-white">
            <MeshGradient
                width="100%"
                height="100%"
                colors={["#bdbdbd", "#0d0d0d"]}
                distortion={1}
                swirl={0.1}
                speed={1}
                rotation={90}
                className="absolute inset-0 -z-10"
            />

            <div className="w-[95vw] max-w-xl min-h-[26rem] p-8 bg-stone-800/95 backdrop-blur-xl border border-stone-700/60 rounded-xl shadow-2xl flex items-center justify-center">
                {!address && (
                    <Address
                        onSuccess={(a: string) => {
                            ls.set("address", a);
                            setAddress(a);
                            toast.success("Wallet connected");
                        }}
                    />
                )}
            </div>
        </div>
    );
}