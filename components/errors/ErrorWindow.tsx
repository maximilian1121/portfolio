"use client";

import type {
    CSSProperties,
    MouseEventHandler,
    ReactNode,
    RefObject,
    TouchEventHandler,
} from "react";

type ErrorWindowProps = {
    statusCode?: number | null;
    message: string;
    description: string;
    actions: ReactNode[];
    angry: boolean;
    shakeIntensity: string;
    angryMessage: string;
    hasGravity: boolean;
    windowRef: RefObject<HTMLDivElement | null>;
    windowStyle: CSSProperties;
    titleBarStyle: CSSProperties;
    isDragging: boolean;
    onClose: () => void;
    onMouseDown: MouseEventHandler<HTMLDivElement>;
    onTouchStart: TouchEventHandler<HTMLDivElement>;
};

export default function ErrorWindow({
    statusCode,
    message,
    description,
    actions,
    angry,
    shakeIntensity,
    angryMessage,
    hasGravity,
    windowRef,
    windowStyle,
    titleBarStyle,
    isDragging,
    onClose,
    onMouseDown,
    onTouchStart,
}: ErrorWindowProps) {
    return (
        <div
            ref={windowRef}
            className={`window glass active max-w-md w-full fixed select-none ${shakeIntensity}`}
            style={windowStyle}
        >
            <div
                className="title-bar"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                style={{
                    cursor: isDragging ? "grabbing" : "grab",
                    ...titleBarStyle,
                }}
            >
                <div className="title-bar-text">
                    Error{statusCode && `: ${statusCode}`}
                </div>
                <div className="title-bar-controls">
                    <button aria-label="Close" onClick={onClose} />
                </div>
            </div>
            {!hasGravity ? (
                <div className="window-body has-space">
                    {angry ? (
                        <h1 className="text-2xl">{angryMessage}</h1>
                    ) : (
                        <>
                            <h1 className="text-2xl capitalize">{message}</h1>
                            <p className="text-md">{description}</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="window-body has-space">
                    <h1 className="text-lg">
                        Critical error occurred when trying to compute next
                        anger message!
                    </h1>
                </div>
            )}
            <footer>
                <div className="flex gap-4">{actions}</div>
            </footer>
        </div>
    );
}
