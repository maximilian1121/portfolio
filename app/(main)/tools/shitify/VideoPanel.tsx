"use client";

import { getFFmpeg } from "@/lib/shitify/ffmpeg-client";
import { useObjectUrl } from "@/lib/shitify/use-object-url";
import { useEffect, useRef, useState } from "react";

type VideoPanelProps = { file: File };

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function qualityToCrf(quality: number) {
    const clamped = Math.min(100, Math.max(0.01, quality));
    return Math.round(51 - (clamped / 100) * 33);
}

export default function VideoPanel({ file }: VideoPanelProps) {
    const [quality, setQuality] = useState(50);
    const [status, setStatus] = useState<
        "idle" | "loading-ffmpeg" | "encoding" | "finalizing" | "done" | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);

    const [log, setLog] = useState<string[]>([]);
    const logBoxRef = useRef<HTMLPreElement | null>(null);
    const logListenerRef = useRef<((e: { message: string }) => void) | null>(
        null,
    );

    function appendLog(line: string) {
        setLog((prev) => {
            // Keep the log bounded so a long encode doesn't blow up memory/DOM.
            const next =
                prev.length > 500 ? prev.slice(prev.length - 500) : prev;
            return [...next, line];
        });
    }

    useEffect(() => {
        // Auto-scroll to bottom as new lines come in.
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
    }, [log]);

    async function run() {
        try {
            setStatus("loading-ffmpeg");
            setProgress(0);
            setLog([]);

            const ffmpeg = await getFFmpeg();

            // Clean up any listener from a previous run before attaching new ones.
            if (logListenerRef.current) {
                ffmpeg.off("log", logListenerRef.current);
            }

            const onLog = ({ message }: { message: string }) => {
                appendLog(message);
            };
            logListenerRef.current = onLog;
            ffmpeg.on("log", onLog);

            ffmpeg.on("progress", ({ progress: p }) =>
                // Cap displayed progress below 100% until we actually have
                // output bytes in hand — ffmpeg's last progress event often
                // fires slightly before exec() truly resolves, which made
                // the bar look "done" before the file was ready.
                setProgress(Math.min(0.95, Math.max(0, p))),
            );

            setStatus("encoding");

            const inputName =
                "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".mp4");
            const outputName = "output.mp4";

            await ffmpeg.writeFile(
                inputName,
                new Uint8Array(await file.arrayBuffer()),
            );

            await ffmpeg.exec([
                "-i",
                inputName,
                "-threads",
                "2",
                "-vcodec",
                "libx264",
                "-crf",
                String(qualityToCrf(quality)),
                "-preset",
                "ultrafast",
                "-acodec",
                "aac",
                "-b:a",
                "96k",
                outputName,
            ]);

            // exec() has resolved but we still need to pull the file out of
            // ffmpeg's virtual FS and build a blob — give that its own
            // visible state instead of letting the bar sit at 100% doing
            // nothing.
            setStatus("finalizing");
            setProgress(0.97);

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([new Uint8Array(data as Uint8Array)], {
                type: "video/mp4",
            });

            setOutputUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
            });
            setOutputSize(blob.size);
            setProgress(1);
            setStatus("done");

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (err) {
            console.error(err);
            appendLog(
                `[error] ${err instanceof Error ? err.message : String(err)}`,
            );
            setStatus("error");
        }
    }

    const downloadName = file.name.replace(/\.[^.]+$/, "") + "-trashified.mp4";
    const isBusy =
        status === "loading-ffmpeg" ||
        status === "encoding" ||
        status === "finalizing";

    return (
        <fieldset>
            <legend>Video settings</legend>

            <div
                style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                {/* ===== CONTROLS ===== */}
                <div
                    style={{
                        flex: "0 0 240px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        minWidth: 200,
                    }}
                >
                    <div className="group">
                        <label htmlFor="video-quality-slider">
                            Quality: {quality.toFixed(2)}%
                        </label>
                        <input
                            id="video-quality-slider"
                            type="range"
                            min={0.01}
                            max={100}
                            step={0.01}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            disabled={isBusy}
                        />
                    </div>

                    {isBusy && (
                        <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress * 100)}
                        >
                            <div
                                style={{
                                    width: `${Math.round(progress * 100)}%`,
                                }}
                            />
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            className="default"
                            onClick={run}
                            disabled={isBusy}
                        >
                            {status === "loading-ffmpeg"
                                ? "Loading engine…"
                                : status === "encoding"
                                  ? "Shitifying…"
                                  : status === "finalizing"
                                    ? "Finishing up…"
                                    : "Shitify"}
                        </button>

                        <button
                            disabled={!outputUrl}
                            onClick={() => {
                                if (!outputUrl) return;
                                const a = document.createElement("a");
                                a.href = outputUrl;
                                a.download = downloadName;
                                a.click();
                            }}
                        >
                            Download MP4
                        </button>
                    </div>

                    {outputSize !== null && (
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {formatBytes(file.size)} → {formatBytes(outputSize)}
                        </span>
                    )}

                    {status === "error" && (
                        <p style={{ color: "#a00", margin: 0 }}>
                            Something went wrong encoding this file.
                        </p>
                    )}
                </div>

                {/* ===== PREVIEW ===== */}
                <div
                    style={{
                        flex: "1 1 0",
                        minWidth: 280,
                        borderLeft: "1px solid #999",
                        paddingLeft: "1.5rem",
                    }}
                >
                    {previewUrl && (
                        <video
                            src={previewUrl}
                            controls
                            style={{
                                width: "100%",
                                maxHeight: 300,
                                border: "1px solid #999",
                            }}
                        />
                    )}
                    {outputUrl && (
                        <>
                            <p
                                style={{
                                    fontWeight: "bold",
                                    margin: "0.75rem 0 0.25rem",
                                }}
                            >
                                Trashified
                            </p>
                            <video
                                src={outputUrl}
                                controls
                                style={{
                                    width: "100%",
                                    maxHeight: 300,
                                    border: "1px solid #999",
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
            <>
                {log.length > 0 && (
                    <div className="group">
                        <label>ffmpeg output</label>
                        <pre
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
                            {log.join("\n")}
                        </pre>
                    </div>
                )}
            </>
        </fieldset>
    );
}
