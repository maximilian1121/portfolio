"use client";

import { Tooltip } from "@mui/material";
import { formatBytes } from "@/features/tools/shitify/lib/format-bytes";

const SAMPLE_RATES = [8000, 11025, 16000, 22050, 24000, 32000, 44100, 48000];

type VideoStatus =
    | "idle"
    | "loading-ffmpeg"
    | "encoding"
    | "finalizing"
    | "done"
    | "error";

type VideoSettingsProps = {
    quality: number;
    threads: number;
    resolutionScale: number;
    fps: number;
    audioBitrate: number;
    sampleRate: number;
    status: VideoStatus;
    progress: number;
    isBusy: boolean;
    outputUrl: string | null;
    outputSize: number | null;
    fileSize: number;
    downloadName: string;
    onQualityChange: (value: number) => void;
    onThreadsChange: (value: number) => void;
    onResolutionChange: (value: number) => void;
    onFpsChange: (value: number) => void;
    onAudioBitrateChange: (value: number) => void;
    onSampleRateChange: (value: number) => void;
    onRun: () => void;
};

export default function VideoSettings({
    quality,
    threads,
    resolutionScale,
    fps,
    audioBitrate,
    sampleRate,
    status,
    progress,
    isBusy,
    outputUrl,
    outputSize,
    fileSize,
    downloadName,
    onQualityChange,
    onThreadsChange,
    onResolutionChange,
    onFpsChange,
    onAudioBitrateChange,
    onSampleRateChange,
    onRun,
}: VideoSettingsProps) {
    const download = () => {
        if (!outputUrl) return;
        const anchor = document.createElement("a");
        anchor.href = outputUrl;
        anchor.download = downloadName;
        anchor.click();
    };

    const buttonLabel =
        status === "loading-ffmpeg"
            ? "Loading engine…"
            : status === "encoding"
              ? "Shitifying…"
              : status === "finalizing"
                ? "Finishing up…"
                : "Shitify";

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
                    onChange={(event) =>
                        onQualityChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                />

                <Tooltip title="Scales the video's width and height down before encoding. Lower = blockier and smaller.">
                    <label htmlFor="video-resolution-slider">
                        Resolution: {resolutionScale}%
                    </label>
                </Tooltip>
                <input
                    id="video-resolution-slider"
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={resolutionScale}
                    onChange={(event) =>
                        onResolutionChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                />

                <Tooltip title="Lower frame rates make motion choppier and shrink the file.">
                    <label htmlFor="video-fps-slider">
                        Frame rate: {fps} fps
                    </label>
                </Tooltip>
                <input
                    id="video-fps-slider"
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={fps}
                    onChange={(event) => onFpsChange(Number(event.target.value))}
                    disabled={isBusy}
                />

                <label htmlFor="video-audio-bitrate-slider">
                    Audio bitrate: {audioBitrate} kbps
                </label>
                <input
                    id="video-audio-bitrate-slider"
                    type="range"
                    min={8}
                    max={320}
                    step={8}
                    value={audioBitrate}
                    onChange={(event) =>
                        onAudioBitrateChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                />

                <label htmlFor="video-sample-rate-select">Sample rate</label>
                <select
                    id="video-sample-rate-select"
                    value={sampleRate}
                    onChange={(event) =>
                        onSampleRateChange(Number(event.target.value))
                    }
                    disabled={isBusy}
                >
                    {SAMPLE_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                            {rate.toLocaleString()} Hz
                        </option>
                    ))}
                </select>

                <Tooltip title="More threads can speed up encoding, but use more CPU. Avoid exceeding the number of CPU cores.">
                    <label htmlFor="video-threads-slider">
                        Threads: {threads}
                    </label>
                </Tooltip>
                <input
                    id="video-threads-slider"
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={threads}
                    onChange={(event) =>
                        onThreadsChange(Number(event.target.value))
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
                <button className="default" onClick={onRun} disabled={isBusy}>
                    {buttonLabel}
                </button>
                <button disabled={!outputUrl} onClick={download}>
                    Download MP4
                </button>
            </div>

            {outputSize !== null && (
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    {formatBytes(fileSize)} → {formatBytes(outputSize)}
                </span>
            )}

            {status === "error" && (
                <p style={{ color: "#a00", margin: 0 }}>
                    Something went wrong encoding this file.
                </p>
            )}
        </div>
    );
}
