import { createClient } from "@/utils/supabase/server";
import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { GAMES_DATA } from "./(main)/games/data";
import { TOOLS_DATA } from "./(main)/tools/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient(await cookies());

    const { data: posts, error } = await supabase
        .from("blog")
        .select("slug, created_at");

    if (error || !posts) {
        return [];
    }

    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `https://latific.click/blog/${post.slug}`,
        lastModified: new Date(post.created_at),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const gameRoutes: MetadataRoute.Sitemap = GAMES_DATA.map((game) => ({
        url: `https://latific.click${game.link}`,
        lastModified: new Date(game.releaseDate),
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
        url: `https://latific.click${tool.link}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
    }));

    return [
        {
            url: "https://latific.click",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 1,
        },
        {
            url: "https://latific.click/blog",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: "https://latific.click/games",
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        ...blogRoutes,
        ...gameRoutes,
        ...toolRoutes,
    ];
}
