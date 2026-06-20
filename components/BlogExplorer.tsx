"use client";

import { Blog } from "@/app/types";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Explorer from "./Explorer";

export default function BlogExplorer({
    initialBlogs,
}: {
    initialBlogs: Blog[];
}) {
    const [blogs, setBlogs] = useState(initialBlogs);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        const syncData = async () => {
            if (
                searchTerm === "" &&
                sortBy === "created_at" &&
                order === "desc" &&
                page === 1
            )
                return;

            setLoading(true);
            let query = supabase
                .from("blog")
                .select("*")
                .order(sortBy, { ascending: order === "asc" });

            if (searchTerm) {
                query = query.ilike("title", `%${searchTerm}%`);
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            const { data } = await query.range(0, 9);
            setBlogs(data || []);
            setLoading(false);
            setPage(1);
        };

        const timeoutId = setTimeout(syncData, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, sortBy, order]);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        const from = page * 10;
        const { data } = await supabase
            .from("blog")
            .select("*")
            .order(sortBy, { ascending: order === "asc" })
            .range(from, from + 9);

        if (data && data.length > 0) {
            setBlogs((prev) => [...prev, ...data]);
            setPage((prev) => prev + 1);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    return (
        <Explorer
            explorerName="Browse Posts"
            initialData={initialBlogs}
            fetchData={async ({ search, sortBy, order, page, pageSize }) => {
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
                const { data } = await query.range(from, from + pageSize - 1);

                return {
                    data: data ?? [],
                    hasMore: (data?.length || 0) === pageSize,
                };
            }}
            searchableFields={["title"]}
            defaultSort="created_at"
            sortOptions={[
                { label: "Date Modified", value: "created_at" },
                { label: "Name", value: "title" },
            ]}
            renderItem={(blog) => (
                <div
                    key={blog.id}
                    className="flex flex-col justify-between min-h-35 p-3 border h-full border-[#b8d6e9] rounded-[3px] shadow-sm bg-linear-to-b from-white to-[#f0f7fc]"
                >
                    <div>
                        <h4 className="mb-2 text-[1.1rem] text-[#1e395b]">
                            {blog.title}
                        </h4>

                        <p className="text-[0.85rem] text-[#444] leading-[1.4]">
                            {(() => {
                                const cleanText = blog.content
                                    .replace(/<[^>]*>[\s\S]*?<\/[^>]*>/gi, "")
                                    .replace(/<[^>]*\/>/gi, "")
                                    .replace(/([#*~_`]|\[.*?\]\(.*?\))/g, "")
                                    .trim();

                                return cleanText.length > 100
                                    ? cleanText.substring(0, 100) + "..."
                                    : cleanText;
                            })()}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-3 text-[0.75rem] text-[#666] border-t border-dotted border-[#bcd]">
                        <span>
                            Created at:{" "}
                            {new Date(blog.created_at).toLocaleDateString()}
                        </span>

                        <Link
                            href={`/blog/${blog.slug}`}
                            role="button"
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
