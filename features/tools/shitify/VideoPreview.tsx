"use client";

type VideoPreviewProps = {
    previewUrl: string | null;
    outputUrl: string | null;
};

export default function VideoPreview({
    previewUrl,
    outputUrl,
}: VideoPreviewProps) {
    return (
        <div
            style={{
                flex: "1 1 0",
                minWidth: 280,
                borderLeft: "1px solid #999",
                paddingLeft: "1.5rem",
            }}
        >
            {previewUrl && (
                <video
                    src={previewUrl}
                    controls
                    style={{
                        width: "100%",
                        maxHeight: 300,
                        border: "1px solid #999",
                    }}
                />
            )}
            {outputUrl && (
                <>
                    <p
                        style={{
                            fontWeight: "bold",
                            margin: "0.75rem 0 0.25rem",
                        }}
                    >
                        Trashified
                    </p>
                    <video
                        src={outputUrl}
                        controls
                        style={{
                            width: "100%",
                            maxHeight: 300,
                            border: "1px solid #999",
                        }}
                    />
                </>
            )}
        </div>
    );
}
