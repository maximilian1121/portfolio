"use client";

import { useEffect, useRef, useState } from "react";

interface PhysicsState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    id: number;
}

const TumbleweedOverlay = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [weeds, setWeeds] = useState<PhysicsState[]>([]);

    const GRAVITY = 0.2;
    const JUMP_FORCE = 7;
    const WIND_SPEED = 6;
    const SIZE = 80;

    useEffect(() => {
        const weedCount = 5;
        const initialWeeds = Array.from({ length: weedCount }).map(
            (_, index) => {
                const randomX = -100 - Math.random() * 1000;

                const randomY = Math.random() * 50;

                const speedVariance = 0.8 + Math.random() * 0.4;

                return {
                    id: index,
                    x: randomX,
                    y: randomY,
                    vx: WIND_SPEED * speedVariance,
                    vy: 0,
                    rotation: Math.random() * 360,
                };
            },
        );

        setWeeds(initialWeeds);
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        const updatePhysics = () => {
            if (!containerRef.current) return;

            const { width, height } =
                containerRef.current.getBoundingClientRect();

            setWeeds((prevWeeds) =>
                prevWeeds.map((weed) => {
                    let { x, y, vx, vy, rotation } = weed;

                    vy += GRAVITY;
                    x += vx;
                    y += vy;

                    const floorLine = height - SIZE;

                    if (y >= floorLine) {
                        y = floorLine;
                        vy = -JUMP_FORCE * (Math.random() + 1);
                    }

                    if (x > width + 200) {
                        x = -200;
                    }

                    rotation += vx * 2;

                    return { ...weed, x, y, vx, vy, rotation };
                }),
            );

            animationFrameId = requestAnimationFrame(updatePhysics);
        };

        animationFrameId = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
        >
            {weeds.map((weed) => (
                <div
                    key={weed.id}
                    className="absolute left-0 top-0 -z-5"
                    style={{
                        transform: `translate3d(${weed.x}px, ${weed.y}px, 0)`,
                    }}
                >
                    <div
                        style={{ transform: `rotate(${weed.rotation}deg)` }}
                        className="w-20 h-20 flex items-center justify-center"
                    >
                        <img src="/tumbleweed.png" className="w-full h-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TumbleweedOverlay;
