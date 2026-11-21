export type GifHeaderInfo = {
    width: number;
    height: number;
    frameCount: number;
    fps: number | null;
};

// Parse the GIF89a blocks to read dimensions and estimate the frame rate from
// graphic control extension delays without loading the file into ffmpeg.
export function parseGifHeader(buf: ArrayBuffer): GifHeaderInfo | null {
    const bytes = new Uint8Array(buf);
    if (bytes.length < 13) return null;

    const signature = String.fromCharCode(...bytes.subarray(0, 6));
    if (signature !== "GIF87a" && signature !== "GIF89a") return null;

    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);

    let index = 13;
    if (bytes[10] & 0x80) {
        const tableSize = 2 << (bytes[10] & 0x07);
        index += tableSize * 3;
    }

    const skipSubBlocks = (position: number) => {
        let next = position;
        while (next < bytes.length && bytes[next] !== 0) {
            next += bytes[next] + 1;
        }
        return next + 1;
    };

    let frameCount = 0;
    let totalDelayCs = 0;
    let delaySamples = 0;

    while (index < bytes.length) {
        const marker = bytes[index];
        if (marker === 0x3b) break;

        if (marker === 0x21) {
            if (bytes[index + 1] === 0xf9) {
                totalDelayCs += bytes[index + 4] | (bytes[index + 5] << 8);
                delaySamples += 1;
            }
            index = skipSubBlocks(index + 2);
        } else if (marker === 0x2c) {
            frameCount += 1;
            const localFlags = bytes[index + 9];
            let next = index + 10;
            if (localFlags & 0x80) {
                const tableSize = 2 << (localFlags & 0x07);
                next += tableSize * 3;
            }
            next += 1;
            index = skipSubBlocks(next);
        } else {
            break;
        }
    }

    let fps: number | null = null;
    if (delaySamples > 0) {
        const averageDelayCs = totalDelayCs / delaySamples;
        const effectiveDelayCs = averageDelayCs < 2 ? 10 : averageDelayCs;
        fps = Math.round((100 / effectiveDelayCs) * 10) / 10;
    }

    return { width, height, frameCount, fps };
}

export function qualityToQv(quality: number) {
    const clamped = Math.min(100, Math.max(1, quality));
    return Math.round(2 + ((100 - clamped) / 100) * 29);
}

export const MAX_FRAMES = 500;
export const formatFrameNumber = (index: number) =>
    String(index).padStart(4, "0");
