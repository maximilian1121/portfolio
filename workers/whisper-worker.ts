import {
    pipeline,
    env,
    type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

env.allowLocalModels = false;

const DEFAULT_MODEL_ID = "onnx-community/whisper-tiny.en";

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let currentModelId: string | null = null;

type LoadMessage = { type: "load"; device: "webgpu" | "wasm"; model?: string };
type TranscribeMessage = { type: "transcribe"; audio: Float32Array };
type InMessage = LoadMessage | TranscribeMessage;

async function loadPipeline(device: "webgpu" | "wasm", modelId: string) {
    const initiated = new Set<string>();
    const done = new Set<string>();
    const progressByFile = new Map<string, number>();
    let flippedToInitializing = false;

    function overallPct() {
        if (initiated.size === 0) return 0;
        let total = 0;
        for (const f of initiated) total += progressByFile.get(f) ?? 0;
        return Math.round(total / initiated.size);
    }

    return pipeline("automatic-speech-recognition", modelId, {
        device,
        dtype: device === "webgpu" ? "fp32" : "q8",
        progress_callback: (progress: any) => {
            const status = progress?.status;
            const file = progress?.file;

            if (status === "initiate" && file) {
                initiated.add(file);
                self.postMessage({
                    type: "progress",
                    pct: overallPct(),
                    file,
                });
                return;
            }

            if (status === "progress" && file) {
                progressByFile.set(file, progress.progress ?? 0);
                self.postMessage({
                    type: "progress",
                    pct: overallPct(),
                    file,
                });
                return;
            }

            if (status === "done" && file) {
                done.add(file);
                progressByFile.set(file, 100);
                self.postMessage({
                    type: "progress",
                    pct: overallPct(),
                    file,
                });

                if (
                    !flippedToInitializing &&
                    initiated.size > 0 &&
                    done.size >= initiated.size
                ) {
                    flippedToInitializing = true;
                    self.postMessage({ type: "phase", phase: "initializing" });
                }
                return;
            }
        },
    });
}

self.onmessage = async (event: MessageEvent<InMessage>) => {
    const data = event.data;

    if (data.type === "load") {
        const modelId = data.model ?? DEFAULT_MODEL_ID;
        try {
            transcriber = await loadPipeline(data.device, modelId);
            currentModelId = modelId;
            self.postMessage({
                type: "ready",
                device: data.device,
                model: modelId,
            });
        } catch (err) {
            if (data.device === "webgpu") {
                try {
                    transcriber = await loadPipeline("wasm", modelId);
                    currentModelId = modelId;
                    self.postMessage({
                        type: "ready",
                        device: "wasm",
                        model: modelId,
                        fellBack: true,
                    });
                } catch (fallbackErr) {
                    self.postMessage({
                        type: "error",
                        error: String(fallbackErr),
                    });
                }
            } else {
                self.postMessage({ type: "error", error: String(err) });
            }
        }
        return;
    }

    if (data.type === "transcribe") {
        if (!transcriber) {
            self.postMessage({
                type: "error",
                error: "Model is not loaded yet.",
            });
            return;
        }
        try {
            const result = await transcriber(data.audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
            });
            const text = Array.isArray(result)
                ? result.map((r) => r.text).join(" ")
                : result.text;
            self.postMessage({ type: "result", text, model: currentModelId });
        } catch (err) {
            self.postMessage({ type: "error", error: String(err) });
        }
    }
};

export {};
