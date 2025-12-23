import { cookies } from "next/headers";
import { supabase } from "../../../../lib/supabaseClient";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const anonymousUserToken = cookieStore.get("anonymousUserToken")?.value;

    let { data, error } = await supabase
        .from("anon_storage")
        .select("*")
        .eq("id", anonymousUserToken)
        .single();

    if (!error && data) {
        return new Response(JSON.stringify({ error: "User already exists" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const newToken = crypto.randomUUID();

    await supabase.from("anon_storage").insert({
        id: newToken,
        created_at: new Date().toISOString(),
        upvoted_posts: [],
    });

    let res = new Response();
    res.headers.append(
        "Set-Cookie",
        `anonymousUserToken=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
            60 * 60 * 24 * 365
        }`
    );
    res.headers.append(
        "Set-Cookie",
        `anonymousLoggedIn=1; Max-Age=${60 * 60 * 24 * 365}`
    );

    return res;
}
