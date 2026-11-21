import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
    const supabase = createClient(await cookies());

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error(
            "Account deletion is missing server-side Supabase configuration.",
        );
        return NextResponse.json(
            { error: "Account deletion is currently unavailable." },
            { status: 503 },
        );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
        console.error("Account deletion failed:", error.message);
        return NextResponse.json(
            { error: "Unable to delete account." },
            { status: 500 },
        );
    }

    return NextResponse.json({ success: true });
}
