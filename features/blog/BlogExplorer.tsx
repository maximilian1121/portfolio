"use client";

import type { Blog } from "@/features/blog/types";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useCallback } from "react";
import Explorer, { type ExplorerFetchOptions } from "@/components/explorers/Explorer";

function getExcerpt(content: string, maxLength = 100) {
    const text = content
        .replace(/<[^>]*>[\s\S]*?<\/[^>]*>/gi, "")
        .replace(/<[^>]*\/>/gi, "")
        .replace(/([#*~_`]|\[.*?\]\(.*?\))/g, "")
        .trim();

    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export default function BlogExplorer({
    initialBlogs,
}: {
    initialBlogs: Blog[];
}) {
    const supabase = createClient();
    const fetchBlogs = useCallback(
        async ({ search, sortBy, order, page, pageSize }: ExplorerFetchOptions) => {
            let query = supabase
                .from("blog")
                .select("*")
                .order(sortBy, { ascending: order === "asc" });

            if (search) {
                query = query.or(
                    `title.ilike.%${search}%,content.ilike.%${search}%`,
                );
            }

            const from = (page - 1) * pageSize;
            const { data, error } = await query.range(
                from,
                from + pageSize - 1,
            );

            if (error) throw error;

            return {
                data: data ?? [],
                hasMore: (data?.length ?? 0) === pageSize,
            };
        },
        [supabase],
    );

    return (
        <Explorer
            explorerName="Browse Posts"
            initialData={initialBlogs}
            fetchData={fetchBlogs}
            searchableFields={["title", "content"]}
            defaultSort="created_at"
            sortOptions={[
                { label: "Date Modified", value: "created_at" },
                { label: "Name", value: "title" },
            ]}
            renderItem={(blog) => (
                <div className="flex flex-col justify-between min-h-35 p-3 border h-full border-[#b8d6e9] rounded-[3px] shadow-sm bg-linear-to-b from-white to-[#f0f7fc]">
                    <div>
                        <h4 className="mb-2 text-[1.1rem] text-[#1e395b]">
                            {blog.title}
                        </h4>

                        <p className="text-[0.85rem] text-[#444] leading-[1.4]">
                            {getExcerpt(blog.content)}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-3 text-[0.75rem] text-[#666] border-t border-dotted border-[#bcd]">
                        <span>
                            Created at:{" "}
                            {new Date(blog.created_at).toLocaleDateString()}
                        </span>

                        <Link
                            href={`/blog/${blog.slug}`}
                            className="py-2! px-8! text-black no-underline"
                        >
                            Open
                        </Link>
                    </div>
                </div>
            )}
        />
    );
}
