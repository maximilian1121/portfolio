"use client";
import { useEffect, useState } from "react";
import { FaSpinner, FaThumbsUp } from "react-icons/fa";
import { getNewAnonToken } from "../getAnonToken";

interface LikeButtonProps {
    post: any;
}

export default function LikeButton({ post }: LikeButtonProps) {
    const [currentUpvotes, setCurrentUpvotes] = useState<number>(post.upvotes);
    const [processing, setProcessing] = useState(false);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showMessage, setShowMessage] = useState(false);
    const [showError, setShowError] = useState(false);

    // auto-hide success message
    useEffect(() => {
        if (!showMessage) return;
        const t = setTimeout(() => setShowMessage(false), 1000);
        return () => clearTimeout(t);
    }, [showMessage]);

    // auto-hide error message
    useEffect(() => {
        if (!showError) return;
        const t = setTimeout(() => setShowError(false), 1000);
        return () => clearTimeout(t);
    }, [showError]);

    // clear text AFTER exit animation
    useEffect(() => {
        if (showMessage || !message) return;
        const t = setTimeout(() => setMessage(null), 300);
        return () => clearTimeout(t);
    }, [showMessage, message]);

    useEffect(() => {
        if (showError || !error) return;
        const t = setTimeout(() => setError(null), 300);
        return () => clearTimeout(t);
    }, [showError, error]);

    const updateCurrentVotesPoll = () => {
        fetch(`/api/post/upvote?slug=${post.slug}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => {
                if (json) setCurrentUpvotes(json.upvotes);
            })
            .catch(() => {});
    };

    const likePost = () => {
        setProcessing(true);
        setMessage(null);
        setError(null);
        setShowMessage(false);
        setShowError(false);

        fetch(`/api/post/upvote?slug=${post.slug}`, { method: "POST" })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.error) {
                    throw new Error(data.error || "Failed to like post");
                }

                setMessage("Liked post");
                setShowMessage(true);
                updateCurrentVotesPoll();
            })
            .catch((err) => {
                console.error("Failed to like post:", err);
                if (err.message == "Invalid anonymous user token") {
                    getNewAnonToken()
                }
                setError(err.message || "Failed to like");
                setShowError(true);
            })
            .finally(() => setProcessing(false));
    };

    return (
        <div className="mb-2 w-full flex justify-end">
            <div className="relative">
                {/* Processing */}
                <span
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-1 rounded transition-all duration-300 whitespace-nowrap ${
                        processing
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                    }`}
                >
                    Updating...
                </span>

                {/* Error */}
                <span
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 text-red-400 text-xs px-2 py-1 rounded transition-all duration-300 whitespace-nowrap ${
                        showError
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                    }`}
                >
                    {error}
                </span>

                {/* Success */}
                <span
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 text-green-400 text-xs px-2 py-1 rounded transition-all duration-300 whitespace-nowrap ${
                        showMessage
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                    }`}
                >
                    {message}
                </span>

                {!processing ? (
                    <label
                        onClick={likePost}
                        title="I like this"
                        className="px-4 select-none py-1 bg-[rgba(255,27,152,0.5)] rounded-lg cursor-pointer flex items-center gap-1"
                    >
                        <FaThumbsUp />
                        {currentUpvotes}
                    </label>
                ) : (
                    <label
                        title="I like this"
                        className="px-4 select-none py-1 bg-[rgba(255,27,152,0.5)] rounded-lg flex items-center gap-1"
                    >
                        <FaSpinner className="animate-spin" />
                        {currentUpvotes}
                    </label>
                )}
            </div>
        </div>
    );
}
