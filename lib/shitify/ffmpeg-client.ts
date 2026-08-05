import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

function isCrossOriginIsolated() {
    return typeof window !== "undefined" && window.crossOriginIsolated === true;
}

export async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;
    if (loadingPromise) return loadingPromise;

    if (!isCrossOriginIsolated()) {
        throw new Error(
            "This page isn't cross-origin isolated (missing COOP/COEP headers), " +
                "so the multi-threaded ffmpeg core can't run here.",
        );
    }

    loadingPromise = (async () => {
        const ffmpeg = new FFmpeg();

        await ffmpeg.load({
            coreURL: await toBlobURL(
                "/ffmpeg-core-mt/ffmpeg-core.js",
                "text/javascript",
            ),
            wasmURL: "/ffmpeg-core-mt/ffmpeg-core.wasm",
            workerURL: "/ffmpeg-core-mt/ffmpeg-core.worker.js",
        });

        ffmpegInstance = ffmpeg;
        return ffmpeg;
    })();

    return loadingPromise;
}
