"use client";

import { useEffect, useRef, useState } from "react";
import {
    decodeAudioFileTo16kHz,
    mergeFloat32Chunks,
    resampleTo16kHz,
} from "@/lib/audio";
import { LuMic, LuSquare, LuUpload } from "react-icons/lu";

type Device = "webgpu" | "wasm";
type ModelStatus = "idle" | "loading" | "ready" | "error";
type LoadPhase = "downloading" | "initializing" | null;

const MODEL_OPTIONS = [
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

const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

export default function Transcriber() {
    const [device, setDevice] = useState<Device | null>(null);
    const [fellBack, setFellBack] = useState(false);
    const [model, setModel] = useState<string>(DEFAULT_MODEL);
    const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");

    const [loadPhase, setLoadPhase] = useState<LoadPhase>(null);
    const [downloadPct, setDownloadPct] = useState(0);
    const [downloadLabel, setDownloadLabel] = useState("");

    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [customInput, setCustomInput] = useState("");
    const [customModels, setCustomModels] = useState<string[]>([]);

    const workerRef = useRef<Worker | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const chunksRef = useRef<Float32Array[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    function bootWorker(modelId: string) {
        const hasWebGPU =
            typeof navigator !== "undefined" && "gpu" in navigator;
        const initialDevice: Device = hasWebGPU ? "webgpu" : "wasm";

        const worker = new Worker(
            new URL("../workers/whisper-worker.ts", import.meta.url),
            {
                type: "module",
            },
        );
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent) => {
            const msg = event.data;
            switch (msg.type) {
                case "progress": {
                    setLoadPhase("downloading");
                    setDownloadPct(msg.pct ?? 0);
                    setDownloadLabel(msg.file ?? "Downloading model files...");
                    break;
                }
                case "phase": {
                    if (msg.phase === "initializing") {
                        setLoadPhase("initializing");
                    }
                    break;
                }
                case "ready":
                    setDevice(msg.device);
                    setFellBack(Boolean(msg.fellBack));
                    setModelStatus("ready");
                    setLoadPhase(null);
                    setDownloadPct(100);
                    break;
                case "result": {
                    const text = msg.text.trim();
                    setTranscript(text);
                    setTranscribing(false);
                    break;
                }
                case "error":
                    setError(msg.error);
                    setModelStatus("error");
                    setLoadPhase(null);
                    setTranscribing(false);
                    break;
            }
        };

        setModelStatus("loading");
        setError(null);
        setLoadPhase(null);
        setDownloadPct(0);
        setDownloadLabel(
            hasWebGPU ? "Initializing WebGPU..." : "Initializing WASM (CPU)...",
        );
        setDevice(null);
        worker.postMessage({
            type: "load",
            device: initialDevice,
            model: modelId,
        });
    }

    useEffect(() => {
        bootWorker(model);
        return () => {
            workerRef.current?.terminate();
        };
    }, [model]);

    function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newModel = e.target.value;
        if (newModel === model) return;

        setModel(newModel);
        workerRef.current?.terminate();
        bootWorker(newModel);
    }

    function handleLoadCustomModel() {
        const id = customInput.trim();
        if (!id || controlsLocked) return;

        const known =
            MODEL_OPTIONS.some((o) => o.id === id) || customModels.includes(id);
        if (!known) {
            setCustomModels((prev) => [...prev, id]);
        }

        setModel(id);
        workerRef.current?.terminate();
        bootWorker(id);
        setCustomInput("");
    }

    async function startRecording() {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            streamRef.current = stream;

            const AudioCtx =
                window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx: AudioContext = new AudioCtx();
            audioCtxRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            chunksRef.current = [];

            processor.onaudioprocess = (e) => {
                const channelData = e.inputBuffer.getChannelData(0);
                chunksRef.current.push(new Float32Array(channelData));
            };

            source.connect(processor);
            const silentGain = audioCtx.createGain();
            silentGain.gain.value = 0;
            processor.connect(silentGain);
            silentGain.connect(audioCtx.destination);

            setRecording(true);
        } catch (err) {
            setError("Microphone access failed: " + String(err));
        }
    }

    function stopRecording() {
        setRecording(false);

        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const sampleRate = audioCtxRef.current?.sampleRate ?? 48000;
        const merged = mergeFloat32Chunks(chunksRef.current);
        chunksRef.current = [];
        audioCtxRef.current?.close();

        if (merged.length === 0) return;

        transcribeAudio(resampleTo16kHz(merged, sampleRate));
    }

    function transcribeAudio(audio: Float32Array) {
        setTranscribing(true);
        workerRef.current?.postMessage({ type: "transcribe", audio }, []);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setError(null);
        try {
            const audio = await decodeAudioFileTo16kHz(file);
            transcribeAudio(audio);
        } catch (err) {
            setError("Could not read that audio file: " + String(err));
        }
    }

    function handleDownload() {
        if (!transcript) return;
        const blob = new Blob([transcript], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transcript.txt";
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleClear() {
        setTranscript("");
    }

    const deviceLabel =
        modelStatus === "loading" && !device
            ? "detecting..."
            : device === "webgpu"
              ? "WebGPU"
              : device === "wasm"
                ? fellBack
                    ? "WASM (CPU fallback)"
                    : "WASM (CPU)"
                : "-";

    const deviceChipClasses =
        device === "webgpu"
            ? "bg-green-600"
            : device === "wasm"
              ? "bg-purple-600"
              : "bg-gray-500";

    const controlsLocked =
        recording || transcribing || modelStatus === "loading";

    const allModelOptions = [
        ...MODEL_OPTIONS,
        ...customModels.map((id) => ({ id, label: `${id} (custom)` })),
    ];

    return (
        <div className="flex h-full w-full max-w-5xl mx-auto flex-col box-border">
            <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="field-row mb-2 items-center gap-2 flex">
                    <span>Model:</span>
                    <select
                        value={model}
                        disabled={controlsLocked}
                        onChange={handleModelChange}
                    >
                        {allModelOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <span>Backend:</span>
                    <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold text-white ${deviceChipClasses}`}
                    >
                        {deviceLabel}
                    </span>
                </div>

                <div className="field-row mb-2 items-center gap-2 flex">
                    <span>Custom model:</span>
                    <input
                        type="text"
                        placeholder="e.g. onnx-community/whisper-tiny"
                        value={customInput}
                        disabled={controlsLocked}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleLoadCustomModel();
                        }}
                        className="flex-1"
                    />
                    <button
                        disabled={controlsLocked || !customInput.trim()}
                        onClick={handleLoadCustomModel}
                    >
                        Load
                    </button>
                </div>
                <p className="mb-2 text-[11px] text-gray-600">
                    Any ONNX Whisper style repo on the Hugging Face Hub should
                    work here. Random repos will yell at you if they are not
                    actually speech recognition models, which is fair.
                </p>

                {(model.includes("medium") || model.includes("large")) && (
                    <p className="mb-2 text-xs text-amber-700">
                        {model.includes("large") && !model.includes("turbo")
                            ? "Large v3 downloads several GB and needs a lot of memory. WebGPU is effectively required, and even then it may fail on lower memory devices."
                            : device === "wasm"
                              ? "This model is large and runs on CPU (WASM) in your browser. Expect slow loading and transcription. A WebGPU capable browser is strongly recommended."
                              : "This model downloads a large file on first use. Expect a longer load time."}
                    </p>
                )}

                {modelStatus === "loading" && (
                    <div className="mb-2.5 space-y-2">
                        <div>
                            <p className="mb-1 text-xs font-bold flex flex-col gap-2">
                                <span className="flex items-center gap-1">
                                    Step 1: Downloading model files
                                    {loadPhase === "downloading" && (
                                        <p className="truncate text-xs font-normal">
                                            {downloadLabel}
                                        </p>
                                    )}
                                </span>
                                {loadPhase === "downloading" ? (
                                    <div role="progressbar" className="animate">
                                        <div
                                            style={{ width: `${downloadPct}%` }}
                                        ></div>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 text-xs font-bold">
                                Step 2: Loading into{" "}
                                {device === "webgpu" ? "GPU" : "memory"}
                            </p>
                            <div className="progress-indicator">
                                <span
                                    className={`progress-indicator-bar ${
                                        loadPhase === "initializing"
                                            ? "animate-pulse"
                                            : ""
                                    }`}
                                    style={{
                                        width:
                                            loadPhase === "initializing"
                                                ? "100%"
                                                : "0%",
                                    }}
                                />
                            </div>
                            {loadPhase === "initializing" && (
                                <p className="mt-1 text-xs">
                                    Warming up the model, almost there...
                                </p>
                            )}

                            <p className="mb-1 text-xs font-bold flex flex-col gap-2">
                                <span className="flex items-center gap-1">
                                    Step 2: Initializing the model
                                    {loadPhase === "initializing" && (
                                        <p className="truncate text-xs font-normal">
                                            {downloadLabel}
                                        </p>
                                    )}
                                </span>
                                {loadPhase === "initializing" ? (
                                    <div role="progressbar" className="animate">
                                        <div
                                            style={{ width: `${downloadPct}%` }}
                                        ></div>
                                    </div>
                                ) : (
                                    ""
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {modelStatus === "error" && error && (
                    <div className="field-row mb-2 text-red-800">{error}</div>
                )}

                <div className="my-2.5 flex items-center gap-2">
                    <button
                        disabled={modelStatus !== "ready" || transcribing}
                        onClick={recording ? stopRecording : startRecording}
                        className="flex items-center gap-1"
                    >
                        {recording ? (
                            <>
                                <LuSquare /> Stop
                            </>
                        ) : (
                            <>
                                <LuMic /> Record microphone
                            </>
                        )}
                    </button>

                    <button
                        disabled={
                            modelStatus !== "ready" || transcribing || recording
                        }
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1"
                    >
                        <LuUpload /> Upload audio...
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {recording && (
                        <span className="flex items-center gap-1 flex-1 w-full">
                            <LuMic className="mr-1.5 inline-block h-2.5 w-2.5 animate-pulse rounded-full text-red-600" />{" "}
                            Listening...
                        </span>
                    )}
                    {transcribing && (
                        <span className="flex items-center gap-1 flex-1 w-full">
                            Transcribing...
                            <div
                                role="progressbar"
                                className="marquee flex-1"
                            />
                        </span>
                    )}
                </div>

                <textarea
                    className="w-full flex-1 min-h-10 resize-y box-border text-[13px]"
                    readOnly
                    value={transcript}
                    placeholder="Transcribed text will appear here..."
                />

                <div className="field-row mt-2 gap-2 flex">
                    <button onClick={handleClear}>Clear</button>
                    <button disabled={!transcript} onClick={handleDownload}>
                        Download TXT
                    </button>
                </div>
            </div>
        </div>
    );
}
