"use client";

import { Modal } from "@mui/material";
import { LuEye, LuEyeOff, LuLock, LuMail } from "react-icons/lu";
import { useAccountState } from "./use-account-state";

type Props = ReturnType<typeof useAccountState> & {
    userEmail: string | undefined;
};

export default function AccountModals({
    userEmail,
    logoutOpen,
    setLogoutOpen,
    deleteOpen,
    setDeleteOpen,
    deleteAcc,
    supabase,
    unlinkConfirmOpen,
    setUnlinkConfirmOpen,
    providerToUnlink,
    handleUnlink,
    emailOpen,
    setEmailOpen,
    newEmail,
    setNewEmail,
    emailUpdating,
    handleEmailUpdate,
    passwordOpen,
    setPasswordOpen,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPass,
    setShowNewPass,
    showConfirmPass,
    setShowConfirmPass,
    passwordUpdating,
    handlePasswordUpdate,
    hasPasswordIdentity,
}: Props) {
    return (
        <>
            <Modal
                open={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                className="flex items-center justify-center align-middle"
            >
                <div className="window active glass mx-auto w-sm my-auto z-30">
                    <div className="title-bar">
                        <div className="title-bar-text">Logout</div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Close"
                                onClick={() => setLogoutOpen(false)}
                            />
                        </div>
                    </div>
                    <div className="window-body has-space h-full flex items-center justify-center">
                        <h1 className="py-8 text-2xl">
                            Are you sure you want to log out?
                        </h1>
                    </div>
                    <footer className="flex gap-2 justify-end">
                        <button
                            className="default"
                            onClick={() => supabase.auth.signOut()}
                        >
                            Yes
                        </button>
                        <button onClick={() => setLogoutOpen(false)}>
                            Cancel
                        </button>
                    </footer>
                </div>
            </Modal>

            <Modal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                className="flex items-center justify-center align-middle"
            >
                <div className="window active glass mx-auto w-sm my-auto z-30">
                    <div className="title-bar">
                        <div className="title-bar-text">Delete account</div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Close"
                                onClick={() => setDeleteOpen(false)}
                            />
                        </div>
                    </div>
                    <div className="window-body has-space h-full flex flex-col items-center justify-center">
                        <h1 className="text-2xl pt-5">Delete your account?</h1>
                        <p className="pb-5 text-lg">This is irreversible!</p>
                    </div>
                    <footer className="flex gap-2 justify-end">
                        <button className="default" onClick={deleteAcc}>
                            Yes
                        </button>
                        <button onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </button>
                    </footer>
                </div>
            </Modal>

            <Modal
                open={unlinkConfirmOpen}
                onClose={() => setUnlinkConfirmOpen(false)}
                className="flex items-center justify-center align-middle"
            >
                <div className="window active glass mx-auto w-sm my-auto z-30">
                    <div className="title-bar">
                        <div className="title-bar-text">
                            Unlink {providerToUnlink?.provider}
                        </div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Close"
                                onClick={() => setUnlinkConfirmOpen(false)}
                            />
                        </div>
                    </div>
                    <div className="window-body has-space h-full flex flex-col items-center justify-center">
                        <h1 className="text-xl pt-5">
                            Unlink{" "}
                            <span className="font-bold capitalize">
                                {providerToUnlink?.provider}
                            </span>
                            ?
                        </h1>
                        <p className="pb-5 text-base text-center">
                            You won't be able to sign in with it anymore. Make
                            sure you have another way in!
                        </p>
                    </div>
                    <footer className="flex gap-2 justify-end">
                        <button className="default" onClick={handleUnlink}>
                            Unlink
                        </button>
                        <button onClick={() => setUnlinkConfirmOpen(false)}>
                            Cancel
                        </button>
                    </footer>
                </div>
            </Modal>

            <Modal
                open={emailOpen}
                onClose={() => setEmailOpen(false)}
                className="flex items-center justify-center align-middle"
            >
                <div className="window active glass mx-auto w-sm my-auto z-30">
                    <div className="title-bar">
                        <div className="title-bar-text">Change Email</div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Close"
                                onClick={() => setEmailOpen(false)}
                            />
                        </div>
                    </div>
                    <div className="window-body has-space flex flex-col gap-3">
                        <p className="text-sm">
                            Current email:{" "}
                            <span className="font-semibold">
                                {userEmail ?? "none"}
                            </span>
                        </p>
                        <div className="field-row-stacked">
                            <label>New email address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="new@email.com"
                            />
                        </div>
                        <p className="text-xs text-gray-600">
                            A confirmation link will be sent to both your old
                            and new email addresses.
                        </p>
                    </div>
                    <footer className="flex gap-2 justify-end">
                        <button
                            className="default"
                            onClick={handleEmailUpdate}
                            disabled={emailUpdating || !newEmail}
                        >
                            {emailUpdating ? "Sending..." : "Send Confirmation"}
                        </button>
                        <button onClick={() => setEmailOpen(false)}>
                            Cancel
                        </button>
                    </footer>
                </div>
            </Modal>

            <Modal
                open={passwordOpen}
                onClose={() => setPasswordOpen(false)}
                className="flex items-center justify-center align-middle"
            >
                <div className="window active glass mx-auto w-sm my-auto z-30">
                    <div className="title-bar">
                        <div className="title-bar-text">
                            {hasPasswordIdentity
                                ? "Change Password"
                                : "Add Password"}
                        </div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Close"
                                onClick={() => setPasswordOpen(false)}
                            />
                        </div>
                    </div>
                    <div className="window-body has-space flex flex-col gap-3">
                        <div className="field-row-stacked">
                            <label>New password</label>
                            <span className="flex items-center gap-1">
                                <input
                                    type={showNewPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="Min. 6 characters"
                                    className="flex-1"
                                />
                                <button
                                    onClick={() => setShowNewPass((v) => !v)}
                                    className="px-2! py-1!"
                                    title={showNewPass ? "Hide" : "Show"}
                                >
                                    {showNewPass ? (
                                        <LuEyeOff size={14} />
                                    ) : (
                                        <LuEye size={14} />
                                    )}
                                </button>
                            </span>
                        </div>
                        <div className="field-row-stacked">
                            <label>Confirm new password</label>
                            <span className="flex items-center gap-1">
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="Same thing again"
                                    className="flex-1"
                                />
                                <button
                                    onClick={() =>
                                        setShowConfirmPass((v) => !v)
                                    }
                                    className="px-2! py-1!"
                                    title={showConfirmPass ? "Hide" : "Show"}
                                >
                                    {showConfirmPass ? (
                                        <LuEyeOff size={14} />
                                    ) : (
                                        <LuEye size={14} />
                                    )}
                                </button>
                            </span>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-600 text-xs">
                                Passwords don't match!
                            </p>
                        )}
                    </div>
                    <footer className="flex gap-2 justify-end">
                        <button
                            className="default"
                            onClick={handlePasswordUpdate}
                            disabled={
                                passwordUpdating ||
                                !newPassword ||
                                !confirmPassword
                            }
                        >
                            {passwordUpdating
                                ? "Saving..."
                                : hasPasswordIdentity
                                  ? "Update Password"
                                  : "Set Password"}
                        </button>
                        <button onClick={() => setPasswordOpen(false)}>
                            Cancel
                        </button>
                    </footer>
                </div>
            </Modal>
        </>
    );
}
