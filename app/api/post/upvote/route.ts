import { cookies } from "next/headers";
import { supabase } from "../../../../lib/supabaseClient";

export type AnonUser = {
    id: string;
    created_at: string | null;
    upvoted_posts: string[];
};

export async function POST(req: Request) {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
        return new Response(JSON.stringify({ error: "Missing slug" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const cookieStore = await cookies();
    const anonymousUserToken = cookieStore.get("anonymousUserToken")?.value;

    if (!anonymousUserToken) {
        return new Response(
            JSON.stringify({ error: "Missing anonymous user token" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    let { data, error } = await supabase
        .from("anon_storage")
        .select("*")
        .eq("id", anonymousUserToken)
        .single();

    if (error || !data) {
        return new Response(
            JSON.stringify({ error: "Invalid anonymous user token" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (data.upvoted_posts.includes(slug)) {
        return new Response(
            JSON.stringify({ error: "Post already upvoted by this user" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Update the upvoted_posts array
    await supabase
        .from("anon_storage")
        .update({
            upvoted_posts: [...data.upvoted_posts, slug],
        })
        .eq("id", anonymousUserToken);

    // Get current upvotes for the post
    const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("upvotes")
        .eq("slug", slug)
        .single();

    if (postError || !postData) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Increment the upvotes count
    await supabase
        .from("posts")
        .update({ upvotes: postData.upvotes + 1 })
        .eq("slug", slug);

    return new Response(
        JSON.stringify({
            message: "Upvote successful",
            upvotes: postData.upvotes + 1,
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );
}

export async function getPosts(slug: string) {
    if (!slug) {
        console.error("Missing slug!");
        return { upvotes: null, error: "Missing slug" };
    }

    const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("upvotes")
        .eq("slug", slug)
        .single();

    if (postError || !postData) {
        console.error("Post not found!", postError);
        return { upvotes: null, error: postError?.message || "Post not found" };
    }

    return { upvotes: postData.upvotes, error: null };
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
        return new Response(JSON.stringify({ error: "Slug is required" }), {
            status: 400,
        });
    }

    const { upvotes, error } = await getPosts(slug);

    if (error) {
        return new Response(JSON.stringify({ error }), { status: 404 });
    }

    return new Response(JSON.stringify({ upvotes }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
