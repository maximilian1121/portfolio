"use client";
import { BreadcrumbEmitter } from "@/components/BreadcrumbEmitter";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef, useMemo } from "react";

const supabase = createClient();

export default function TheSwitch() {
    const [switchState, setSwitchState] = useState<boolean>(false);
    const [isPending, setIsPending] = useState<boolean>(false);
    const [onlineCount, setOnlineCount] = useState<number>(1);

    const lastClickTime = useRef<number>(0);

    const sessionId = useMemo(
        () => Math.random().toString(36).substring(2, 15),
        [],
    );

    useEffect(() => {
        const getInitialState = async () => {
            const { data } = await supabase
                .from("the-switch")
                .select("state")
                .eq("id", 1)
                .single();
            if (data) setSwitchState(!!data.state);
        };
        getInitialState();

        const channel = supabase.channel("the-switch-room", {
            config: { presence: { key: sessionId } },
        });

        channel
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "the-switch",
                    filter: "id=eq.1",
                },
                (payload) => {
                    if (payload.new && "state" in payload.new) {
                        setSwitchState(!!payload.new.state);
                    }
                },
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, sessionId]);

    const toggleSwitch = async () => {
        const now = Date.now();
        if (now - lastClickTime.current < 1000 || isPending) return;

        lastClickTime.current = now;
        setIsPending(true);

        const nextState = !switchState;
        setSwitchState(nextState);

        const { error } = await supabase
            .from("the-switch")
            .update({ state: nextState })
            .eq("id", 1);

        if (error) {
            console.error("Update failed:", error.message);
            setSwitchState(!nextState);
        }
        setIsPending(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full gap-6 p-4">
            <BreadcrumbEmitter name={"The Switch"} />
            <div className="text-center">
                <h1 className="font-bold text-4xl mb-2">The Switch</h1>
                <p className="text-sm opacity-70">
                    {onlineCount} {onlineCount === 1 ? "person" : "people"}{" "}
                    currently here
                </p>
            </div>

            <div className="flex items-center justify-center gap-2">
                <input
                    type="checkbox"
                    id="switch"
                    disabled={isPending}
                    checked={switchState}
                    onChange={toggleSwitch}
                    style={{ margin: 0, padding: 0, cursor: "pointer" }}
                />
                <label
                    htmlFor="switch"
                    className="cursor-pointer select-none"
                    style={{ margin: 0, padding: 0 }}
                >
                    {isPending
                        ? "Syncing..."
                        : `State is ${switchState ? "ON" : "OFF"}`}
                </label>
            </div>
        </div>
    );
}
