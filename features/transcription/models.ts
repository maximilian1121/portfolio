export type Device = "webgpu" | "wasm";
export type ModelStatus = "idle" | "loading" | "ready" | "error";
export type LoadPhase = "downloading" | "initializing" | null;

export const MODEL_OPTIONS = [
    {
        id: "onnx-community/whisper-tiny.en",
        label: "Tiny (English) - ~75MB, fastest",
    },
    { id: "onnx-community/whisper-tiny", label: "Tiny (multilingual) - ~75MB" },
    { id: "onnx-community/whisper-base.en", label: "Base (English) - ~145MB" },
    {
        id: "onnx-community/whisper-base",
        label: "Base (multilingual) - ~145MB",
    },
    {
        id: "onnx-community/whisper-small.en",
        label: "Small (English) - ~485MB",
    },
    {
        id: "onnx-community/whisper-small",
        label: "Small (multilingual) - ~485MB",
    },
    {
        id: "Xenova/whisper-medium.en",
        label: "Medium (English) - ~1.5GB, slow on CPU",
    },
    {
        id: "Xenova/whisper-medium",
        label: "Medium (multilingual) - ~1.5GB, slow on CPU",
    },
    {
        id: "onnx-community/whisper-large-v3-turbo",
        label: "Large v3 turbo - ~1.6GB, needs WebGPU",
    },
    { id: "Xenova/whisper-large-v3", label: "Large v3 - ~3GB+, WebGPU only" },
] as const;

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;
