"use client";

import type { GifHeaderInfo } from "./gif-utils";
import { formatBytes } from "@/features/tools/shitify/lib/format-bytes";

type GifSettingsProps = {
    quality: number;
    passes: number;
    fps: number;
    scale: number;
    originalInfo: GifHeaderInfo | null;
    isBusy: boolean;
    progress: number;
    statusLabel: string;
    status: string;
    outputUrl: string | null;
    outputSize: number | null;
    fileSize: number;
    downloadName: string;
    onQualityChange: (value: number) => void;
    onPassesChange: (value: number) => void;
    onFpsChange: (value: number) => void;
    onScaleChange: (value: number) => void;
    onRun: () => void;
};

export default function GifSettings({
    quality,
    passes,
    fps,
    scale,
    originalInfo,
    isBusy,
    progress,
    statusLabel,
    status,
    outputUrl,
    outputSize,
    fileSize,
    downloadName,
    onQualityChange,
    onPassesChange,
    onFpsChange,
    onScaleChange,
    onRun,
}: GifSettingsProps) {
    const download = () => {
        if (!outputUrl) return;
        const anchor = document.createElement("a");
        anchor.href = outputUrl;
        anchor.download = downloadName;
        anchor.click();
    };

    return (
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
                <label htmlFor="gif-quality-slider">
                    JPEG quality: {quality}%
                </label>
                <input
                    id="gif-quality-slider"
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(event) =>
                        onQualityChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                />

                <label htmlFor="gif-passes-slider">
                    Deep fry passes: {passes}
                </label>
                <input
                    id="gif-passes-slider"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={passes}
                    onChange={(event) =>
                        onPassesChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                />

                <label htmlFor="gif-fps-slider">
                    Frame rate: {fps} fps
                    {originalInfo?.fps && (
                        <span style={{ opacity: 0.7, fontWeight: "normal" }}>
                            {" "}(original ~{originalInfo.fps})
                        </span>
                    )}
                </label>
                <input
                    id="gif-fps-slider"
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={fps}
                    onChange={(event) => onFpsChange(Number(event.target.value))}
                    disabled={isBusy}
                />

                <label htmlFor="gif-scale-slider">
                    Crunch resolution: {scale}%
                    {originalInfo && (
                        <span style={{ opacity: 0.7, fontWeight: "normal" }}>
                            {" "}(original {originalInfo.width}x
                            {originalInfo.height}, output gets stretched back to
                            this)
                        </span>
                    )}
                </label>
                <input
                    id="gif-scale-slider"
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={scale}
                    onChange={(event) =>
                        onScaleChange(Number(event.target.value))
                    }
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
                    <div style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                    className="default"
                    onClick={onRun}
                    disabled={isBusy}
                >
                    {statusLabel}
                </button>

                <button disabled={!outputUrl} onClick={download}>
                    Download GIF
                </button>
            </div>

            {outputSize !== null && (
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    {formatBytes(fileSize)} → {formatBytes(outputSize)}
                </span>
            )}

            {status === "error" && (
                <p style={{ color: "#a00", margin: 0 }}>
                    Something went wrong crunching this gif. Check the console,
                    blame ffmpeg, or both.
                </p>
            )}
        </div>
    );
}
