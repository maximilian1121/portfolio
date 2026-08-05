"use client";

import { useObjectUrl } from "@/lib/shitify/use-object-url";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ImagePanelProps = { file: File };

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImagePanel({ file }: ImagePanelProps) {
    const [quality, setQuality] = useState(80);
    const [scale, setScale] = useState(100);
    const previewUrl = useObjectUrl(file);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputSize, setOutputSize] = useState<number | null>(null);
    const [outputDims, setOutputDims] = useState<{
        w: number;
        h: number;
    } | null>(null);
    const [naturalDims, setNaturalDims] = useState<{
        w: number;
        h: number;
    } | null>(null);
    const [isEncoding, setIsEncoding] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const encode = useCallback((qualityValue: number, scaleValue: number) => {
        const img = imageRef.current;
        if (!img) return;
        setIsEncoding(true);

        const clampedScale = Math.min(100, Math.max(1, scaleValue)) / 100;
        const targetW = Math.max(
            1,
            Math.round(img.naturalWidth * clampedScale),
        );
        const targetH = Math.max(
            1,
            Math.round(img.naturalHeight * clampedScale),
        );

        const canvas = canvasRef.current ?? document.createElement("canvas");
        canvasRef.current = canvas;
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setIsEncoding(false);
            return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const clampedQuality = Math.min(100, Math.max(0.01, qualityValue));

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setIsEncoding(false);
                    return;
                }
                setOutputUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return URL.createObjectURL(blob);
                });
                setOutputSize(blob.size);
                setOutputDims({ w: targetW, h: targetH });
                setIsEncoding(false);
            },
            "image/jpeg",
            clampedQuality / 100,
        );
    }, []);

    // Load source image once per file.
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            imageRef.current = img;
            setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
            encode(quality, scale);
        };
        img.src = previewUrl;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewUrl]);

    // Debounced re-encode on slider move (quality or scale).
    useEffect(() => {
        if (!imageRef.current) return;
        const timeout = setTimeout(() => encode(quality, scale), 100);
        return () => clearTimeout(timeout);
    }, [quality, scale, encode]);

    const downloadName = file.name.replace(/\.[^.]+$/, "") + "-trashified.jpg";

    return (
        <fieldset>
            <legend>Image settings</legend>

            <div
                style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                {/* ===== CONTROLS ===== */}
                <div
                    style={{
                        flex: "0 0 240px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        minWidth: 200,
                    }}
                >
                    <div className="group">
                        <label htmlFor="quality-slider">
                            JPEG quality: {quality.toFixed(2)}%
                        </label>
                        <input
                            id="quality-slider"
                            type="range"
                            min={0.01}
                            max={100}
                            step={0.01}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                        />
                    </div>

                    <div className="group">
                        <label htmlFor="scale-slider">
                            Resolution: {scale.toFixed(0)}%
                            {outputDims && (
                                <span
                                    style={{
                                        opacity: 0.7,
                                        fontWeight: "normal",
                                    }}
                                >
                                    {" "}
                                    ({outputDims.w}x{outputDims.h}px)
                                </span>
                            )}
                        </label>
                        <input
                            id="scale-slider"
                            type="range"
                            min={1}
                            max={100}
                            step={1}
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                        />
                    </div>

                    {isEncoding && (
                        <div role="progressbar" className="marquee" />
                    )}

                    <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: 0 }}>
                        {formatBytes(file.size)}
                        {outputSize !== null && (
                            <> → {formatBytes(outputSize)}</>
                        )}
                    </p>

                    <button
                        className="default"
                        disabled={!outputUrl}
                        onClick={() => {
                            if (!outputUrl) return;
                            const a = document.createElement("a");
                            a.href = outputUrl;
                            a.download = downloadName;
                            a.click();
                        }}
                    >
                        Download JPEG
                    </button>
                </div>

                {/* ===== PREVIEW ===== */}
                <div
                    style={{
                        flex: "1 1 0",
                        minWidth: 280,
                        borderLeft: "1px solid #999",
                        paddingLeft: "1.5rem",
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "nowrap",
                    }}
                >
                    <div style={{ flex: "1 1 0", minWidth: 0 }}>
                        <p
                            style={{
                                fontWeight: "bold",
                                margin: "0 0 0.25rem",
                            }}
                        >
                            Original
                        </p>
                        {naturalDims && (
                            <Image
                                src={previewUrl}
                                alt="Original"
                                width={naturalDims.w}
                                height={naturalDims.h}
                                unoptimized
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    height: "auto",
                                    display: "block",
                                    border: "1px solid #999",
                                }}
                            />
                        )}
                        <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                            {formatBytes(file.size)}
                            {naturalDims && (
                                <>
                                    {" "}
                                    · {naturalDims.w}x{naturalDims.h}px
                                </>
                            )}
                        </p>
                    </div>

                    <div style={{ flex: "1 1 0", minWidth: 0 }}>
                        <p
                            style={{
                                fontWeight: "bold",
                                margin: "0 0 0.25rem",
                            }}
                        >
                            Trashified
                        </p>
                        {outputUrl && outputDims ? (
                            <Image
                                src={outputUrl}
                                alt="Trashified"
                                width={outputDims.w}
                                height={outputDims.h}
                                unoptimized
                                style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    height: "auto",
                                    display: "block",
                                    border: "1px solid #999",
                                }}
                            />
                        ) : (
                            <p>Encoding…</p>
                        )}
                        {outputSize !== null && (
                            <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                                {formatBytes(outputSize)}
                                {outputDims && (
                                    <>
                                        {" "}
                                        · {outputDims.w}x{outputDims.h}px
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </fieldset>
    );
}
