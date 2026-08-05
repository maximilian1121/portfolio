"use client";

import Explorer from "@/components/Explorer";
import Link from "next/link";

type Tool = {
    id: string;
    title: string;
    usefulness: number;
    description: string;
    category?: string[] | string;
    link?: string;
};

export const TOOLS_DATA: Tool[] = [
    {
        id: "1",
        title: "Shitify",
        usefulness: 0.2,
        link: "/tools/shitify",
        category: ["Multimedia", "Compression"],
        description:
            "Compress and intentionally degrade images, videos, audio, and more with adjustable quality.",
    },
    {
        id: "2",
        title: "Whisper",
        usefulness: 0.8,
        link: "/tools/whisper",
        category: ["Audio", "Transcription"],
        description:
            "Transcribe audio files or live microphone input to text using OpenAI's Whisper model.",
    },
] as const;

export default function Tools() {
    return (
        <>
            <Explorer
                explorerName="Browse Tools"
                initialData={TOOLS_DATA}
                searchableFields={["title", "description"]}
                defaultSort="usefulness"
                sortOptions={[
                    { label: "Name", value: "title" },
                    { label: "Usefulness", value: "usefulness" },
                ]}
                renderItem={(tool) => (
                    <div
                        key={tool.id}
                        className="flex flex-col justify-between min-h-40 p-3 border border-[#b8d6e9] rounded-[3px] shadow-[2px_2px_0px_rgba(0,0,0,0.05)] bg-linear-to-b from-white to-[#f0f7fc]"
                    >
                        <div>
                            <div className="flex items-start justify-between">
                                <h4 className="mb-2 text-[1.1rem] text-[#1e395b]">
                                    {tool.title}
                                </h4>

                                <span className="px-1 flex gap-1">
                                    {(Array.isArray(tool.category)
                                        ? tool.category
                                        : [tool.category]
                                    ).map((cat: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-1 text-[10px] bg-blue-100 border border-blue-200"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                </span>
                            </div>

                            <p className="text-[0.85rem] text-[#444] leading-[1.4]">
                                {tool.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-3 text-[0.75rem] text-[#666] border-t border-dotted border-[#bcd]">
                            <Link
                                role="button"
                                href={tool.link}
                                className="py-2! px-8! text-black no-underline"
                            >
                                Open
                            </Link>
                        </div>
                    </div>
                )}
            />
        </>
    );
}
