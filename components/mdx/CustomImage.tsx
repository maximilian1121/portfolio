import { ComponentPropsWithoutRef } from "react";

export function CustomImage(props: ComponentPropsWithoutRef<"img">) {
    const { src, alt, ...rest } = props;

    return (
        <img
            src={src}
            alt={alt}
            className="rounded-lg border border-gray-200"
            {...rest}
        />
    );
}
