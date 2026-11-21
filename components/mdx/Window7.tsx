"use client";

import { useRef, useState } from "react";

export const Window7 = ({
    title = "Untitled",
    children,
    active = true,
}: {
    title?: string;
    children: React.ReactNode;
    active?: boolean;
}) => {
    const windowRef = useRef<HTMLDivElement | null>(null);
    const [minimized, setMinimized] = useState(false);

    return (
        <div
            className={`window ${active ? "active" : ""}`}
            style={{ margin: "1rem" }}
            ref={windowRef}
        >
            <div className="title-bar">
                <div className="title-bar-text select-none">{title}</div>
                <div className="title-bar-controls">
                    <button
                        aria-label="Minimize"
                        onClick={() => {
                            if (document.fullscreenEnabled) {
                                document.exitFullscreen();
                            }
                            setMinimized((prev) => !prev);
                        }}
                    />
                    <button
                        aria-label="Maximize"
                        onClick={() => {
                            if (document.fullscreenEnabled) {
                                document.exitFullscreen();
                            }
                            if (minimized) {
                                setMinimized(false);
                            } else if (windowRef.current) {
                                windowRef.current.requestFullscreen();
                            }
                        }}
                    />
                    <button
                        aria-label="Close"
                        onClick={() => {
                            if (document.fullscreenEnabled) {
                                document.exitFullscreen();
                            }
                        }}
                    />
                </div>
            </div>
            <div
                className={`window-body aspect-video ${minimized ? "hidden" : ""}`}
            >
                {children}
            </div>
        </div>
    );
};
