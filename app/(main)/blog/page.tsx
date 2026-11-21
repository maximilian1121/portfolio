import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import BlogExplorer from "@/features/blog/BlogExplorer";

export default async function BlogPage() {
    const supabase = createClient(await cookies());

    const { data: initialBlogs } = await supabase
        .from("blog")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 9);

    return <BlogExplorer initialBlogs={initialBlogs || []} />;
}
