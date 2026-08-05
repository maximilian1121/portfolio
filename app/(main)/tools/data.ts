type Tool = {
    id: string;
    title: string;
    usefulness: number;
    description: string;
    category?: string[] | string;
    link?: string;
};

export const TOOLS_DATA: Tool[] = [
    {
        id: "1",
        title: "Shitify",
        usefulness: 0.2,
        link: "/tools/shitify",
        category: ["Multimedia", "Compression"],
        description:
            "Compress and intentionally degrade images, videos, audio, and more with adjustable quality.",
    },
    {
        id: "2",
        title: "Whisper",
        usefulness: 0.8,
        link: "/tools/whisper",
        category: ["Audio", "Transcription"],
        description:
            "Transcribe audio files or live microphone input to text using OpenAI's Whisper model.",
    },
];
