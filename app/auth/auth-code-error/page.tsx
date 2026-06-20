"use client";

import ErrorTemplate from "@/components/error-template";
import { useEffect, useState } from "react";

export default function AuthCodeError() {
    const [errorData, setErrorData] = useState({
        message: "An unknown error occurred",
        description: "Please try logging in again.",
    });

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (!hash) return;

        const params = new URLSearchParams(hash);

        const error =
            params.get("error")?.replace(/_/g, " ") || "Authentication Error";
        const description =
            params.get("error_description")?.replace(/\+/g, " ") ||
            "Something went wrong during sign-in.";

        setErrorData({
            message: error,
            description: description,
        });
    }, []);

    return (
        <ErrorTemplate
            message={errorData.message}
            description={errorData.description}
            reset={() => {}}
            actions={[
                <button
                    key="home"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                >
                    Back to Login
                </button>,
            ]}
        />
    );
}
