export function SteamGame({
    children,
    appId,
}: {
    children?: string;
    appId?: string;
}) {
    const id = appId || children?.trim();

    if (!id) return null;

    return (
        <iframe
            src={`https://store.steampowered.com/widget/${id}/`}
            frameBorder="0"
            width="100%"
            height="190"
            loading="lazy"
            style={{ borderRadius: "8px", margin: "1rem 0" }}
        />
    );
}
