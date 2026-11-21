"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Creates an object URL for `file` and returns it synchronously (via
 * useMemo, so there's no initial null render).
 *
 * Revocation is deferred by one tick and cancelled if the effect re-runs
 * immediately after — which is exactly what happens during React 18
 * Strict Mode's dev-only mount -> cleanup -> remount cycle. That means
 * the URL survives Strict Mode's phantom remount but still gets revoked
 * on a genuine unmount or when `file` changes.
 */
export function useObjectUrl(file: File): string {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    const pendingRevoke = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (pendingRevoke.current !== null) {
            clearTimeout(pendingRevoke.current);
            pendingRevoke.current = null;
        }

        return () => {
            pendingRevoke.current = setTimeout(() => {
                URL.revokeObjectURL(url);
                pendingRevoke.current = null;
            }, 0);
        };
    }, [url]);

    return url;
}
