export default function Video(props: React.ComponentPropsWithoutRef<"video">) {
    const { src, ...rest } = props;

    return (
        <video
            src={src}
            controls
            className="rounded-lg w-full my-4"
            {...rest}
        />
    );
}
