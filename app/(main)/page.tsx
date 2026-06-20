import Image from "next/image";
import Link from "next/link";

import {
    SiCss,
    SiFirebase,
    SiGithub,
    SiGodotengine,
    SiHtml5,
    SiJavascript,
    SiLua,
    SiModrinth,
    SiNextdotjs,
    SiPostgresql,
    SiReact,
    SiRobloxstudio,
    SiSharp,
    SiSupabase,
    SiTailwindcss,
    SiTypescript,
    SiUnity,
    SiVercel,
    SiYoutube,
} from "react-icons/si";

import { DiJava } from "react-icons/di";
import { LuPickaxe } from "react-icons/lu";

const languages = [
    { name: "TypeScript", icon: <SiTypescript /> },
    { name: "JavaScript", icon: <SiJavascript /> },
    { name: "Lua/Luau", icon: <SiLua /> },
    { name: "GDScript", icon: <SiGodotengine /> },
    { name: "Java", icon: <DiJava /> },
    { name: "C#", icon: <SiSharp /> },
    { name: "HTML", icon: <SiHtml5 /> },
    { name: "CSS", icon: <SiCss /> },
];

const frameworksAndEngines = [
    { name: "React", icon: <SiReact /> },
    { name: "Unity", icon: <SiUnity /> },
    { name: "Godot", icon: <SiGodotengine /> },
    { name: "Next.js", icon: <SiNextdotjs /> },
    { name: "Minecraft Modding", icon: <LuPickaxe /> },
    { name: "Supabase", icon: <SiSupabase /> },
    { name: "Firebase", icon: <SiFirebase /> },
    { name: "PostgreSQL", icon: <SiPostgresql /> },
    { name: "Tailwind CSS", icon: <SiTailwindcss /> },
    { name: "Vercel", icon: <SiVercel /> },
    { name: "Roblox Studio", icon: <SiRobloxstudio /> },
];

const links = [
    {
        name: "Youtube",
        icon: <SiYoutube />,
        href: "https://www.youtube.com/@maximilian11121",
    },
    {
        name: "Github",
        icon: <SiGithub />,
        href: "https://www.github.com/maximilian1121",
    },
    {
        name: "Modrinth",
        icon: <SiModrinth />,
        href: "https://modrinth.com/user/Max111",
    },
    {
        name: "Roblox dev group",
        icon: <SiRobloxstudio />,
        href: "https://www.roblox.com/communities/33088361/Maximilians-dungeon",
    },
];

export default async function Home() {
    return (
        <div className="flex flex-col max-w-4xl mx-auto gap-6 px-4">
            <div className="flex items-center text-left gap-6">
                <Image
                    src="/icon"
                    alt="Icon"
                    width={128}
                    height={128}
                    className="w-20 h-20 sm:w-32 sm:h-32 object-contain"
                />
                <span>
                    <h1 className="sm:text-4xl text-2xl font-semibold sm:font-bold mb-2 sm:mb-4">
                        Maximilian
                    </h1>
                    <h2 className="sm:text-xl text-md font-semibold">
                        Hobby dev (Games/Apps)
                    </h2>
                </span>
            </div>

            <span className="flex flex-col gap-4">
                <h1 className="sm:text-4xl text-2xl font-semibold sm:font-bold mb-2 sm:mb-4">
                    Biography
                </h1>
                <p className="sm:text-lg text-md">
                    I'm a hobby developer with a passion for creating games and
                    apps. I started programming at a young age and have been
                    learning ever since. I enjoy working on projects that
                    challenge me and allow me to learn new things.
                </p>
            </span>
            <div className="flex flex-col gap-4">
                <h1 className="sm:text-4xl text-2xl font-semibold sm:font-bold mb-2 sm:mb-4">
                    Skills/Abilities
                </h1>
                <h2 className="sm:text-2xl text-xl font-semibold">Languages</h2>

                <div className="flex flex-wrap gap-x-8 gap-y-4 justify-start items-center w-full">
                    {languages.map((lang, index) => (
                        <div
                            key={index}
                            className="text-2xl sm:text-4xl flex items-center gap-2 sm:gap-4 w-fit [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-10 sm:[&>svg]:h-10"
                        >
                            {lang.icon}{" "}
                            <h1 className="sm:text-lg text-sm">{lang.name}</h1>
                        </div>
                    ))}
                </div>

                <h2 className="sm:text-2xl text-xl font-semibold mt-4">
                    Frameworks/Game engines
                </h2>
                <div className="flex flex-wrap gap-x-8 gap-y-4 justify-start items-center w-full">
                    {frameworksAndEngines.map((eng, index) => (
                        <div
                            key={index}
                            className="text-2xl sm:text-4xl flex items-center gap-2 sm:gap-4 w-fit [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-10 sm:[&>svg]:h-10"
                        >
                            {eng.icon}{" "}
                            <h1 className="sm:text-lg text-sm">{eng.name}</h1>
                        </div>
                    ))}
                </div>
            </div>
            <span className="flex flex-col gap-4 mt-4">
                <h1 className="sm:text-4xl text-2xl font-semibold sm:font-bold mb-2 sm:mb-4">
                    Links
                </h1>
                <div className="flex flex-wrap gap-4 sm:gap-6">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6 hover:opacity-80 transition-opacity"
                        >
                            {link.icon}{" "}
                            <h1 className="sm:text-lg text-sm">{link.name}</h1>
                        </Link>
                    ))}
                </div>
            </span>
        </div>
    );
}
