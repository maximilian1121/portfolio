import type { Blog } from "@/features/blog/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { MDXRemote } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/mdx-components";
import "katex/dist/katex.min.css";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { BreadcrumbEmitter } from "@/components/layout/BreadcrumbEmitter";
import { Metadata } from "next";

function extractImages(content: string): string[] {
    const images = new Set<string>();

    const mdMatches = content.matchAll(/!\[.*?\]\((.*?)\)/g);
    for (const match of mdMatches) {
        if (match[1]) images.add(match[1]);
    }

    const htmlMatches = content.matchAll(/<img[^>]+src=["'](.*?)["']/g);
    for (const match of htmlMatches) {
        if (match[1]) images.add(match[1]);
    }

    return Array.from(images);
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    let data: Blog | null = null;

    if (slug === "test") {
        data = {
            title: "Test Blog Post",
            content: `![Test Image](https://placehold.co/600x400)`,
            created_at: new Date().toISOString(),
            slug: "test",
        } as Blog;
    } else {
        const supabase = await createClient(await cookies());
        const { data: dbData } = await supabase
            .from("blog")
            .select("*")
            .eq("slug", slug)
            .single();

        data = dbData;
    }

    const content = data?.content || "";
    const images = extractImages(content);

    const title = data?.title || "Untitled";
    const description =
        content.slice(0, 160).replace(/[#_*`>\n]/g, "") ||
        "No description available.";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://latific.click/blog/${slug}`,
            siteName: "Maximilians amazing site - blog",
            images: images.map((url) => ({
                url,
                width: 1200,
                height: 630,
            })),
            locale: "en_US",
            type: "article",
        },
        twitter: {
            card: images.length ? "summary_large_image" : "summary",
            title,
            description,
            images,
        },
    };
}

export default async function BlogPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    let data: Blog | null = null;

    if (slug === "test") {
        data = {
            id: "test-id",
            title: "Test Blog Post",
            content: `# MDX Comprehensive Test
This is a test of the **MDX provider** and custom component mapping.

---

## 1. Custom Components
<SteamGame>823500</SteamGame>

<Video src="https://lorem.video/cat_1080p" />

---

## 2. Standard Markdown & GFM
* **Bold** and *Italic* text.
* [Internal/External Links](https://google.com)
* Inline \`code blocks\` for technical snippets.

### Task List
- [x] Components rendered
- [x] Syntax highlighting active
- [ ] Production deploy

<Window7 title="Nested Window Example" active={false}>
    # Nested!
    Pretty **damn** *cool* ___right___?!?!
    Wait this must mean...
    <Window7 title="Inception Window" active={true}>
        # Inception!
        This is a window inside a window. Mind blown! 🤯
        But i want to go deeper...
        <Window7 title="Deeper Inception" active={true}>
            # Deeper Inception!
            This is a window inside a window inside a window. Absolute madness! 🤯🤯
            MOOOOOOOOREEEEE
            <Window7 title="Deepest Inception" active={true}>
                # Deepest Inception!
                This is a window inside a window inside a window inside a window. I can't even comprehend this! 🤯🤯🤯

                This cant go on forever right? RIGHT???

                <Window7 title="The End?" active={true}>
                    # The End?
                    This is a window inside a window inside a window inside a window inside a window. I think we've reached the limit of my brain's capacity! 🤯🤯🤯🤯
                </Window7>

                But can i have multiple windows inside one window? Let's find out!
                
                <Window7 title="Sibling Window 1" active={true}>
                    # Sibling Window 1
                    This is the first sibling window inside the deepest inception window. Siblings are fun! 😎
                </Window7>
            </Window7>
        </Window7>
    </Window7>
</Window7>

<Window7 title="Play terraria!!!" active={true}>
    <iframe width="100%" height="100%" src="https://turbowarp.org/622435399/embed?fps=60&hqpen" />
</Window7>

## 3. Media & Math
![Test Image](https://placehold.co/600x400)

Testing LaTeX integration for math-heavy docs:
$$E = mc^2$$

Display of pi
$$\\pi \\approx ${3.14159265359}$$

> **Note:** If the Steam widget above shows as raw text, check your component mapping object in the MDX provider.`,
            created_at: new Date().toISOString(),
            slug: "test",
        } as unknown as Blog;
    } else {
        const supabase = await createClient(await cookies());
        const { data: dbData, error } = await supabase
            .from("blog")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) {
            console.error("Supabase error:", error.message);
        }
        data = dbData;
    }

    return (
        <div className="flex flex-col max-w-4xl mx-auto gap-6">
            <header>
                <h1 className="text-2xl font-bold">
                    {data?.title || "Untitled"}
                    <BreadcrumbEmitter name={data?.title || "Untitled"} />
                </h1>
                <p className="text-gray-600 text-lg">
                    {new Date(
                        data?.created_at || Date.now(),
                    ).toLocaleDateString()}
                </p>
            </header>
            <article className="prose w-full max-w-full">
                {data ? (
                    <MDXRemote
                        source={data.content || "No content available."}
                        components={useMDXComponents({})}
                        options={{
                            mdxOptions: {
                                remarkPlugins: [remarkMath],
                                rehypePlugins: [rehypeKatex],
                            },
                        }}
                    />
                ) : (
                    <p>Blog post not found.</p>
                )}
            </article>
        </div>
    );
}
