"use client";

import { LuLock, LuMail, LuShieldCheck } from "react-icons/lu";

type Props = {
    userEmail: string | undefined;
    hasPasswordIdentity: boolean;
    onChangeEmail: () => void;
    onChangePassword: () => void;
};

export default function AccountSecurity({ userEmail, hasPasswordIdentity, onChangeEmail, onChangePassword }: Props) {
    return (
        <div className="window w-full">
            <div className="title-bar">
                <div className="title-bar-text">
                    <LuShieldCheck className="inline mr-1 mb-0.5" size={13} />
                    Account Security
                </div>
            </div>
            <div className="window-body has-space flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                        <p className="font-semibold text-sm">Email address</p>
                        <p className="text-xs text-gray-600">{userEmail ?? "No email linked"}</p>
                    </div>
                    <button onClick={onChangeEmail} className="flex items-center gap-2 py-1! px-3!">
                        <LuMail size={14} />
                        Change Email
                    </button>
                </div>

                <div className="status-bar" style={{ margin: 0 }}>
                    <p className="status-bar-field" style={{ flex: 1 }} />
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                        <p className="font-semibold text-sm">Password</p>
                        <p className="text-xs text-gray-600">
                            {hasPasswordIdentity ? "Password sign-in is enabled" : "No password set (OAuth only)"}
                        </p>
                    </div>
                    <button onClick={onChangePassword} className="flex items-center gap-2 py-1! px-3!">
                        <LuLock size={14} />
                        {hasPasswordIdentity ? "Change Password" : "Add Password"}
                    </button>
                </div>
            </div>
        </div>
    );
}
