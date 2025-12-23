"use client";

import { useEffect } from "react";

export function getNewAnonToken() {
    fetch("/api/anon/new_anon", {
        method: "POST",
    }); // server will set it if the user doesn't have one and will not not set new ones if user does
}

export default function GetAnonToken() {
    useEffect(getNewAnonToken, []);

    return <></>;
}
