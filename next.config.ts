import nextMdx from "@next/mdx";
import type { NextConfig } from "next";

const withMdx = nextMdx({
    options: {
        remarkPlugins: ["remark-math"],
        rehypePlugins: ["rehype-katex"],
    },
});

const nextConfig: NextConfig = {
    pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js"],
    allowedDevOrigins: ["127.0.0.1", "localhost"],
    devIndicators: false,
    async headers() {
        return [
            {
                // Route where your ffmpeg application runs
                source: "/tools/shitify/:path*",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                ],
            },
            {
                // Target the specific folder where your multi-threaded core files live
                source: "/ffmpeg-core-mt/:path*",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "cross-origin",
                    },
                ],
            },
            {
                // Next.js internal static assets
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "cross-origin",
                    },
                ],
            },
        ];
    },

    webpack: (config) => {
        config.module.exprContextCritical = false;
        return config;
    },
};

export default withMdx(nextConfig);
