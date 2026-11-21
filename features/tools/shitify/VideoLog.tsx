"use client";

import { useEffect, useRef } from "react";

export default function VideoLog({ lines }: { lines: string[] }) {
    const logBoxRef = useRef<HTMLPreElement | null>(null);

    useEffect(() => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [lines]);

    if (lines.length === 0) return null;

    return (
        <div className="group">
            <label htmlFor="ffmpeg-output">ffmpeg output</label>
            <pre
                id="ffmpeg-output"
                ref={logBoxRef}
                style={{
                    margin: 0,
                    background: "#111",
                    color: "#0f0",
                    fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: "0.7rem",
                    lineHeight: 1.4,
                    padding: "0.5rem",
                    height: 300,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    border: "1px solid #999",
                }}
            >
                {lines.join("\n")}
            </pre>
        </div>
    );
}
