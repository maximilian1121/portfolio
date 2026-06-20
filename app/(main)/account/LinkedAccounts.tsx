"use client";

import { providers } from "@/components/SignInForm";
import { CircularProgress } from "@mui/material";
import { Provider, UserIdentity } from "@supabase/supabase-js";
import { LuLink, LuUnlink } from "react-icons/lu";

type Props = {
    identities: UserIdentity[];
    linkingProvider: string | null;
    unlinkingProvider: string | null;
    isLinked: (providerId: string) => boolean;
    getIdentity: (providerId: string) => UserIdentity | undefined;
    onLink: (provider: Provider) => void;
    onConfirmUnlink: (identity: UserIdentity) => void;
};

export default function LinkedAccounts({
    linkingProvider,
    unlinkingProvider,
    isLinked,
    getIdentity,
    onLink,
    onConfirmUnlink,
}: Props) {
    return (
        <div className="window w-full">
            <div className="title-bar">
                <div className="title-bar-text">
                    <LuLink className="inline mr-1 mb-0.5" size={13} />
                    Linked Accounts
                </div>
            </div>
            <div className="window-body has-space flex flex-col gap-2">
                <p className="text-xs text-gray-600 mb-1">
                    Link multiple sign-in methods so you never get locked out.
                    You need at least 1 linked at all times.
                </p>
                <div className="flex flex-wrap gap-2">
                    {providers.map((p) => {
                        const linked = isLinked(p.id);
                        const identity = getIdentity(p.id);
                        const isProcessing =
                            linkingProvider === p.id ||
                            unlinkingProvider === p.id;

                        return (
                            <button
                                key={p.id}
                                onClick={() =>
                                    linked && identity
                                        ? onConfirmUnlink(identity)
                                        : onLink(p.id as Provider)
                                }
                                disabled={isProcessing}
                                className={`flex items-center gap-2 py-2! px-3! transition-all ${
                                    p.fullWidth
                                        ? "w-full!"
                                        : "w-[calc(50%-0.25rem)]!"
                                } ${linked ? "opacity-80" : ""}`}
                                title={
                                    linked
                                        ? `Unlink ${p.label}`
                                        : `Link ${p.label}`
                                }
                            >
                                {isProcessing ? (
                                    <CircularProgress
                                        size={14}
                                        thickness={5}
                                        role="span"
                                    />
                                ) : linked ? (
                                    <LuUnlink size={14} />
                                ) : (
                                    <LuLink size={14} />
                                )}
                                {p.icon}
                                <span className="flex-1 text-left">
                                    {isProcessing
                                        ? linked
                                            ? "Unlinking..."
                                            : "Linking..."
                                        : linked
                                          ? `Unlink ${p.label}`
                                          : `Link ${p.label}`}
                                </span>
                                {linked && (
                                    <span className="text-green-700 text-xs font-semibold ml-auto">
                                        Linked
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
