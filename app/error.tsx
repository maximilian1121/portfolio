"use client";

import ErrorTemplate from "@/components/errors/ErrorTemplate";

const serverErrorMessages: string[] = [
    "Our servers are currently contemplating their own existence. They've decided to stop working and start a philosophy club.",
    "A digital moth flew into the motherboard. We are currently performing a tiny, solemn funeral.",
    "The code reached a conclusion it didn't like. It is currently sulking in the corner.",
    "We told the database a joke so funny it forgot how to retrieve your data.",
    "The hamsters powering this site have gone on strike. They are demanding higher quality cedar shavings.",
    "A wizard promised us 'infinite scaling.' Turns out, he just turned the server into a frog.",
    "The logic gate has become a logic fence. We are currently trying to climb over it.",
    "Spooky whispers: 'The variables... they won't stay in their boxes...'",
    "The CPU is currently experiencing an existential crisis. It refuses to compute until it finds its 'spark.'",
    "We accidentally let a 'divide by zero' error out of its cage. It's eating the UI as we speak.",
];

export default function NotFound() {
    return (
        <ErrorTemplate
            statusCode={500}
            message="Something went wrong"
            description={
                serverErrorMessages[
                    Math.floor(Math.random() * serverErrorMessages.length)
                ]
            }
            reset={() => {}}
            actions={[
                <button
                    key="home"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
