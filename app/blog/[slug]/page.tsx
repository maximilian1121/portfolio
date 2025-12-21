import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Metadata, ResolvingMetadata } from "next";
import { getPost } from "@/app/api/post/route";
import Link from "next/link";
import rehypeRaw from "rehype-raw";

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
      <article>
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold dark:text-gray-100 text-gray-900 mb-4">
            {post.title}
          </h1>
          {post.created_at && (
            <time className="text-gray-500 text-lg">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </header>

        <div
          className="prose prose-md prose-slate max-w-none
                      prose-headings:font-bold dark:prose-headings:text-gray-100 prose-headings:text-gray-900
                      dark:prose-p:text-gray-300 prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                     dark:prose-strong:text-gray-100 prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
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
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={ghcolors}
                      language={match[1]}
                      PreTag="pre"
                      customStyle={{
                        borderRadius: "0.5rem",
                        padding: "1rem",
                        fontSize: "0.875rem",
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },

                img({ src, alt }: any) {
                  if (src?.endsWith(".mp4")) {
                    return (
                      <span className="md-video" style={{ display: "block" }}>
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          style={{ width: "100%", borderRadius: "12px" }}
                        >
                          <source src={src} type="video/mp4" />
                          {alt}
                        </video>
                      </span>
                    );
                  }
                  return <img src={src} alt={alt} />;
                },

                steamgame({ node, children }: any) {
                  const appId = children;
                  return (
                    <iframe
                      src={`https://store.steampowered.com/widget/${appId}`}
                      style={{ border: 0, width: "100%", height: "190px" }}
                      frameBorder="0"
                      scrolling="no"
                    />
                  );
                },
              } as any
            }
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
