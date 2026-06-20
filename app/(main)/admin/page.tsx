"use client";

import { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import { Editor } from "@monaco-editor/react";
import { createClient } from "@/utils/supabase/client";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import {
    serialize,
    type SerializeResult,
} from "next-mdx-remote-client/serialize";
import { MDXClient } from "next-mdx-remote-client/csr";
import { useMDXComponents } from "@/mdx-components";
import AdminBlogExplorer from "./AdminBlogExporer";
import {
    LuAppWindow,
    LuAppWindowMac,
    LuCross,
    LuPanelTopClose,
} from "react-icons/lu";
import { MdClose } from "react-icons/md";

type Blog = {
    id: string;
    created_at: string;
    title: string;
    slug: string;
    content: string;
};

type EditorTab = {
    id: string;
    title: string;
    slug: string;
    content: string;
    isNew: boolean;
    blogId?: string;
    dirty?: boolean;
    showPreview?: boolean;
};

const LS_KEY = "mdx_admin_tabs_v1";

const slugify = (s: string) =>
    s
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

const newTab = (title: string): EditorTab => ({
    id: crypto.randomUUID(),
    title,
    slug: slugify(title),
    content: "",
    isNew: true,
    dirty: false,
    showPreview: true,
});

export default function Admin() {
    const supabase = createClient();

    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [serialized, setSerialized] = useState<SerializeResult | null>(null);

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem(LS_KEY);

        if (raw) {
            const parsed: EditorTab[] = JSON.parse(raw);
            setTabs(parsed);
            setActiveId(parsed[0]?.id ?? null);
        } else {
            const t = newTab("Untitled");
            setTabs([t]);
            setActiveId(t.id);
        }
    }, []);

    useEffect(() => {
        if (!tabs.length) return;
        localStorage.setItem(LS_KEY, JSON.stringify(tabs));
    }, [tabs]);

    const activeTab = tabs.find((t) => t.id === activeId) ?? null;

    useEffect(() => {
        if (!activeTab?.content || !activeTab.showPreview) {
            setSerialized(null);
            return;
        }

        const t = setTimeout(async () => {
            try {
                const res = await serialize({
                    source: activeTab.content,
                    options: {
                        mdxOptions: {
                            remarkPlugins: [remarkMath],
                            rehypePlugins: [rehypeKatex],
                        },
                    },
                });

                setSerialized(res);
            } catch (e) {
                setSerialized({ error: e as Error } as any);
            }
        }, 120);

        return () => clearTimeout(t);
    }, [activeTab?.content, activeTab?.showPreview]);

    const updateActive = (patch: Partial<EditorTab>) => {
        if (!activeId) return;

        setTabs((prev) =>
            prev.map((t) =>
                t.id === activeId ? { ...t, ...patch, dirty: true } : t,
            ),
        );
    };

    const saveActive = async () => {
        if (!activeTab) return;

        const payload = {
            title: activeTab.title,
            slug: activeTab.slug,
            content: activeTab.content,
        };

        if (activeTab.isNew) {
            const { data } = await supabase
                .from("blog")
                .insert(payload)
                .select()
                .single();

            if (data) {
                setTabs((prev) =>
                    prev.map((t) =>
                        t.id === activeId
                            ? {
                                  ...t,
                                  isNew: false,
                                  blogId: data.id,
                                  dirty: false,
                              }
                            : t,
                    ),
                );
            }
        } else {
            await supabase
                .from("blog")
                .update(payload)
                .eq("id", activeTab.blogId);

            setTabs((prev) =>
                prev.map((t) =>
                    t.id === activeId ? { ...t, dirty: false } : t,
                ),
            );
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveActive();
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [activeTab]);

    const createTab = () => {
        const title = prompt("New post title?") || "Untitled";
        const t = newTab(title);

        setTabs((prev) => [...prev, t]);
        setActiveId(t.id);
    };

    const openBlogForEdit = (blog: Blog) => {
        const existing = tabs.find((t) => t.blogId === blog.id);

        if (existing) {
            setActiveId(existing.id);
            return;
        }

        const t: EditorTab = {
            id: crypto.randomUUID(),
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            isNew: false,
            blogId: blog.id,
            dirty: false,
            showPreview: true,
        };

        setTabs((prev) => [...prev, t]);
        setActiveId(t.id);
    };

    const closeTab = (id: string) => {
        setTabs((prev) => prev.filter((t) => t.id !== id));

        if (activeId === id) {
            const next = tabs.find((t) => t.id !== id);
            setActiveId(next?.id ?? null);
        }
    };

    return (
        <div className="h-full w-full flex">
            <div className="w-[20%] border-r">
                <AdminBlogExplorer onOpenInEditor={openBlogForEdit} />
            </div>

            <div className="flex-1 flex flex-col">
                <menu role="tablist" className="gap-2 flex">
                    <button onClick={createTab} role="tab">
                        + New
                    </button>

                    {tabs.map((t) => (
                        <button
                            role="tab"
                            key={t.id}
                            onClick={() => setActiveId(t.id)}
                            className={`flex! gap-2 items-center ${
                                t.id === activeId ? "default" : ""
                            }`}
                        >
                            {t.dirty ? "● " : ""}
                            {t.title}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(t.id);
                                }}
                                className="flex items-center cursor-pointer h-1"
                            >
                                <MdClose />
                            </button>
                        </button>
                    ))}

                    <button onClick={saveActive} className="ml-auto win7-tab">
                        Save
                    </button>
                </menu>

                <div className="flex flex-1 min-h-0">
                    <div className="w-1/2">
                        <Editor
                            height="100%"
                            value={activeTab?.content ?? ""}
                            defaultLanguage="mdx"
                            onMount={(e) => (editorRef.current = e)}
                            onChange={(v) =>
                                updateActive({
                                    content: v || "",
                                })
                            }
                        />
                    </div>

                    <div className="w-1/2 overflow-auto p-6 prose prose-sm max-w-none">
                        {activeTab?.showPreview && serialized ? (
                            "error" in serialized ? (
                                <pre className="text-red-500">
                                    {serialized.error?.message}
                                </pre>
                            ) : (
                                <MDXClient
                                    {...serialized}
                                    components={useMDXComponents({})}
                                />
                            )
                        ) : (
                            <p className="text-gray-400">Preview disabled</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
