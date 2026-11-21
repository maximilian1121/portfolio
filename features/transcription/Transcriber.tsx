"use client";

import { useEffect, useRef, useState } from "react";
import {
    decodeAudioFileTo16kHz,
    mergeFloat32Chunks,
    resampleTo16kHz,
} from "@/features/transcription/audio";
import { LuMic, LuSquare, LuUpload } from "react-icons/lu";
import TranscriberModelControls from "./TranscriberModelControls";
import {
    DEFAULT_MODEL,
    MODEL_OPTIONS,
    type Device,
    type LoadPhase,
    type ModelStatus,
} from "./models";

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
            new URL("../../workers/whisper-worker.ts", import.meta.url),
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

    function handleModelChange(newModel: string) {
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

    const controlsLocked =
        recording || transcribing || modelStatus === "loading";

    return (
        <div className="flex h-full w-full max-w-5xl mx-auto flex-col box-border">
            <div className="flex flex-1 flex-col overflow-y-auto">
                <TranscriberModelControls
                    model={model}
                    modelStatus={modelStatus}
                    device={device}
                    fellBack={fellBack}
                    loadPhase={loadPhase}
                    downloadPct={downloadPct}
                    downloadLabel={downloadLabel}
                    customInput={customInput}
                    customModels={customModels}
                    controlsLocked={controlsLocked}
                    error={error}
                    onModelChange={handleModelChange}
                    onCustomInputChange={setCustomInput}
                    onLoadCustomModel={handleLoadCustomModel}
                />

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
