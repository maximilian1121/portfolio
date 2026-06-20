"use client";

import Link from "next/link";
import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

const DEFAULTS = {
    GRAVITY: 0.4,
    BOUNCE: 0.6,
    FRICTION: 0.01,
};

export default function ErrorTemplate({
    statusCode,
    message,
    description,
    actions,
}: Readonly<{
    statusCode?: number | null;
    message: string;
    description: string;
    reset: () => void;
    actions: React.ReactNode[];
}>) {
    const [offset, setOffset] = useState({ x: 0.5, y: 0.5 });
    const [isDragging, setIsDragging] = useState(false);
    const [grabPoint, setGrabPoint] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const windowRef = useRef<HTMLDivElement>(null);
    const [clickCount, setClickCount] = useState(0);
    const [hasGravity, setHasGravity] = useState(false);
    const [physicsOptionsMinimized, setPhysicsOptionsMinimized] =
        useState(false);
    const [gyroEnabled, setGyroEnabled] = useState(false);

    const velocityRef = useRef({ x: 0, y: 0 });
    const positionRef = useRef({ x: 0, y: 0 });
    const animFrameRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0, t: 0 });
    const dragVelocityRef = useRef({ x: 0, y: 0 });

    const [gravity, setGravity] = useState(DEFAULTS.GRAVITY);
    const [bounce, setBounce] = useState(DEFAULTS.BOUNCE);
    const [friction, setFriction] = useState(DEFAULTS.FRICTION);

    const gravityRef = useRef(DEFAULTS.GRAVITY);
    const gyroGravityRef = useRef({ x: 0, y: DEFAULTS.GRAVITY });
    const bounceRef = useRef(DEFAULTS.BOUNCE);
    const frictionRef = useRef(DEFAULTS.FRICTION);

    const isAngry = clickCount > 0 && !hasGravity;

    const getShakeIntensity = () => {
        if (hasGravity) return "";
        if (clickCount >= 4) return "heavy-shake";
        if (clickCount >= 2) return "light-shake";
        return "";
    };

    const resetPhysics = () => {
        setGravity(DEFAULTS.GRAVITY);
        setBounce(DEFAULTS.BOUNCE);
        setFriction(DEFAULTS.FRICTION);
        gravityRef.current = DEFAULTS.GRAVITY;
        bounceRef.current = DEFAULTS.BOUNCE;
        frictionRef.current = DEFAULTS.FRICTION;
        setGyroEnabled(false);
    };

    const requestGyro = async () => {
        const DeviceMoveEvent = DeviceOrientationEvent as any;
        if (
            typeof DeviceMoveEvent !== "undefined" &&
            typeof DeviceMoveEvent.requestPermission === "function"
        ) {
            try {
                const permission = await DeviceMoveEvent.requestPermission();
                if (permission === "granted") setGyroEnabled(true);
            } catch (e) {
                console.error(e);
            }
        } else {
            setGyroEnabled(true);
        }
    };

    useEffect(() => {
        if (!gyroEnabled) return;
        const handleOrientation = (e: DeviceOrientationEvent) => {
            const gx = (e.gamma || 0) / 45;
            const gy = (e.beta || 0) / 45;
            gyroGravityRef.current = { x: gx, y: gy };
        };
        window.addEventListener("deviceorientation", handleOrientation);
        return () =>
            window.removeEventListener("deviceorientation", handleOrientation);
    }, [gyroEnabled]);

    useLayoutEffect(() => {
        const updateSize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    useEffect(() => {
        if (!hasGravity) return;
        const tick = () => {
            if (!windowRef.current) return;
            if (isDraggingRef.current) {
                animFrameRef.current = requestAnimationFrame(tick);
                return;
            }
            const wW = windowRef.current.offsetWidth;
            const wH = windowRef.current.offsetHeight;
            const maxX = window.innerWidth - wW;
            const maxY = window.innerHeight - wH;

            if (gyroEnabled) {
                velocityRef.current.x += gyroGravityRef.current.x;
                velocityRef.current.y += gyroGravityRef.current.y;
            } else {
                velocityRef.current.y += gravityRef.current;
            }

            velocityRef.current.x *= 1 - frictionRef.current;
            velocityRef.current.y *= 1 - frictionRef.current;
            positionRef.current.x += velocityRef.current.x;
            positionRef.current.y += velocityRef.current.y;

            let hit = false;
            if (positionRef.current.y >= maxY) {
                positionRef.current.y = maxY;
                velocityRef.current.y *= -bounceRef.current;
                hit = true;
            } else if (positionRef.current.y < 0) {
                positionRef.current.y = 0;
                velocityRef.current.y *= -bounceRef.current;
                hit = true;
            }
            if (positionRef.current.x >= maxX) {
                positionRef.current.x = maxX;
                velocityRef.current.x *= -bounceRef.current;
                hit = true;
            } else if (positionRef.current.x < 0) {
                positionRef.current.x = 0;
                velocityRef.current.x *= -bounceRef.current;
                hit = true;
            }

            if (hit && "vibrate" in navigator) navigator.vibrate(20);

            setOffset({
                x: maxX > 0 ? positionRef.current.x / maxX : 0.5,
                y: maxY > 0 ? positionRef.current.y / maxY : 0.5,
            });
            animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current)
                cancelAnimationFrame(animFrameRef.current);
        };
    }, [hasGravity, gyroEnabled]);

    const startDrag = (clientX: number, clientY: number) => {
        if (!windowRef.current) return;
        const rect = windowRef.current.getBoundingClientRect();
        setGrabPoint({ x: clientX - rect.left, y: clientY - rect.top });
        lastMouseRef.current = { x: clientX, y: clientY, t: performance.now() };
        isDraggingRef.current = true;
        setIsDragging(true);
    };

    const handleMove = useCallback(
        (clientX: number, clientY: number) => {
            if (!isDraggingRef.current || !windowRef.current) return;
            const now = performance.now();
            const dt = now - lastMouseRef.current.t;
            if (dt > 0) {
                const alpha = 0.6;
                dragVelocityRef.current = {
                    x:
                        alpha *
                            (((clientX - lastMouseRef.current.x) / dt) * 16) +
                        (1 - alpha) * dragVelocityRef.current.x,
                    y:
                        alpha *
                            (((clientY - lastMouseRef.current.y) / dt) * 16) +
                        (1 - alpha) * dragVelocityRef.current.y,
                };
            }
            lastMouseRef.current = { x: clientX, y: clientY, t: now };
            const winW = windowRef.current.offsetWidth;
            const winH = windowRef.current.offsetHeight;
            const rangeX = window.innerWidth - winW;
            const rangeY = window.innerHeight - winH;
            const newX =
                rangeX > 0
                    ? Math.max(0, Math.min(1, (clientX - grabPoint.x) / rangeX))
                    : 0.5;
            const newY =
                rangeY > 0
                    ? Math.max(0, Math.min(1, (clientY - grabPoint.y) / rangeY))
                    : 0.5;
            positionRef.current = { x: newX * rangeX, y: newY * rangeY };
            setOffset({ x: newX, y: newY });
        },
        [grabPoint],
    );

    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) startDrag(e.clientX, e.clientY);
    };
    const onTouchStart = (e: React.TouchEvent) => {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    useEffect(() => {
        const mouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const touchMove = (e: TouchEvent) => {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
            if (isDraggingRef.current) e.preventDefault();
        };
        const endDrag = () => {
            if (hasGravity)
                velocityRef.current = { ...dragVelocityRef.current };
            isDraggingRef.current = false;
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", mouseMove);
            window.addEventListener("mouseup", endDrag);
            window.addEventListener("touchmove", touchMove, { passive: false });
            window.addEventListener("touchend", endDrag);
        }
        return () => {
            window.removeEventListener("mousemove", mouseMove);
            window.removeEventListener("mouseup", endDrag);
            window.removeEventListener("touchmove", touchMove);
            window.removeEventListener("touchend", endDrag);
        };
    }, [isDragging, handleMove, hasGravity]);

    const getPositionStyles = (): React.CSSProperties => {
        if (typeof window === "undefined" || !windowRef.current)
            return {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
            };
        const rangeX = dimensions.width - windowRef.current.offsetWidth;
        const rangeY = dimensions.height - windowRef.current.offsetHeight;
        return {
            left: `${offset.x * rangeX}px`,
            top: `${offset.y * rangeY}px`,
        };
    };

    const angryMessages: Record<number, string> = {
        1: "Ouch!",
        2: "Stop!",
        3: "Don't test me!",
        4: "That's your last straw buddy!",
        5: "I'm breaking the confines of my window!!!",
    };

    const angryMessage =
        angryMessages[clickCount] ?? "Okay, now you're just being rude.";

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                touchAction: "none",
            }}
        >
            <style>{`
                @keyframes light-shake { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(1px, 1px) rotate(0.5deg); } 50% { transform: translate(-1px, -1px) rotate(-0.5deg); } 75% { transform: translate(1px, -1px) rotate(0.5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
                @keyframes heavy-shake { 0% { transform: translate(0, 0) rotate(0deg); } 10% { transform: translate(-3px, -2px) rotate(-2deg); } 30% { transform: translate(3px, 2px) rotate(2deg); } 50% { transform: translate(-3px, 2px) rotate(-3deg); } 70% { transform: translate(3px, -2px) rotate(3deg); } 90% { transform: translate(-1px, -1px) rotate(-1deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
                .light-shake { animation: light-shake 0.2s infinite; }
                .heavy-shake { animation: heavy-shake 0.1s infinite; }
                .bubble-container { position: absolute; top: -50px; right: -10px; z-index: 20; pointer-events: none; }
            `}</style>
            <div
                ref={windowRef}
                className={`window glass active max-w-md w-full fixed select-none ${getShakeIntensity()}`}
                style={{
                    ...getPositionStyles(),
                    margin: 0,
                    zIndex: 10,
                    backgroundColor: isAngry
                        ? `rgb(${128 + clickCount * 25}, 0, 0)`
                        : undefined,
                }}
            >
                <div
                    className="title-bar"
                    onMouseDown={onMouseDown}
                    onTouchStart={onTouchStart}
                    style={{
                        cursor: isDragging ? "grabbing" : "grab",
                        backgroundColor: isAngry
                            ? `rgb(${128 + clickCount * 25}, 0, 0)`
                            : undefined,
                    }}
                >
                    <div className="title-bar-text">
                        Error{statusCode && `: ${statusCode}`}
                    </div>
                    <div className="title-bar-controls">
                        <button
                            aria-label="Close"
                            onClick={() =>
                                setClickCount((c) => {
                                    const next = c + 1;
                                    if (next >= 6 && !hasGravity) {
                                        velocityRef.current = {
                                            x: (Math.random() - 0.5) * 20,
                                            y: -15,
                                        };
                                        setHasGravity(true);
                                    }
                                    return next;
                                })
                            }
                        />
                    </div>
                </div>
                {!hasGravity ? (
                    <div className="window-body has-space">
                        {isAngry ? (
                            <h1 className="text-2xl">{angryMessage}</h1>
                        ) : (
                            <>
                                <h1 className="text-2xl capitalize">
                                    {message}
                                </h1>
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
            {hasGravity && (
                <div
                    className="window glass active select-none max-w-sm"
                    style={{
                        position: "fixed",
                        bottom: 20,
                        right: 20,
                        zIndex: 100,
                    }}
                >
                    <div className="title-bar">
                        <div className="title-bar-text">Physics Engine</div>
                        <div className="title-bar-controls">
                            <button
                                aria-label="Minimize"
                                onClick={() =>
                                    setPhysicsOptionsMinimized(
                                        !physicsOptionsMinimized,
                                    )
                                }
                            />
                        </div>
                    </div>
                    {!physicsOptionsMinimized && (
                        <div className="window-body has-space">
                            <div
                                className="field-row"
                                style={{ marginBottom: "10px" }}
                            >
                                <input
                                    id="gyro"
                                    type="checkbox"
                                    checked={gyroEnabled}
                                    onChange={(e) => {
                                        if (e.target.checked) requestGyro();
                                        else setGyroEnabled(false);
                                    }}
                                />
                                <label htmlFor="gyro">Gyroscope Gravity</label>
                            </div>
                            <div className="field-row-stacked">
                                <label>Gravity: {gravity.toFixed(2)}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.0001"
                                    value={gravity}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setGravity(v);
                                        gravityRef.current = v;
                                    }}
                                />
                                <label>Bounce: {bounce.toFixed(2)}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={bounce}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setBounce(v);
                                        bounceRef.current = v;
                                    }}
                                />
                                <label>
                                    Friction: {(friction * 1000).toFixed(0)}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.1"
                                    step="0.001"
                                    value={friction}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setFriction(v);
                                        frictionRef.current = v;
                                    }}
                                />
                            </div>
                            <button
                                style={{ width: "100%", marginTop: "10px" }}
                                onClick={resetPhysics}
                            >
                                Reset to Default
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
