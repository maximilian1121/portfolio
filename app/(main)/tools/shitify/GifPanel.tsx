"use client";

import { getFFmpeg, resetFFmpeg } from "@/lib/shitify/ffmpeg-client";
import { useObjectUrl } from "@/lib/shitify/use-object-url";
import { useEffect, useState } from "react";

type GifPanelProps = { file: File };

type GifHeaderInfo = {
    width: number;
    height: number;
    frameCount: number;
    fps: number | null;
};

// Reads the GIF89a block structure directly off the bytes so we can show
// the original dimensions, frame count, and framerate without needing
// ffprobe (which does not exist in wasm land). GIF has no single "fps"
// field, so we average the per frame delay from each Graphic Control
// Extension instead, same trick browsers use to animate the thing.
function parseGifHeader(buf: ArrayBuffer): GifHeaderInfo | null {
    const b = new Uint8Array(buf);
    if (b.length < 13) return null;

    const sig = String.fromCharCode(b[0], b[1], b[2], b[3], b[4], b[5]);
    if (sig !== "GIF87a" && sig !== "GIF89a") return null;

    const width = b[6] | (b[7] << 8);
    const height = b[8] | (b[9] << 8);

    let i = 13;
    if (b[10] & 0x80) {
        const size = 2 << (b[10] & 0x07);
        i += size * 3;
    }

    const skipSubBlocks = (pos: number) => {
        let p = pos;
        while (p < b.length && b[p] !== 0) p += b[p] + 1;
        return p + 1;
    };

    let frameCount = 0;
    let totalDelayCs = 0;
    let delaySamples = 0;

    while (i < b.length) {
        const marker = b[i];
        if (marker === 0x3b) break; // trailer, we're done
        if (marker === 0x21) {
            // extension block, 0xf9 is the graphic control extension
            if (b[i + 1] === 0xf9) {
                totalDelayCs += b[i + 4] | (b[i + 5] << 8);
                delaySamples++;
            }
            i = skipSubBlocks(i + 2);
        } else if (marker === 0x2c) {
            // image descriptor, an actual visible frame
            frameCount++;
            const localFlags = b[i + 9];
            let p = i + 10;
            if (localFlags & 0x80) {
                const size = 2 << (localFlags & 0x07);
                p += size * 3;
            }
            p += 1; // lzw min code size byte
            i = skipSubBlocks(p);
        } else {
            break; // malformed or unrecognized, bail out gracefully
        }
    }

    let fps: number | null = null;
    if (delaySamples > 0) {
        const avgDelayCs = totalDelayCs / delaySamples;
        // GIF encoders love writing 0, browsers clamp that to ~10cs.
        const effectiveDelayCs = avgDelayCs < 2 ? 10 : avgDelayCs;
        fps = Math.round((100 / effectiveDelayCs) * 10) / 10;
    }

    return { width, height, frameCount, fps };
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// Higher quality = fewer regrets. We map 1..100 onto ffmpeg's mjpeg
// q:v scale, which runs 2 (great) to 31 (crime scene), backwards from
// every other quality slider on earth.
function qualityToQv(quality: number) {
    const clamped = Math.min(100, Math.max(1, quality));
    return Math.round(2 + ((100 - clamped) / 100) * 29);
}

const MAX_FRAMES = 500;
const num = (i: number) => String(i).padStart(4, "0");

export default function GifPanel({ file }: GifPanelProps) {
    const [quality, setQuality] = useState(20);
    const [fps, setFps] = useState(10);
    const [scale, setScale] = useState(100);
    const [passes, setPasses] = useState(3);
    const [status, setStatus] = useState<
        | "idle"
        | "extracting"
        | "crunching"
        | "rebuilding"
        | "upscaling"
        | "done"
        | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const [frameInfo, setFrameInfo] = useState<{
        total: number;
        current: number;
    } | null>(null);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);
    const [originalInfo, setOriginalInfo] = useState<GifHeaderInfo | null>(
        null,
    );

    // Sniff the original gif's own stats, and default the fps slider to
    // whatever it was already running at instead of a made up number.
    useEffect(() => {
        let cancelled = false;
        setOriginalInfo(null);
        file.arrayBuffer().then((buf) => {
            if (cancelled) return;
            const info = parseGifHeader(buf);
            if (!info) return;
            setOriginalInfo(info);
            if (info.fps) {
                setFps(Math.min(30, Math.max(1, Math.round(info.fps))));
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    async function run() {
        try {
            setStatus("extracting");
            setProgress(0);
            setFrameInfo(null);

            // The shared ffmpeg instance never frees memory between exec
            // calls, and this panel is the heaviest user of exec by a
            // wide margin. Start every run with a fresh worker so heap
            // growth from previous runs can't eventually trap it.
            await resetFFmpeg();
            const ffmpeg = await getFFmpeg();

            const scaleFilter =
                scale < 100
                    ? `,scale=trunc(iw*${scale / 100}/2)*2:trunc(ih*${scale / 100}/2)*2`
                    : "";

            await ffmpeg.writeFile(
                "input.gif",
                new Uint8Array(await file.arrayBuffer()),
            );

            // Step 1: shatter the gif into individual frames.
            await ffmpeg.exec([
                "-i",
                "input.gif",
                "-vf",
                `fps=${fps}${scaleFilter}`,
                "frame_%04d.png",
            ]);

            // No ffprobe in the browser, so we just count until reads fail.
            let count = 0;
            for (let i = 1; i <= MAX_FRAMES; i++) {
                try {
                    await ffmpeg.readFile(`frame_${num(i)}.png`);
                    count = i;
                } catch {
                    break;
                }
            }

            if (count === 0) {
                throw new Error("No frames extracted, gif may be corrupt");
            }

            setFrameInfo({ total: count, current: 0 });
            setStatus("crunching");

            const qv = qualityToQv(quality);
            const totalSteps = count * passes;
            let doneSteps = 0;

            // Step 2: run every frame through jpeg's meat grinder, N times
            // each, because one pass of mediocrity is never enough.
            for (let i = 1; i <= count; i++) {
                let currentInput = `frame_${num(i)}.png`;

                for (let p = 1; p <= passes; p++) {
                    const out =
                        p === passes
                            ? `crunched_${num(i)}.jpg`
                            : `pass_${p}_${num(i)}.jpg`;

                    await ffmpeg.exec([
                        "-i",
                        currentInput,
                        "-q:v",
                        String(qv),
                        out,
                    ]);

                    if (currentInput !== `frame_${num(i)}.png`) {
                        await ffmpeg.deleteFile(currentInput).catch(() => {});
                    }
                    currentInput = out;

                    doneSteps++;
                    setProgress(doneSteps / totalSteps);
                }

                await ffmpeg.deleteFile(`frame_${num(i)}.png`).catch(() => {});
                setFrameInfo({ total: count, current: i });
            }

            setStatus("rebuilding");

            // Step 3: build a palette from the wreckage, then reassemble
            // it into a gif that never asked for any of this.
            await ffmpeg.exec([
                "-start_number",
                "1",
                "-framerate",
                String(fps),
                "-i",
                "crunched_%04d.jpg",
                "-vf",
                "palettegen=stats_mode=diff",
                "palette.png",
            ]);

            await ffmpeg.exec([
                "-start_number",
                "1",
                "-framerate",
                String(fps),
                "-i",
                "crunched_%04d.jpg",
                "-i",
                "palette.png",
                "-lavfi",
                "paletteuse=dither=bayer",
                "output.gif",
            ]);

            // Step 4: if we shrank it earlier, blow it back up to the
            // original dimensions with plain linear (bilinear) filtering
            // so the low-res crunch is stretched back out rather than
            // just staying small. This is where the "upscaled jpeg"
            // texture actually shows up.
            let finalGifName = "output.gif";
            if (scale < 100 && originalInfo) {
                setStatus("upscaling");
                await ffmpeg.exec([
                    "-i",
                    "output.gif",
                    "-vf",
                    `scale=${originalInfo.width}:${originalInfo.height}:flags=bilinear`,
                    "upscaled.gif",
                ]);
                finalGifName = "upscaled.gif";
            }

            const data = await ffmpeg.readFile(finalGifName);
            const blob = new Blob([new Uint8Array(data as Uint8Array)], {
                type: "image/gif",
            });

            setOutputUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
            });
            setOutputSize(blob.size);
            setStatus("done");
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            // Terminating wipes the virtual FS for free, and hands back
            // a clean worker for the audio/image panels so they don't
            // inherit however much heap this run chewed through.
            await resetFFmpeg();
        }
    }

    const downloadName = file.name.replace(/\.[^.]+$/, "") + "-trashified.gif";
    const isBusy =
        status === "extracting" ||
        status === "crunching" ||
        status === "rebuilding" ||
        status === "upscaling";

    const statusLabel =
        status === "extracting"
            ? "Extracting frames…"
            : status === "crunching"
              ? frameInfo
                  ? `Deep-frying frame ${frameInfo.current}/${frameInfo.total}…`
                  : "Deep-frying…"
              : status === "rebuilding"
                ? "Rebuilding gif…"
                : status === "upscaling"
                  ? "Blowing it back up…"
                  : "Crunch it";

    return (
        <fieldset>
            <legend>Gif settings</legend>

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
                            onChange={(e) => setQuality(Number(e.target.value))}
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
                            onChange={(e) => setPasses(Number(e.target.value))}
                            disabled={isBusy}
                        />

                        <label htmlFor="gif-fps-slider">
                            Frame rate: {fps} fps
                            {originalInfo?.fps && (
                                <span
                                    style={{
                                        opacity: 0.7,
                                        fontWeight: "normal",
                                    }}
                                >
                                    {" "}
                                    (original ~{originalInfo.fps})
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
                            onChange={(e) => setFps(Number(e.target.value))}
                            disabled={isBusy}
                        />

                        <label htmlFor="gif-scale-slider">
                            Crunch resolution: {scale}%
                            {originalInfo && (
                                <span
                                    style={{
                                        opacity: 0.7,
                                        fontWeight: "normal",
                                    }}
                                >
                                    {" "}
                                    (original {originalInfo.width}x
                                    {originalInfo.height}, output gets stretched
                                    back to this)
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
                            onChange={(e) => setScale(Number(e.target.value))}
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
                            Download GIF
                        </button>
                    </div>

                    {outputSize !== null && (
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {formatBytes(file.size)} → {formatBytes(outputSize)}
                        </span>
                    )}

                    {status === "error" && (
                        <p style={{ color: "#a00", margin: 0 }}>
                            Something went wrong crunching this gif. Check the
                            console, blame ffmpeg, or both.
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
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "nowrap",
                    }}
                >
                    <div style={{ flex: "1 1 0", minWidth: 0 }}>
                        <p
                            style={{
                                fontWeight: "bold",
                                margin: "0 0 0.25rem",
                            }}
                        >
                            Original
                        </p>
                        {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt="Original"
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    height: "auto",
                                    display: "block",
                                    border: "1px solid #999",
                                }}
                            />
                        )}
                        <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {formatBytes(file.size)}
                            {originalInfo && (
                                <>
                                    {" "}
                                    · {originalInfo.width}x{originalInfo.height}
                                    px · {originalInfo.frameCount} frames
                                    {originalInfo.fps && (
                                        <> · ~{originalInfo.fps} fps</>
                                    )}
                                </>
                            )}
                        </p>
                    </div>

                    <div style={{ flex: "1 1 0", minWidth: 0 }}>
                        <p
                            style={{
                                fontWeight: "bold",
                                margin: "0 0 0.25rem",
                            }}
                        >
                            Trashified
                        </p>
                        {outputUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={outputUrl}
                                alt="Trashified"
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    height: "auto",
                                    display: "block",
                                    border: "1px solid #999",
                                }}
                            />
                        ) : (
                            <p>Nothing yet. Hit crunch it.</p>
                        )}
                        {outputSize !== null && (
                            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                                {formatBytes(outputSize)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </fieldset>
    );
}
