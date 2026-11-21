"use client";

import { getFFmpeg } from "@/features/tools/shitify/lib/ffmpeg-client";
import { useObjectUrl } from "@/features/tools/shitify/lib/use-object-url";
import { useRef, useState } from "react";
import VideoLog from "./VideoLog";
import VideoPreview from "./VideoPreview";
import VideoSettings from "./VideoSettings";

type VideoPanelProps = { file: File };

function qualityToCrf(quality: number) {
    const clamped = Math.min(100, Math.max(0.01, quality));
    return Math.round(51 - (clamped / 100) * 33);
}

export default function VideoPanel({ file }: VideoPanelProps) {
    const [quality, setQuality] = useState(50);
    const [threads, setThreads] = useState(2);
    const [resolutionScale, setResolutionScale] = useState(100); // % of original
    const [fps, setFps] = useState(30);
    const [audioBitrate, setAudioBitrate] = useState(96); // kbps
    const [sampleRate, setSampleRate] = useState(44100); // Hz
    const [status, setStatus] = useState<
        "idle" | "loading-ffmpeg" | "encoding" | "finalizing" | "done" | "error"
    >("idle");
    const [progress, setProgress] = useState(0);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);

    const [log, setLog] = useState<string[]>([]);
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

            const args = ["-i", inputName];

            if (resolutionScale < 100) {
                const factor = resolutionScale / 100;
                // trunc(...*2)*2 keeps both dims even, which libx264 requires.
                args.push(
                    "-vf",
                    `scale=trunc(iw*${factor}/2)*2:trunc(ih*${factor}/2)*2`,
                );
            }

            args.push(
                "-threads",
                String(threads),
                "-vcodec",
                "libx264",
                "-crf",
                String(qualityToCrf(quality)),
                "-preset",
                "ultrafast",
                "-r",
                String(fps),
                "-acodec",
                "aac",
                "-b:a",
                `${audioBitrate}k`,
                "-ar",
                String(sampleRate),
                outputName,
            );

            await ffmpeg.exec(args);

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
                <VideoSettings
                    quality={quality}
                    threads={threads}
                    resolutionScale={resolutionScale}
                    fps={fps}
                    audioBitrate={audioBitrate}
                    sampleRate={sampleRate}
                    status={status}
                    progress={progress}
                    isBusy={isBusy}
                    outputUrl={outputUrl}
                    outputSize={outputSize}
                    fileSize={file.size}
                    downloadName={downloadName}
                    onQualityChange={setQuality}
                    onThreadsChange={setThreads}
                    onResolutionChange={setResolutionScale}
                    onFpsChange={setFps}
                    onAudioBitrateChange={setAudioBitrate}
                    onSampleRateChange={setSampleRate}
                    onRun={run}
                />
                <VideoPreview previewUrl={previewUrl} outputUrl={outputUrl} />
            </div>
            <VideoLog lines={log} />
        </fieldset>
    );
}
