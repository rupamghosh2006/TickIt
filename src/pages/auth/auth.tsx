import { useEffect, useState } from "react";
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

/* ---------- localStorage helper ---------- */
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

/* ================= AUTH PAGE ================= */
export default function Auth() {
    const navigate = useNavigate();

    const [address, setAddress] = useState<string | null>(ls.get("address"));
    const [email, setEmail] = useState<string | null>(ls.get("email"));
    const [name, setName] = useState<string | null>(ls.get("name"));
    const [verified, setVerified] = useState<boolean>(Boolean(ls.get("verified")));

    useEffect(() => {
        if (address && email && name && verified) {
            navigate("/dashboard");
        }
    }, [address, email, name, verified, navigate]);

    return (
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
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

            <div className="
                w-[95vw] max-w-xl min-h-[26rem]
                p-8 bg-stone-800/95 backdrop-blur-xl
                border border-stone-700/60 rounded-xl shadow-2xl
                flex flex-col items-center justify-center
            ">
                {!address && (
                    <Address
                        onSuccess={(a: string) => {
                            ls.set("address", a);
                            setAddress(a);
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
                    <OtpAndName
                        onDone={(n: string) => {
                            ls.set("name", n);
                            ls.set("verified", true);
                            setName(n);
                            setVerified(true);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

/* ================= OTP + NAME ================= */
function OtpAndName({ onDone }: { onDone: (name: string) => void }) {
    const [step, setStep] = useState<"otp" | "name">("name");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");

    const token = ls.get("token");
    const email = ls.get("email");

    const submit = async () => {
        if (!token) {
            toast.error("Session expired");
            location.reload();
            return;
        }

        try {
            await axios.post(
                `${backend}/api/verify`,
                { email, otp, userName: name },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Verified");
            onDone(name);
        } catch (e) {
            console.error(e);
            toast.error("Verification failed");
        }
    };

    return (
        <div className="space-y-6 w-full">
            {step === "otp" && (
                <>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <InputOTPSlot key={i} index={i} />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>

                    <Button
                        className="w-full"
                        disabled={otp.length !== 6}
                        onClick={submit}
                    >
                        Verify
                    </Button>
                </>
            )}

            {step === "name" && (
                <>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Name"
                    />
                    <Button
                        className="w-full"
                        disabled={!name}
                        onClick={() => setStep("otp")}
                    >
                        Continue
                    </Button>
                </>
            )}
        </div>
    );
}

/* ================= EMAIL ================= */
function Email({ onSuccess }: { onSuccess: (e: string) => void }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const token = ls.get("token");

    const submit = async () => {
        if (!email || !email.includes("@")) {
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
        } catch (e) {
            console.error(e);
            toast.error("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                disabled={loading}
            />
            <Button
                onClick={submit}
                disabled={loading}
                variant="outline"
                className="text-black"
            >
                {loading ? "Sending..." : "Continue"}
            </Button>
        </div>
    );
}
