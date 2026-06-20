"use client";

import { createClient } from "@/utils/supabase/client";
import { Modal, Tooltip } from "@mui/material";
import { Provider } from "@supabase/supabase-js";
import Link from "next/link";
import { useState } from "react";
import { BsGoogle } from "react-icons/bs";
import { SiDiscord, SiGithub, SiRoblox, SiSpotify } from "react-icons/si";

export const providers: {
    id: Provider;
    label: string;
    icon: React.ReactNode;
    fullWidth?: boolean;
}[] = [
    {
        id: "discord",
        label: "Discord",
        icon: <SiDiscord size={22} color="#7289da" />,
    },
    {
        id: "github",
        label: "GitHub",
        icon: <SiGithub size={22} color="#000" />,
    },
    {
        id: "spotify",
        label: "Spotify",
        icon: <SiSpotify size={22} color="#1db954" />,
        fullWidth: false,
    },
    {
        id: "custom:roblox",
        label: "Roblox",
        icon: (
            <SiRoblox
                size={22}
                color="#fff"
                className="bg-[#2f5fff] p-0.5 rounded-sm"
            />
        ),
        fullWidth: false,
    },
    {
        id: "google",
        label: "Google",
        icon: <BsGoogle size={22} color="#4285F4" />,
        fullWidth: true,
    },
];

export default function SignInForm({
    open = false,
    onClose = (wasX: boolean) => {},
    help,
}: {
    open?: boolean;
    onClose?: (wasX: boolean) => void;
    help?: string;
}) {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (provider: Provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error(`Auth error (${provider}):`, error.message);
        }
    };

    const handleEmailAuth = async () => {
        setLoading(true);

        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
            }
        } catch (err: any) {
            console.error("Auth error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                onClose(false);
            }}
            className="flex"
        >
            <div className="window active mx-auto w-lg aspect-square my-auto z-30">
                <div className="title-bar">
                    <div className="title-bar-text">Sign-in</div>
                    <div className="title-bar-controls">
                        {help && (
                            <Tooltip title={help}>
                                <button aria-label="Help"></button>
                            </Tooltip>
                        )}
                        <button
                            aria-label="Close"
                            onClick={() => {
                                onClose(true);
                            }}
                        />
                    </div>
                </div>

                <div className="window-body has-space h-full flex items-center justify-center">
                    <div className="w-full mx-8 flex flex-col gap-3">
                        <h1 className="text-2xl font-semibold">
                            {loading
                                ? "Loading..."
                                : isSignup
                                  ? "Sign up"
                                  : "Sign in"}
                        </h1>

                        <div className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-2! py-1!"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-2! py-1!"
                            />

                            <button
                                onClick={handleEmailAuth}
                                disabled={loading}
                                className="w-full! py-2!"
                            >
                                {loading
                                    ? "Loading..."
                                    : isSignup
                                      ? "Sign up"
                                      : "Sign in"}
                            </button>

                            <button
                                onClick={() => setIsSignup(!isSignup)}
                                className="text-xs underline"
                            >
                                {isSignup
                                    ? "Already have an account? Sign in"
                                    : "No account? Sign up"}
                            </button>
                        </div>

                        <div className="border-t my-2"></div>

                        <label>Or use a provider:</label>

                        <div className="flex flex-wrap gap-2 justify-center w-full">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSignIn(p.id)}
                                    className={`flex items-center gap-2 py-2! px-3! ${
                                        p.fullWidth
                                            ? "w-full!"
                                            : "w-[calc(50%-0.25rem)]!"
                                    }`}
                                >
                                    {p.icon}
                                    Continue with {p.label}
                                </button>
                            ))}
                        </div>

                        <p>
                            By continuing, you agree to our{" "}
                            <Link href={"/tos+ps"}>
                                Terms of Service and Privacy Policy.
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
