"use client";

import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export type Profile = {
    id: string;
    username: string | null;
    avatar_url: string | null;
};

const supabase = createClient();

export function useUserClient() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let profileRequestId = 0;

        const fetchFullData = async (currentUser: User) => {
            const requestId = ++profileRequestId;
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .maybeSingle();

                if (!isMounted || requestId !== profileRequestId) return;

                if (error) {
                    console.error("Failed to load user profile:", error.message);
                    setProfile(null);
                } else {
                    setProfile(data);
                }
            } catch (err) {
                if (isMounted && requestId === profileRequestId) {
                    console.error("Failed to load user profile:", err);
                    setProfile(null);
                }
            } finally {
                if (isMounted && requestId === profileRequestId) {
                    setLoading(false);
                }
            }
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;

            if (session?.user) {
                setUser(session.user);
                void fetchFullData(session.user);
            } else {
                profileRequestId += 1;
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            profileRequestId += 1;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
}
