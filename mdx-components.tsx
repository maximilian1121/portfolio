import { MDXComponents } from "mdx/types.js";
import { CustomImage } from "./components/mdx/CustomImage";
import { SteamGame } from "./components/mdx/SteamGame";
import Video from "./components/mdx/Video";
import { Window7 } from "./components/mdx/Window7";

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...components,
        SteamGame,
        img: CustomImage,
        Video,
        Window7,
    };
}
