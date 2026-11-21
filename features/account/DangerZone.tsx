"use client";

import { LuLogOut, LuTrash } from "react-icons/lu";

type Props = {
    onLogout: () => void;
    onDelete: () => void;
};

export default function DangerZone({ onLogout, onDelete }: Props) {
    return (
        <span className="flex flex-col gap-1 w-full">
            <button
                className="py-2! px-8! mb-2 flex items-center gap-2 justify-center w-fit"
                onClick={onLogout}
            >
                <LuLogOut />
                Log out
            </button>
            <label>Danger Zone:</label>
            <span className="border-red-500 border rounded-md p-4">
                <button
                    className="py-2! px-8! mb-2 flex items-center gap-2 justify-center"
                    onClick={onDelete}
                >
                    <LuTrash />
                    Delete account
                </button>
            </span>
        </span>
    );
}
