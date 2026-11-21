"use client";

import { useEffect } from "react";

export function BreadcrumbEmitter({ name }: { name: string }) {
    useEffect(() => {
        const event = new CustomEvent("set-breadcrumb", { detail: name });
        window.dispatchEvent(event);

        return () => {
            window.dispatchEvent(
                new CustomEvent("set-breadcrumb", { detail: "" }),
            );
        };
    }, [name]);

    return null;
}
