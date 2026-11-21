"use client";

import type { GifHeaderInfo } from "./gif-utils";
import { formatBytes } from "@/features/tools/shitify/lib/format-bytes";

type GifPreviewProps = {
    previewUrl: string | null;
    outputUrl: string | null;
    fileSize: number;
    outputSize: number | null;
    originalInfo: GifHeaderInfo | null;
};

export default function GifPreview({
    previewUrl,
    outputUrl,
    fileSize,
    outputSize,
    originalInfo,
}: GifPreviewProps) {
    return (
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
                <p style={{ fontWeight: "bold", margin: "0 0 0.25rem" }}>
                    Original
                </p>
                {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={previewUrl}
                        alt="Original"
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
                    {formatBytes(fileSize)}
                    {originalInfo && (
                        <>
                            {" "}· {originalInfo.width}x{originalInfo.height}
                            px · {originalInfo.frameCount} frames
                            {originalInfo.fps && <> · ~{originalInfo.fps} fps</>}
                        </>
                    )}
                </p>
            </div>

            <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <p style={{ fontWeight: "bold", margin: "0 0 0.25rem" }}>
                    Trashified
                </p>
                {outputUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={outputUrl}
                        alt="Trashified"
                        style={{
                            width: "100%",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            border: "1px solid #999",
                        }}
                    />
                ) : (
                    <p>Nothing yet. Hit crunch it.</p>
                )}
                {outputSize !== null && (
                    <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                        {formatBytes(outputSize)}
                    </p>
                )}
            </div>
        </div>
    );
}
