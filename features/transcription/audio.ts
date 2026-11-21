export function mergeFloat32Chunks(chunks: Float32Array[]): Float32Array {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const out = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

function mixToMono(buffer: AudioBuffer): Float32Array {
    const { length, numberOfChannels } = buffer;
    const out = new Float32Array(length);
    for (let ch = 0; ch < numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            out[i] += data[i] / numberOfChannels;
        }
    }
    return out;
}

// Decodes an uploaded audio file (mp3, wav, m4a, ogg, ...) to 16kHz mono
// Float32 PCM, ready to hand straight to the Whisper pipeline.
export async function decodeAudioFileTo16kHz(
    file: File,
): Promise<Float32Array> {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx: AudioContext = new AudioCtx();
    try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const mono =
            audioBuffer.numberOfChannels === 1
                ? audioBuffer.getChannelData(0)
                : mixToMono(audioBuffer);
        return resampleTo16kHz(mono, audioBuffer.sampleRate);
    } finally {
        audioCtx.close();
    }
}

export function resampleTo16kHz(
    input: Float32Array,
    inputSampleRate: number,
): Float32Array {
    const targetRate = 16000;
    if (inputSampleRate === targetRate) return input;

    const ratio = inputSampleRate / targetRate;
    const outputLength = Math.round(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
        const srcPos = i * ratio;
        const srcIndex = Math.floor(srcPos);
        const frac = srcPos - srcIndex;
        const a = input[srcIndex] ?? 0;
        const b = input[srcIndex + 1] ?? a;
        output[i] = a + (b - a) * frac;
    }

    return output;
}
