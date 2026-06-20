"use state";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface UserTagProps {
    id?: string | null;
    type: string;
    userId: string | null;
    profile: { username: string | null; avatar_url: string | null } | null;
    supabase: ReturnType<typeof createClient>;
}

const profileCache = new Map<
    string,
    { username: string; avatar_url: string }
>();

export const UserTag = ({
    id,
    type,
    userId,
    profile,
    supabase,
}: UserTagProps) => {
    const [username, setUsername] = useState<string>("");
    const [pfp, setPfp] = useState<string>("");

    useEffect(() => {
        if (!id) return;

        if (id === userId) {
            setUsername(profile?.username ?? "You");
            setPfp(profile?.avatar_url ?? "");
            return;
        }

        if (profileCache.has(id)) {
            const cached = profileCache.get(id)!;
            setUsername(cached.username);
            setPfp(cached.avatar_url);
            return;
        }

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("id", id)
                .single();

            if (!error && data) {
                profileCache.set(id, data);
                setUsername(data.username);
                setPfp(data.avatar_url);
            } else {
                setUsername("Unknown");
            }
        };

        fetchProfile();
    }, [id]);

    return (
        <span className="flex items-center gap-1">
            <p>{type}:</p>
            <img
                className="rounded-full"
                src={pfp || "/default-avatar.png"}
                width={16}
                height={16}
            />
            <p>{username || "Loading..."}</p>
        </span>
    );
};
