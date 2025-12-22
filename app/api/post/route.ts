import { cache } from "react";
import { supabase } from "../../../lib/supabaseClient";

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string | null;
};

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const { data, error }: { data: Post | null; error: any } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (data) {
    // data.content = data.content.replaceAll("https://files.latific.click/file/", "/api/media/");
  }
  return data;
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response(
      JSON.stringify({ error: "Missing slug" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const post = await getPost(slug);

    if (!post) {
      return new Response(
        JSON.stringify({ error: "Post not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(post),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}