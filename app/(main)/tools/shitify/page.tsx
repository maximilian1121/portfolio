"use client";

import { getFileKind } from "@/lib/shitify/file-kind";
import { useEffect, useState } from "react";
import AudioPanel from "./AudioPanel";
import FileDropzone from "./FileDropzone";
import ImagePanel from "./ImagePanel";
import "./shitify.css";
import VideoPanel from "./VideoPanel";

export default function Shitify() {
    const [file, setFile] = useState<File | null>(null);
    const kind = file ? getFileKind(file) : null;

    useEffect(() => {
        if (typeof window !== "undefined" && !window.crossOriginIsolated) {
            alert(
                "The page is about to refresh due to some weird issues surrounding cross-origin isolation.",
            );
            window.location.reload();
        }
    }, []);

    return (
        <div
            className="w-full max-w-6xl mx-auto"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
            {file ? (
                <>
                    <div>
                        <p
                            style={{
                                fontSize: "0.85rem",
                                opacity: 0.7,
                                marginBottom: "0.5rem",
                            }}
                        >
                            {file.name} · {file.type || "Unknown type"} ·
                            <a
                                className="cursor-pointer"
                                onClick={() => setFile(null)}
                            >
                                Shittify new file
                            </a>
                        </p>

                        {kind === "image" && (
                            <ImagePanel
                                key={file.name + file.size}
                                file={file}
                            />
                        )}
                        {kind === "video" && (
                            <VideoPanel
                                key={file.name + file.size}
                                file={file}
                            />
                        )}
                        {kind === "audio" && (
                            <AudioPanel
                                key={file.name + file.size}
                                file={file}
                            />
                        )}
                        {kind === "unsupported" && (
                            <fieldset>
                                <legend>Unsupported file</legend>
                                <p>
                                    That file type isn&apos;t supported yet. Try
                                    an image, video, or audio file.
                                </p>
                            </fieldset>
                        )}
                    </div>
                </>
            ) : (
                <FileDropzone onFileSelected={setFile} />
            )}
        </div>
    );
}
