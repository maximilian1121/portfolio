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

// Kills the current ffmpeg worker and clears the singleton so the next
// getFFmpeg() call spins up a brand new one with a clean WASM heap.
// The core never frees memory between exec() calls on its own, it only
// grows, so heavy callers (looping exec many times, like frame-by-frame
// gif crunching) should call this once they're done to avoid slowly
// filling the same instance until it traps with an out of bounds error.
export async function resetFFmpeg(): Promise<void> {
    if (ffmpegInstance) {
        try {
            ffmpegInstance.terminate();
        } catch {
            // already dead or mid-terminate, nothing to clean up
        }
    }
    ffmpegInstance = null;
    loadingPromise = null;
}
