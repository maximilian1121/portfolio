"use client";

import LoadingTemplate from "@/app/loading";
import Link from "next/link";
import { useAccountState } from "./use-account-state";
import AccountModals from "./AccountModals";
import AccountSecurity from "./AccountSecurity";
import DangerZone from "./DangerZone";
import LinkedAccounts from "./LinkedAccounts";
import ProfileHeader from "./ProfileHeader";

export default function Account() {
    const state = useAccountState();
    const { user, profile, loading } = state;

    if (loading) return <LoadingTemplate />;
    if (!user)
        return (
            <div className="flex flex-col max-w-4xl mx-auto gap-2 items-center p-8">
                <h1 className="text-4xl">You seem lost!</h1>
                <p className="text-xl">You arent signed in!</p>
                <Link
                    role="button"
                    href="/"
                    className="no-underline! text-black!"
                >
                    Go home!
                </Link>
            </div>
        );

    return (
        <div className="flex flex-col max-w-4xl mx-auto gap-6 items-center p-8">
            <AccountModals {...state} userEmail={user.email} />

            <div className="flex flex-col items-start text-left gap-6 w-full max-w-2xl z-50">
                <ProfileHeader
                    avatarUrl={profile?.avatar_url}
                    username={state.username}
                    setUsername={state.setUsername}
                    updating={state.updating}
                    handleUpdate={state.handleUpdate}
                />

                <AccountSecurity
                    userEmail={user.email}
                    hasPasswordIdentity={state.hasPasswordIdentity}
                    onChangeEmail={() => state.setEmailOpen(true)}
                    onChangePassword={() => state.setPasswordOpen(true)}
                />

                <LinkedAccounts
                    identities={state.identities}
                    linkingProvider={state.linkingProvider}
                    unlinkingProvider={state.unlinkingProvider}
                    isLinked={state.isLinked}
                    getIdentity={state.getIdentity}
                    onLink={state.handleLink}
                    onConfirmUnlink={state.confirmUnlink}
                />

                <DangerZone
                    onLogout={() => state.setLogoutOpen(true)}
                    onDelete={() => state.setDeleteOpen(true)}
                />
            </div>
        </div>
    );
}
