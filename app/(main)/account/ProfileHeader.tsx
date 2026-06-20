"use client";

import Tumbleweed from "@/components/tumblweed";
import { Tooltip } from "@mui/material";
import Image from "next/image";

type Props = {
    avatarUrl: string | null | undefined;
    username: string | null;
    setUsername: (v: string) => void;
    updating: boolean;
    handleUpdate: () => void;
};

export default function ProfileHeader({ avatarUrl, username, setUsername, updating, handleUpdate }: Props) {
    return (
        <span className="flex gap-6 items-center">
            <div className="relative w-20 h-20 sm:w-32 sm:h-32">
                <Tooltip title="Profile pictures are locked to prevent people from uploading explicit content. Sorry!">
                    <Image
                        src={avatarUrl ?? "/icon"}
                        alt="Profile Icon"
                        fill
                        unoptimized
                        className="object-cover rounded-full border border-gray-200"
                    />
                </Tooltip>
            </div>
            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    value={username ?? ""}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Set username"
                    spellCheck="false"
                    className={
                        ((username?.length ?? 0) > 24 && "border-red-600!") +
                        " sm:text-4xl! text-2xl! h-fit! font-semibold sm:font-bold transition-colors"
                    }
                />
                <label className={`${(username?.length ?? 0) > 24 ? "text-red-600" : "text-black"} transition-colors`}>
                    Maximum 24 characters, current {username?.length ?? 0}
                </label>
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all w-fit font-medium"
                >
                    {updating ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </span>
    );
}
