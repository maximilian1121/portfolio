export type FileKind = "image" | "video" | "audio" | "unsupported";

export function getFileKind(file: File): FileKind {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "unsupported";
}
