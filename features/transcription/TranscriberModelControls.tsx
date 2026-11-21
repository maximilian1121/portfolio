"use client";

import type { Device, LoadPhase, ModelStatus } from "./models";
import { MODEL_OPTIONS } from "./models";

type TranscriberModelControlsProps = {
    model: string;
    modelStatus: ModelStatus;
    device: Device | null;
    fellBack: boolean;
    loadPhase: LoadPhase;
    downloadPct: number;
    downloadLabel: string;
    customInput: string;
    customModels: string[];
    controlsLocked: boolean;
    error: string | null;
    onModelChange: (modelId: string) => void;
    onCustomInputChange: (value: string) => void;
    onLoadCustomModel: () => void;
};

export default function TranscriberModelControls({
    model,
    modelStatus,
    device,
    fellBack,
    loadPhase,
    downloadPct,
    downloadLabel,
    customInput,
    customModels,
    controlsLocked,
    error,
    onModelChange,
    onCustomInputChange,
    onLoadCustomModel,
}: TranscriberModelControlsProps) {
    const modelOptions = [
        ...MODEL_OPTIONS,
        ...customModels.map((id) => ({ id, label: `${id} (custom)` })),
    ];
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

    return (
        <>
            <div className="field-row mb-2 items-center gap-2 flex">
                <span>Model:</span>
                <select
                    value={model}
                    disabled={controlsLocked}
                    onChange={(event) => onModelChange(event.target.value)}
                >
                    {modelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
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
                    onChange={(event) =>
                        onCustomInputChange(event.target.value)
                    }
                    onKeyDown={(event) => {
                        if (event.key === "Enter") onLoadCustomModel();
                    }}
                    className="flex-1"
                />
                <button
                    disabled={controlsLocked || !customInput.trim()}
                    onClick={onLoadCustomModel}
                >
                    Load
                </button>
            </div>
            <p className="mb-2 text-[11px] text-gray-600">
                Any ONNX Whisper style repo on the Hugging Face Hub should work
                here. Random repos will yell at you if they are not actually
                speech recognition models, which is fair.
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
                                    <span className="truncate text-xs font-normal">
                                        {downloadLabel}
                                    </span>
                                )}
                            </span>
                            {loadPhase === "downloading" ? (
                                <div role="progressbar" className="animate">
                                    <div
                                        style={{ width: `${downloadPct}%` }}
                                    />
                                </div>
                            ) : null}
                        </p>
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold">
                            Step 2: Loading into {device === "webgpu" ? "GPU" : "memory"}
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
                                    <span className="truncate text-xs font-normal">
                                        {downloadLabel}
                                    </span>
                                )}
                            </span>
                            {loadPhase === "initializing" ? (
                                <div role="progressbar" className="animate">
                                    <div
                                        style={{ width: `${downloadPct}%` }}
                                    />
                                </div>
                            ) : null}
                        </p>
                    </div>
                </div>
            )}

            {modelStatus === "error" && error && (
                <div className="field-row mb-2 text-red-800">{error}</div>
            )}
        </>
    );
}
