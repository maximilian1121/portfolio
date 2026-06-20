"use client";

import { Link } from "@mui/material";
import ErrorTemplate from "../components/error-template";

const notFoundMessages: string[] = [
    "This page has ascended to a higher plane of consciousness. It no longer concerns itself with 'URLs'.",
    "You've reached the edge of the map. Beyond here, there be dragons (and broken links).",
    "I looked everywhere. Under the rug, behind the fridge, even in the 'junk drawer' of the internet. Not here.",
    "This page is like your favorite socks: it existed this morning, but the dryer of the internet has claimed it.",
    "MISSING: Have you seen this page? Last seen wearing a blue header and a footer made of copyright text.",
    "You took a wrong turn at the last semicolon. Please backtrack and try the path less glitched.",
    "This link was a secret. Now that you've found it, it has vanished to protect its identity.",
    "This page is currently out picking wild berries. It may return when the moon is full.",
    "The ghosts in the machine have moved the furniture again. This door leads to a brick wall.",
    "Oops! You've entered a parallel dimension where this page was never built. Please return to your own timeline.",
];

export default function NotFound() {
    return (
        <ErrorTemplate
            statusCode={404}
            message="File not found"
            description={
                notFoundMessages[
                    Math.floor(Math.random() * notFoundMessages.length)
                ]
            }
            reset={() => {}}
            actions={[
                <button
                    key="home"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                >
                    Go to Home
                </button>,
            ]}
        />
    );
}
