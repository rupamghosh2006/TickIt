import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MeshGradient } from "@paper-design/shaders-react";
import axios from "axios";
import { toast } from "sonner";

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "../../components/ui/input-otp";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
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
    const [email, setEmail] = useState<string | null>(ls.get("email"));
    const [verified, setVerified] = useState<boolean>(ls.get("verified") === true);

    useEffect(() => {
        if (address && email && verified) {
            navigate("/dashboard");
        }
    }, [address, email, verified, navigate]);

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

                {address && !email && (
                    <Email
                        onSuccess={(e: string) => {
                            ls.set("email", e);
                            setEmail(e);
                        }}
                    />
                )}

                {address && email && !verified && (
                    <SendOTP
                        onVerified={() => {
                            ls.set("verified", true);
                            setVerified(true);
                            toast.success("Verification successful");
                            navigate("/dashboard");
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function SendOTP({ onVerified }: { onVerified: () => void }) {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const firstSlotRef = useRef<HTMLDivElement | null>(null);

    const token = ls.get("token");
    const email = ls.get("email");

    useEffect(() => {
        requestAnimationFrame(() => {
            firstSlotRef.current?.querySelector("input")?.focus();
        });
    }, []);

    const submit = async (v: string) => {
        if (loading) return;

        if (!token) {
            toast.error("Session expired");
            location.reload();
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                `${backend}/api/user/verify-otp`,
                { email, otp: v },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onVerified();
        } catch {
            toast.error("OTP verification failed");
            setOtp("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold text-white">
                    Verify your email
                </h2>
                <p className="text-sm text-stone-400">
                    Enter the 6-digit code sent to your email
                </p>
            </div>

            <InputOTP
                maxLength={6}
                value={otp}
                onChange={(v) => {
                    setOtp(v);
                    if (v.length === 6) submit(v);
                }}
                disabled={loading}
            >
                <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                            key={i}
                            index={i}
                            ref={i === 0 ? firstSlotRef : undefined}
                        />
                    ))}
                </InputOTPGroup>
            </InputOTP>
        </div>
    );
}

function Email({ onSuccess }: { onSuccess: (e: string) => void }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const token = ls.get("token");

    const submit = async () => {
        if (!email.includes("@")) {
            toast.error("Invalid email");
            return;
        }

        if (!token) {
            toast.error("Session expired");
            location.reload();
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                `${backend}/api/user/send-otp`,
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("OTP sent");
            onSuccess(email);
        } catch {
            toast.error("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold text-white">
                    Continue with email
                </h2>
                <p className="text-sm text-stone-400">
                    We’ll send you a one-time verification code
                </p>
            </div>

            <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={loading}
            />

            <Button
                onClick={submit}
                disabled={loading}
                variant="outline"
                className="text-black"
            >
                {loading ? "Sending..." : "Send OTP"}
            </Button>
        </div>
    );
}
