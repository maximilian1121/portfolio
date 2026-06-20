"use client";

import { useUserClient } from "@/hooks/use-user-client";
import { createClient } from "@/utils/supabase/client";
import { Provider, UserIdentity } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";

export function useAccountState() {
    const { user, profile, loading } = useUserClient();
    const supabase = createClient();
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();

    const [username, setUsername] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [identities, setIdentities] = useState<UserIdentity[]>([]);
    const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
    const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
    const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
    const [providerToUnlink, setProviderToUnlink] = useState<UserIdentity | null>(null);

    const [emailOpen, setEmailOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [emailUpdating, setEmailUpdating] = useState(false);
    const [passwordUpdating, setPasswordUpdating] = useState(false);

    useEffect(() => {
        if (profile) setUsername(profile.username);
    }, [profile]);

    useEffect(() => {
        if (user?.identities) setIdentities(user.identities);
    }, [user]);

    const handleUpdate = async () => {
        if (!user?.id) return;
        setUpdating(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .update({ username })
                .eq("id", user.id)
                .select()
                .single();
            if (error) throw error;
            if (data) setUsername(data.username);
            enqueueSnackbar({ variant: "success", message: "Username updated! Reload to see changes." });
        } catch (error: any) {
            let errorMessage = "An error occurred when changing your username";
            if (error?.code === "23514")
                errorMessage = "Username too long! Max 24 chars. Current: " + username?.length;
            if (error?.code === "P0001")
                errorMessage = "Username contains foul language or vulgar references!";
            enqueueSnackbar({ variant: "error", message: errorMessage });
        } finally {
            setUpdating(false);
        }
    };

    const handleLink = async (provider: Provider) => {
        setLinkingProvider(provider);
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider,
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch (error: any) {
            enqueueSnackbar({ variant: "error", message: error.message ?? `Failed to link ${provider}` });
            setLinkingProvider(null);
        }
    };

    const confirmUnlink = (identity: UserIdentity) => {
        if (identities.length <= 1) {
            enqueueSnackbar({
                variant: "warning",
                message: "Can't unlink your only sign-in method! Add another one first.",
            });
            return;
        }
        setProviderToUnlink(identity);
        setUnlinkConfirmOpen(true);
    };

    const handleUnlink = async () => {
        if (!providerToUnlink) return;
        setUnlinkingProvider(providerToUnlink.provider ?? null);
        setUnlinkConfirmOpen(false);
        try {
            const { error } = await supabase.auth.unlinkIdentity(providerToUnlink);
            if (error) throw error;
            setIdentities((prev) => prev.filter((i) => i.id !== providerToUnlink.id));
            enqueueSnackbar({ variant: "success", message: `Unlinked ${providerToUnlink.provider} successfully!` });
        } catch (error: any) {
            enqueueSnackbar({ variant: "error", message: error.message ?? "Failed to unlink provider" });
        } finally {
            setUnlinkingProvider(null);
            setProviderToUnlink(null);
        }
    };

    const handleEmailUpdate = async () => {
        if (!newEmail) return;
        setEmailUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            enqueueSnackbar({ variant: "success", message: "Confirmation email sent to both addresses! Check your inbox." });
            setEmailOpen(false);
            setNewEmail("");
        } catch (error: any) {
            enqueueSnackbar({ variant: "error", message: error.message ?? "Failed to update email" });
        } finally {
            setEmailUpdating(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            enqueueSnackbar({ variant: "error", message: "Passwords don't match! Classic." });
            return;
        }
        if (newPassword.length < 6) {
            enqueueSnackbar({ variant: "error", message: "Password must be at least 6 characters." });
            return;
        }
        setPasswordUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            enqueueSnackbar({ variant: "success", message: "Password updated successfully!" });
            setPasswordOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            enqueueSnackbar({ variant: "error", message: error.message ?? "Failed to update password" });
        } finally {
            setPasswordUpdating(false);
        }
    };

    const deleteAcc = async () => {
        const response = await fetch("/account/delete", { method: "DELETE" });
        if (response.ok) {
            router.push("/");
        } else {
            enqueueSnackbar({ variant: "error", message: "Error while deleting account!" });
        }
    };

    const isLinked = (providerId: string) => identities.some((i) => i.provider === providerId);
    const getIdentity = (providerId: string) => identities.find((i) => i.provider === providerId);
    const hasPasswordIdentity = identities.some((i) => i.provider === "email");

    return {
        user, profile, loading,
        supabase,
        username, setUsername,
        updating,
        handleUpdate,
        logoutOpen, setLogoutOpen,
        deleteOpen, setDeleteOpen,
        deleteAcc,
        identities,
        linkingProvider,
        unlinkingProvider,
        unlinkConfirmOpen, setUnlinkConfirmOpen,
        providerToUnlink,
        handleLink,
        confirmUnlink,
        handleUnlink,
        emailOpen, setEmailOpen,
        passwordOpen, setPasswordOpen,
        newEmail, setNewEmail,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        showCurrentPass, setShowCurrentPass,
        showNewPass, setShowNewPass,
        showConfirmPass, setShowConfirmPass,
        emailUpdating,
        passwordUpdating,
        handleEmailUpdate,
        handlePasswordUpdate,
        isLinked,
        getIdentity,
        hasPasswordIdentity,
    };
}
