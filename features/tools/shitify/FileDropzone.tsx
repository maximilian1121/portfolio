"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

type FileDropzoneProps = {
    onFileSelected: (file: File) => void;
};

const ACCEPTED_TYPES = {
    "image/*": [],
    "video/*": [],
    "audio/*": [],
};

export default function FileDropzone({ onFileSelected }: FileDropzoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) onFileSelected(file);
        },
        [onFileSelected],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: ACCEPTED_TYPES,
    });

    return (
        <div
            {...getRootProps()}
            className={`shitify-dropzone${isDragActive ? " is-active" : ""}`}
        >
            <input {...getInputProps()} />
            <p className="shitify-dropzone-title">
                Drop a file here or click to choose one
            </p>
            <p className="shitify-dropzone-hint">Images • Videos • Audio</p>
        </div>
    );
}
