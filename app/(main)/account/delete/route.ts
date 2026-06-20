import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function DELETE() {
    const supabase = createClient(await cookies());

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
        });
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    return new Response(JSON.stringify({ success: true }));
}
