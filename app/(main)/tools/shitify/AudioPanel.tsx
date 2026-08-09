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

const SAMPLE_RATES = [8000, 11025, 16000, 22050, 24000, 32000, 44100, 48000];

export default function AudioPanel({ file }: AudioPanelProps) {
    const [quality, setQuality] = useState(50);
    const [sampleRate, setSampleRate] = useState(44100);
    const [channels, setChannels] = useState<"mono" | "stereo">("stereo");
    const [passes, setPasses] = useState(1);
    const [status, setStatus] = useState<
        "idle" | "loading-ffmpeg" | "encoding" | "done" | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const [passInfo, setPassInfo] = useState<{
        total: number;
        current: number;
    } | null>(null);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);

    async function run() {
        try {
            setStatus("loading-ffmpeg");
            setProgress(0);
            setPassInfo(null);

            const ffmpeg = await getFFmpeg();

            setStatus("encoding");

            const inputName =
                "input" + (file.name.match(/\.[^.]+$/)?.[0] ?? ".mp3");

            await ffmpeg.writeFile(
                inputName,
                new Uint8Array(await file.arrayBuffer()),
            );

            const kbps = qualityToBitrateKbps(quality);
            const totalPasses = Math.max(1, Math.round(passes));

            // The whole "compress the compression" bit: lame it down to
            // garbage, decode that garbage back to full PCM (the
            // "upscale"), then lame it down again from there. The wav
            // round trip doesn't recover any of the lost detail, it just
            // hands the next mp3 pass a clean canvas to smear the same
            // artifacts onto again, so they compound instead of just
            // re-applying the same loss once.
            let currentInput = inputName;
            let currentIsMp3 = false;
            const tempFiles: string[] = [];

            for (let p = 1; p <= totalPasses; p++) {
                setPassInfo({ total: totalPasses, current: p });
                setProgress((p - 1) / totalPasses);

                const mp3Out = `pass_${p}.mp3`;
                await ffmpeg.exec([
                    "-i",
                    currentInput,
                    "-acodec",
                    "libmp3lame",
                    "-b:a",
                    `${kbps}k`,
                    "-ar",
                    String(sampleRate),
                    "-ac",
                    channels === "mono" ? "1" : "2",
                    mp3Out,
                ]);

                if (currentIsMp3) {
                    tempFiles.push(currentInput);
                }

                if (p === totalPasses) {
                    // Last pass: leave it as mp3, that's the final output.
                    currentInput = mp3Out;
                    currentIsMp3 = true;
                    break;
                }

                // "Upscale" back to full PCM so the next pass has fresh,
                // un-quantized samples to mangle instead of piling
                // straight mp3-on-mp3 (ffmpeg would do this implicitly
                // anyway, but doing it explicitly is the whole point).
                const wavOut = `pass_${p}.wav`;
                await ffmpeg.exec([
                    "-i",
                    mp3Out,
                    "-ar",
                    String(sampleRate),
                    "-ac",
                    channels === "mono" ? "1" : "2",
                    wavOut,
                ]);

                tempFiles.push(mp3Out);
                currentInput = wavOut;
                currentIsMp3 = false;

                setProgress(p / totalPasses);
            }

            setProgress(1);

            const data = await ffmpeg.readFile(currentInput);
            const blob = new Blob([new Uint8Array(data as Uint8Array)], {
                type: "audio/mpeg",
            });

            setOutputUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
            });
            setOutputSize(blob.size);
            setStatus("done");

            await ffmpeg.deleteFile(inputName).catch(() => {});
            await ffmpeg.deleteFile(currentInput).catch(() => {});
            for (const f of tempFiles) {
                await ffmpeg.deleteFile(f).catch(() => {});
            }
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }

    const downloadName = file.name.replace(/\.[^.]+$/, "") + "-trashified.mp3";
    const isBusy = status === "loading-ffmpeg" || status === "encoding";
    const bitrate = qualityToBitrateKbps(quality);

    const statusLabel =
        status === "loading-ffmpeg"
            ? "Loading engine…"
            : status === "encoding"
              ? passInfo && passInfo.total > 1
                  ? `Recompressing the compression, pass ${passInfo.current}/${passInfo.total}…`
                  : "Shitifying…"
              : "Shitify";

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

                        <label htmlFor="audio-passes-slider">
                            Recompression passes: {passes}
                        </label>
                        <input
                            id="audio-passes-slider"
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={passes}
                            onChange={(e) => setPasses(Number(e.target.value))}
                            disabled={isBusy}
                        />

                        <label htmlFor="audio-sample-rate-select">
                            Sample rate
                        </label>
                        <select
                            id="audio-sample-rate-select"
                            value={sampleRate}
                            onChange={(e) =>
                                setSampleRate(Number(e.target.value))
                            }
                            disabled={isBusy}
                        >
                            {SAMPLE_RATES.map((hz) => (
                                <option key={hz} value={hz}>
                                    {hz.toLocaleString()} Hz
                                </option>
                            ))}
                        </select>

                        <label htmlFor="audio-channels-select">Channels</label>
                        <select
                            id="audio-channels-select"
                            value={channels}
                            onChange={(e) =>
                                setChannels(e.target.value as "mono" | "stereo")
                            }
                            disabled={isBusy}
                        >
                            <option value="stereo">Stereo</option>
                            <option value="mono">Mono</option>
                        </select>
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
                            {statusLabel}
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
