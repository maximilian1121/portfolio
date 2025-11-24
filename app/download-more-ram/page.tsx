"use client";

import { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";

const downloadSizes = ["8GB", "16GB", "32GB", "64GB"];

export default function DownloadMoreRam() {
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [ramDownloading, setRamDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownloadClick = (size: string) => {
        const downloadsEl = document.getElementById("downloads");
        const downloadsLabelEl = document.getElementById("downloadsLabel");
        if (downloadsEl) downloadsEl.style.display = "none";
        if (downloadsLabelEl) downloadsLabelEl.style.display = "none";

        setRamDownloading(true);
        setProgress(0);

        const totalTime = 2000;
        const steps = 200;
        const delay = totalTime / steps;

        let current = 0;
        const interval = setInterval(() => {
            current++;
            setProgress(current);

            if (current >= steps) {
                clearInterval(interval);
                setRamDownloading(false);
                setVideoLoaded(true);

                document.documentElement.requestFullscreen();

                const bodyEl = document.getElementById("downloadRamBody");
                if (bodyEl) bodyEl.className = "w-full h-full m-0 p-0";
            }
        }, delay);
    };

    return (
        <div
            id="downloadRamBody"
            className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center gap-6"
        >
            <h1 className="text-2xl mb-2" id="downloadsLabel">
                Choose the amount of rams you want...
            </h1>
            <div className="flex gap-4 flex-wrap justify-between" id="downloads">
                {downloadSizes.map((size) => (
                    <button
                        key={size}
                        className="px-6 py-2 bg-blue-600 text-white rounded gap-2 hover:bg-blue-700 transition cursor-pointer flex justify-center items-center"
                        onClick={() => handleDownloadClick(size)}
                    >
                        <FaDownload className="h-full" /> Download {size}
                    </button>
                ))}
            </div>

            {ramDownloading && (
                <div className="w-full">
                    <h1 className="text-2xl mb-2">Downloading more rams...</h1>
                    <progress
                        className="w-full h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                        value={progress}
                        max={100}
                    />
                </div>
            )}

            {videoLoaded && (
                <iframe
                    className="fixed top-0 left-0 w-screen h-screen z-50 select-none pointer-events-none"
                    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0&controls=0"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            )}
        </div>
    );
}
