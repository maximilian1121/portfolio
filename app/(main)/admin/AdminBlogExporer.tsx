"use client";

import Explorer from "@/components/Explorer";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

type Blog = {
    id: string;
    created_at: string;
    title: string;
    slug: string;
    content: string;
};

type ActionModalState =
    | { type: "none" }
    | { type: "actions"; blog: Blog }
    | { type: "delete"; blog: Blog }
    | { type: "edit"; blog: Blog }
    | { type: "create" };

type Props = {
    onOpenInEditor?: (blog: Blog) => void;
};

export default function AdminBlogExplorer({ onOpenInEditor }: Props) {
    const [modal, setModal] = useState<ActionModalState>({ type: "none" });
    const [editTitle, setEditTitle] = useState("");
    const [editSlug, setEditSlug] = useState("");
    const [editContent, setEditContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const supabase = createClient();

    const closeModal = () => setModal({ type: "none" });
    const openActions = (blog: Blog) => setModal({ type: "actions", blog });
    const openDelete = (blog: Blog) => setModal({ type: "delete", blog });

    const openEdit = (blog: Blog) => {
        setEditTitle(blog.title);
        setEditSlug(blog.slug);
        setEditContent(blog.content);
        setModal({ type: "edit", blog });
    };

    const openCreate = () => {
        setEditTitle("");
        setEditSlug("");
        setEditContent("");
        setModal({ type: "create" });
    };

    const handleDelete = async () => {
        if (modal.type !== "delete") return;
        setLoading(true);
        await supabase.from("blog").delete().eq("id", modal.blog.id);
        setLoading(false);
        closeModal();
        setRefreshKey((k) => k + 1);
    };

    const handleEdit = async () => {
        if (modal.type !== "edit") return;
        setLoading(true);
        await supabase
            .from("blog")
            .update({ title: editTitle, slug: editSlug, content: editContent })
            .eq("id", modal.blog.id);
        setLoading(false);
        closeModal();
        setRefreshKey((k) => k + 1);
    };

    const handleCreate = async () => {
        if (modal.type !== "create") return;
        setLoading(true);
        await supabase.from("blog").insert({
            title: editTitle,
            slug: editSlug,
            content: editContent,
        });
        setLoading(false);
        closeModal();
        setRefreshKey((k) => k + 1);
    };

    const windowBodyStyle = { padding: "12px 16px" };

    return (
        <>
            <Modal
                open={modal.type === "actions"}
                onClose={closeModal}
                className="flex"
            >
                <div className="window active glass w-sm mx-auto my-auto">
                    <div className="title-bar">
                        <div className="title-bar-text">
                            {modal.type === "actions"
                                ? `"${modal.blog.title}"`
                                : "Blog post actions"}
                        </div>
                        <div className="title-bar-controls">
                            <button aria-label="Close" onClick={closeModal} />
                        </div>
                    </div>
                    <div className="window-body" style={windowBodyStyle}>
                        {modal.type === "actions" && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-[#444] mb-1">
                                    What would you like to do with this post?
                                </p>
                                {onOpenInEditor && (
                                    <button
                                        className="w-full"
                                        onClick={() => {
                                            onOpenInEditor(modal.blog);
                                            closeModal();
                                        }}
                                    >
                                        Open in Editor
                                    </button>
                                )}
                                <Link
                                    href={`/blog/${modal.blog.slug}`}
                                    target="_blank"
                                    className="w-full"
                                >
                                    <button className="w-full">
                                        View Post
                                    </button>
                                </Link>
                                <button
                                    onClick={() => openDelete(modal.blog)}
                                    className="w-full"
                                    style={{ color: "red" }}
                                >
                                    Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                open={modal.type === "delete"}
                onClose={closeModal}
                className="flex"
            >
                <div className="window active glass w-sm mx-auto my-auto">
                    <div className="title-bar">
                        <div className="title-bar-text">Confirm Deletion</div>
                        <div className="title-bar-controls">
                            <button aria-label="Close" onClick={closeModal} />
                        </div>
                    </div>
                    <div className="window-body" style={windowBodyStyle}>
                        {modal.type === "delete" && (
                            <>
                                <div
                                    className="flex gap-3 items-start mb-4"
                                    style={{
                                        padding: "8px",
                                        border: "1px solid #c00",
                                        background: "#fff5f5",
                                    }}
                                >
                                    <p className="text-sm">
                                        Are you sure you want to delete{" "}
                                        <strong>"{modal.blog.title}"</strong>?
                                        This cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={closeModal}>Cancel</button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        style={{ color: "red" }}
                                    >
                                        {loading
                                            ? "Deleting..."
                                            : "Yes, delete it"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="flex flex-col h-full w-full">
                <Explorer
                    key={refreshKey}
                    explorerName="Browse Posts"
                    fetchData={async ({
                        search,
                        sortBy,
                        order,
                        page,
                        pageSize,
                    }) => {
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
                        const { data } = await query.range(
                            from,
                            from + pageSize - 1,
                        );

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
                    renderItem={(blog: Blog) => (
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
                                            .replace(
                                                /<[^>]*>[\s\S]*?<\/[^>]*>/gi,
                                                "",
                                            )
                                            .replace(/<[^>]*\/>/gi, "")
                                            .replace(
                                                /([#*~_`]|\[.*?\]\(.*?\))/g,
                                                "",
                                            )
                                            .trim();
                                        return cleanText.length > 100
                                            ? cleanText.substring(0, 100) +
                                                  "..."
                                            : cleanText;
                                    })()}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 mt-3 text-[0.75rem] text-[#666] border-t border-dotted border-[#bcd]">
                                <span>
                                    Created:{" "}
                                    {new Date(
                                        blog.created_at,
                                    ).toLocaleDateString()}
                                </span>
                                <button
                                    className="py-2! px-8! text-black no-underline"
                                    onClick={() => openActions(blog)}
                                >
                                    Actions
                                </button>
                            </div>
                        </div>
                    )}
                />
            </div>
        </>
    );
}
