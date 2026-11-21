"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getAuthClaims() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) return { user: null, profile: null };

        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        return {
            user,
            profile: profile || null,
        };
    } catch {
        return { user: null, profile: null };
    }
}
