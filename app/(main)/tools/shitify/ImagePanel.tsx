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

type CrunchResult = { blob: Blob; img: HTMLImageElement; url: string };

export default function ImagePanel({ file }: ImagePanelProps) {
    const [quality, setQuality] = useState(80);
    const [scale, setScale] = useState(100);
    const [passes, setPasses] = useState(1);
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
    const genRef = useRef(0);

    // Draws `source` into the shared canvas at w x h and hands back a
    // fresh jpeg blob plus an <img> loaded from it, so the result can be
    // fed straight back in as the source for the next pass.
    const crunchOnce = useCallback(
        (
            source: CanvasImageSource,
            w: number,
            h: number,
            qualityFraction: number,
        ): Promise<CrunchResult> =>
            new Promise((resolve, reject) => {
                const canvas =
                    canvasRef.current ?? document.createElement("canvas");
                canvasRef.current = canvas;
                canvas.width = w;
                canvas.height = h;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("no 2d context"));
                    return;
                }
                // This is the "linear interpolation" the browser does for
                // us on any scale change, up or down, when smoothing is on.
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(source, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("toBlob failed"));
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const nextImg = new window.Image();
                        nextImg.onload = () =>
                            resolve({ blob, img: nextImg, url });
                        nextImg.onerror = () =>
                            reject(
                                new Error("failed to reload crunched image"),
                            );
                        nextImg.src = url;
                    },
                    "image/jpeg",
                    qualityFraction,
                );
            }),
        [],
    );

    const encode = useCallback(
        async (
            qualityValue: number,
            scaleValue: number,
            passesValue: number,
        ) => {
            const img = imageRef.current;
            if (!img) return;

            const myGen = ++genRef.current;
            setIsEncoding(true);

            const naturalW = img.naturalWidth;
            const naturalH = img.naturalHeight;
            const clampedScale = Math.min(100, Math.max(1, scaleValue)) / 100;
            const targetW = Math.max(1, Math.round(naturalW * clampedScale));
            const targetH = Math.max(1, Math.round(naturalH * clampedScale));
            const qualityFraction =
                Math.min(100, Math.max(0.01, qualityValue)) / 100;
            const totalPasses = Math.max(1, Math.round(passesValue));

            let toRevoke: string[] = [];

            try {
                // Deep-fry passes: crunch it down at the (possibly
                // shrunk) working resolution N times in a row, each pass
                // re-encoding the previous pass's jpeg output.
                let currentSource: CanvasImageSource = img;
                let last: CrunchResult | null = null;

                for (let p = 0; p < totalPasses; p++) {
                    const result = await crunchOnce(
                        currentSource,
                        targetW,
                        targetH,
                        qualityFraction,
                    );
                    if (last) toRevoke.push(last.url);
                    last = result;
                    currentSource = result.img;
                }

                let final = last as CrunchResult;

                // Reupscale: stretch the crunched result back out to the
                // original dimensions with the canvas's built-in linear
                // filtering, same idea as the gif panel's final blow-up
                // step, so shrinking the working resolution shows up as
                // soft/blocky detail instead of just a smaller image.
                if (targetW !== naturalW || targetH !== naturalH) {
                    const upscaled = await crunchOnce(
                        currentSource,
                        naturalW,
                        naturalH,
                        qualityFraction,
                    );
                    toRevoke.push(final.url);
                    final = upscaled;
                }

                // Bail out quietly if a newer run started while we were
                // await-chaining through passes (rapid slider dragging).
                if (myGen !== genRef.current) {
                    toRevoke.push(final.url);
                    for (const u of toRevoke) URL.revokeObjectURL(u);
                    return;
                }

                for (const u of toRevoke) URL.revokeObjectURL(u);

                setOutputUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return final.url;
                });
                setOutputSize(final.blob.size);
                setOutputDims({
                    w: final.img.naturalWidth,
                    h: final.img.naturalHeight,
                });
            } catch (err) {
                console.error(err);
                for (const u of toRevoke) URL.revokeObjectURL(u);
            } finally {
                if (myGen === genRef.current) setIsEncoding(false);
            }
        },
        [crunchOnce],
    );

    // Load source image once per file.
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            imageRef.current = img;
            setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
            encode(quality, scale, passes);
        };
        img.src = previewUrl;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewUrl]);

    // Debounced re-encode on slider move (quality, scale, or passes).
    useEffect(() => {
        if (!imageRef.current) return;
        const timeout = setTimeout(() => encode(quality, scale, passes), 25);
        return () => clearTimeout(timeout);
    }, [quality, scale, passes, encode]);

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
                        <label htmlFor="image-passes-slider">
                            Deep fry passes: {passes}
                        </label>
                        <input
                            id="image-passes-slider"
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={passes}
                            onChange={(e) => setPasses(Number(e.target.value))}
                        />
                    </div>

                    <div className="group">
                        <label htmlFor="scale-slider">
                            Crunch resolution: {scale.toFixed(0)}%
                            {naturalDims && (
                                <span
                                    style={{
                                        opacity: 0.7,
                                        fontWeight: "normal",
                                    }}
                                >
                                    {" "}
                                    (stretched back to {naturalDims.w}x
                                    {naturalDims.h}px)
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
