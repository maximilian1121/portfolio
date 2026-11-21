"use client";

type PhysicsControlsProps = {
    gyroEnabled: boolean;
    minimized: boolean;
    gravity: number;
    bounce: number;
    friction: number;
    onGyroChange: (enabled: boolean) => void;
    onMinimizedChange: () => void;
    onGravityChange: (value: number) => void;
    onBounceChange: (value: number) => void;
    onFrictionChange: (value: number) => void;
    onReset: () => void;
};

export default function PhysicsControls({
    gyroEnabled,
    minimized,
    gravity,
    bounce,
    friction,
    onGyroChange,
    onMinimizedChange,
    onGravityChange,
    onBounceChange,
    onFrictionChange,
    onReset,
}: PhysicsControlsProps) {
    return (
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
                        onClick={onMinimizedChange}
                    />
                </div>
            </div>
            {!minimized && (
                <div className="window-body has-space">
                    <div
                        className="field-row"
                        style={{ marginBottom: "10px" }}
                    >
                        <input
                            id="gyro"
                            type="checkbox"
                            checked={gyroEnabled}
                            onChange={(event) =>
                                onGyroChange(event.target.checked)
                            }
                        />
                        <label htmlFor="gyro">Gyroscope Gravity</label>
                    </div>
                    <div className="field-row-stacked">
                        <label htmlFor="physics-gravity">
                            Gravity: {gravity.toFixed(2)}
                        </label>
                        <input
                            id="physics-gravity"
                            type="range"
                            min="0"
                            max="2"
                            step="0.0001"
                            value={gravity}
                            onChange={(event) =>
                                onGravityChange(Number(event.target.value))
                            }
                        />
                        <label htmlFor="physics-bounce">
                            Bounce: {bounce.toFixed(2)}
                        </label>
                        <input
                            id="physics-bounce"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={bounce}
                            onChange={(event) =>
                                onBounceChange(Number(event.target.value))
                            }
                        />
                        <label htmlFor="physics-friction">
                            Friction: {(friction * 1000).toFixed(0)}%
                        </label>
                        <input
                            id="physics-friction"
                            type="range"
                            min="0"
                            max="0.1"
                            step="0.001"
                            value={friction}
                            onChange={(event) =>
                                onFrictionChange(Number(event.target.value))
                            }
                        />
                    </div>
                    <button
                        style={{ width: "100%", marginTop: "10px" }}
                        onClick={onReset}
                    >
                        Reset to Default
                    </button>
                </div>
            )}
        </div>
    );
}
