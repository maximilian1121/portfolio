import ReactMarkdown from "react-markdown";
// CodeBlock is a client component handling syntax highlighting and copy functionality
import CodeBlock from "./CodeBlock";
import { Metadata } from "next";
import { getPost } from "@/app/api/post/route";
import Link from "next/link";
import rehypeRaw from "rehype-raw";
import GetAnonToken from "../getAnonToken";
import LikeButton from "./LikeButton";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const slug = (await params).slug;
    const post = await getPost(slug);
    if (!post) {
        return {
            title: "Post not found",
            description: "The requested blog post could not be found.",
        };
    }
    function markdownToPlainText(md: string) {
        // THIS WHOLE FUNCTION IS AI GENERATED I CANT BE BOTHERED TO DO IT MYSELF LOL
        if (!md) return "";
        let s = md;
        // Remove fenced code blocks
        s = s.replace(/```[\s\S]*?```/g, "");
        // Replace image markdown with alt text
        s = s.replace(/!\[(.*?)\]\((?:.*?)\)/g, "$1");
        // Replace links with their text
        s = s.replace(/\[(.*?)\]\((?:.*?)\)/g, "$1");
        // Replace inline code with its content
        s = s.replace(/`([^`]*)`/g, "$1");
        // Remove HTML tags
        s = s.replace(/<[^>]+>/g, "");
        // Remove headings, blockquote markers, list markers
        s = s.replace(/^#{1,6}\s*/gm, "");
        s = s.replace(/^>\s*/gm, "");
        s = s.replace(/^\s*[-*+]\s+/gm, "");
        s = s.replace(/^\s*\d+\.\s+/gm, "");
        // Remove emphasis markers
        s = s.replace(/[*_~]/g, "");
        // Collapse whitespace
        s = s.replace(/\s+/g, " ");
        return s.trim();
    }

    const plain = markdownToPlainText(post.content || "");

    const imgMatch = post.content.match(
        /!\[.*?\]\((.*?\.(?:jpg|jpeg|png|webp|gif))\)/i
    ); // same with this regex I hate regex lol
    const firstImage = imgMatch ? imgMatch[1] : undefined;

    const shortDesc = plain.slice(0, 320) + (plain.length > 320 ? "..." : "");

    return {
        title: post.title,
        description: shortDesc,
        openGraph: {
            title: post.title,
            description: shortDesc,
            type: "article",
            url: `https://www.latific.click/blog/${slug}`,
            images: firstImage
                ? [
                      {
                          url: firstImage,
                          alt: post.title,
                      },
                  ]
                : undefined,
        },
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-800">Error fetching post!</p>
                    <Link
                        className="text-blue-500 hover:underline mt-2 block"
                        href={"/blog"}
                    >
                        Go back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl py-12 space-y-8 mx-4 md:mx-auto">
            <LikeButton post={post} />
            <article>
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold dark:text-gray-100 text-gray-900 mb-4">
                        {post.title}
                    </h1>
                    {post.created_at && (
                        <time className="text-gray-500 text-lg">
                            {new Date(post.created_at).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }
                            )}
                        </time>
                    )}
                </header>

                <div
                    className="prose prose-md prose-slate max-w-none
                      prose-headings:font-bold dark:prose-headings:text-gray-100 prose-headings:text-gray-900
                      dark:prose-p:text-gray-300 prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                     dark:prose-strong:text-gray-100 prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-code:text-gray-200 prose-code:font-mono prose-code:font-light prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
                      prose-pre:bg-transparent prose-pre:p-0
                      prose-blockquote:border-l-4 prose-blockquote:text-gray-100 dark:prose-blockquote:text-gray-100 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 dark:prose-blockquote:bg-gray-600 prose-blockquote:bg-gray-100 prose-blockquote:py-2 prose-blockquote:px-4
                      prose-ul:list-disc prose-ol:list-decimal
                     dark:prose-li:text-gray-300 prose-li:text-gray-700
                      prose-img:rounded-lg prose-img:shadow-lg"
                >
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={
                            {
                                // Use the client-side CodeBlock component for rendering code blocks
                                code: CodeBlock,

                                img({ src, alt }: any) {
                                    // Video handling (unchanged)
                                    if (src?.endsWith(".mp4")) {
                                        return (
                                            <span
                                                className="md-video"
                                                style={{ display: "block" }}
                                            >
                                                <video
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: "12px",
                                                    }}
                                                >
                                                    <source
                                                        src={src}
                                                        type="video/mp4"
                                                    />
                                                    {alt}
                                                </video>
                                            </span>
                                        );
                                    }
                                    if (src && /\.(mp3|wav|ogg)$/i.test(src)) {
                                        return (
                                            <span
                                                className="md-audio"
                                                style={{ display: "block" }}
                                            >
                                                <audio
                                                    controls
                                                    preload="metadata"
                                                    style={{ width: "100%" }}
                                                >
                                                    <source
                                                        src={src}
                                                        type={`audio/${src
                                                            .split(".")
                                                            .pop()
                                                            ?.toLowerCase()}`}
                                                    />
                                                    Your browser does not
                                                    support the audio element.
                                                </audio>
                                            </span>
                                        );
                                    }
                                    // Default image rendering
                                    return <img src={src} alt={alt} />;
                                },

                                steamgame({ node, children }: any) {
                                    const appId = children;
                                    return (
                                        <iframe
                                            src={`https://store.steampowered.com/widget/${appId}`}
                                            style={{
                                                border: 0,
                                                width: "100%",
                                                height: "190px",
                                            }}
                                            frameBorder="0"
                                            scrolling="no"
                                        >
                                            Either your browser doesn't support
                                            iframes or steam is unavailable!
                                        </iframe>
                                    );
                                },
                            } as any
                        }
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>
            <GetAnonToken />
        </div>
    );
}
