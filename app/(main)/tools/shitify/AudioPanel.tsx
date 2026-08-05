"use client";

import { getFFmpeg } from "@/lib/shitify/ffmpeg-client";
import { useObjectUrl } from "@/lib/shitify/use-object-url";
import { useState } from "react";

type AudioPanelProps = { file: File };

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function qualityToBitrateKbps(quality: number) {
    const clamped = Math.min(100, Math.max(0.01, quality));
    return Math.round(8 + (clamped / 100) * 312);
}

export default function AudioPanel({ file }: AudioPanelProps) {
    const [quality, setQuality] = useState(50);
    const [status, setStatus] = useState<
        "idle" | "loading-ffmpeg" | "encoding" | "done" | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);

    async function run() {
        try {
            setStatus("loading-ffmpeg");
            setProgress(0);

            const ffmpeg = await getFFmpeg();
            ffmpeg.on("progress", ({ progress: p }) =>
                setProgress(Math.min(1, Math.max(0, p))),
            );

            setStatus("encoding");

            const inputName =
                "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".mp3");
            const outputName = "output.mp3";

            await ffmpeg.writeFile(
                inputName,
                new Uint8Array(await file.arrayBuffer()),
            );

            await ffmpeg.exec([
                "-i",
                inputName,
                "-acodec",
                "libmp3lame",
                "-b:a",
                `${qualityToBitrateKbps(quality)}k`,
                outputName,
            ]);

            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([new Uint8Array(data as Uint8Array)], {
                type: "audio/mpeg",
            });

            setOutputUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
            });
            setOutputSize(blob.size);
            setStatus("done");

            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }

    const downloadName = file.name.replace(/\.[^.]+$/, "") + "-trashified.mp3";
    const isBusy = status === "loading-ffmpeg" || status === "encoding";
    const bitrate = qualityToBitrateKbps(quality);

    return (
        <fieldset>
            <legend>Audio settings</legend>

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
                        <label htmlFor="audio-quality-slider">
                            Bitrate: {bitrate} kbps
                        </label>
                        <input
                            id="audio-quality-slider"
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
                            Download MP3
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
                        <audio
                            src={previewUrl}
                            controls
                            style={{ width: "100%" }}
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
                            <audio
                                src={outputUrl}
                                controls
                                style={{ width: "100%" }}
                            />
                        </>
                    )}
                </div>
            </div>
        </fieldset>
    );
}
