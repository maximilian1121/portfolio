"use client";

import { getFFmpeg, resetFFmpeg } from "@/features/tools/shitify/lib/ffmpeg-client";
import { useObjectUrl } from "@/features/tools/shitify/lib/use-object-url";
import { useEffect, useState } from "react";
import GifPreview from "./GifPreview";
import GifSettings from "./GifSettings";
import {
    formatFrameNumber,
    MAX_FRAMES,
    parseGifHeader,
    qualityToQv,
    type GifHeaderInfo,
} from "./gif-utils";

type GifPanelProps = { file: File };

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
                    await ffmpeg.readFile(`frame_${formatFrameNumber(i)}.png`);
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
                let currentInput = `frame_${formatFrameNumber(i)}.png`;

                for (let p = 1; p <= passes; p++) {
                    const out =
                        p === passes
                            ? `crunched_${formatFrameNumber(i)}.jpg`
                            : `pass_${p}_${formatFrameNumber(i)}.jpg`;

                    await ffmpeg.exec([
                        "-i",
                        currentInput,
                        "-q:v",
                        String(qv),
                        out,
                    ]);

                    if (currentInput !== `frame_${formatFrameNumber(i)}.png`) {
                        await ffmpeg.deleteFile(currentInput).catch(() => {});
                    }
                    currentInput = out;

                    doneSteps++;
                    setProgress(doneSteps / totalSteps);
                }

                await ffmpeg
                    .deleteFile(`frame_${formatFrameNumber(i)}.png`)
                    .catch(() => {});
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
                <GifSettings
                    quality={quality}
                    passes={passes}
                    fps={fps}
                    scale={scale}
                    originalInfo={originalInfo}
                    isBusy={isBusy}
                    progress={progress}
                    statusLabel={statusLabel}
                    status={status}
                    outputUrl={outputUrl}
                    outputSize={outputSize}
                    fileSize={file.size}
                    downloadName={downloadName}
                    onQualityChange={setQuality}
                    onPassesChange={setPasses}
                    onFpsChange={setFps}
                    onScaleChange={setScale}
                    onRun={run}
                />
                <GifPreview
                    previewUrl={previewUrl}
                    outputUrl={outputUrl}
                    fileSize={file.size}
                    outputSize={outputSize}
                    originalInfo={originalInfo}
                />
            </div>
        </fieldset>
    );
}
