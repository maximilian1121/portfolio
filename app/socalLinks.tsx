import Link from "next/link";

const links = [
  { href: "https://github.com/maximilian1121/", label: "Github", bg: "bg-gray-800", img: "https://github.githubassets.com/favicons/favicon-dark.svg" },
  { href: "https://modrinth.com/user/Max111", label: "Modrinth", bg: "bg-green-400", img: "https://modrinth.com/favicon.ico" },
  { href: "https://www.youtube.com/@Tir5d.Turtle", label: "Youtube", bg: "bg-red-500", img: "/ytico.png" },
  { href: "https://www.roblox.com/users/2243234791/profile", label: "Roblox", bg: "bg-blue-500", img: "/robloxico.png" },
  { href: "https://modrinth.com/mod/cursed-mccraft", label: "Cursed Craft", bg: "bg-orange-500", img: "/mcico.webp", dontInvert: true},
];

export default function SocialLinks() {
  return (
    <div className="overflow-y-auto overflow-x-hidden w-full h-fit justify-center flex flex-row p-8 md:gap-5 gap-4 flex-wrap">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${link.bg} flex w-fit flex-row justify-center items-center gap-2 md:p-4 p-2 rounded-md hover:scale-[1.1] transition-all text-[#ededed]`}
        >
          <img
            className={`h-8 sm:h-6 ${!link.dontInvert ? 'invert brightness-0' : ''}`}
            src={link.img}
            />
          {link.label}
        </Link>
      ))}
    </div>
  );
}