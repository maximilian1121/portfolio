import Image from "next/image";
import { supabase } from '../lib/supabaseClient';
import Link from "next/link";
import SocialLinks from "./socalLinks";

export default async function Page() {

  const { data: top_langs, count } = await supabase
    .from('top_langs')
    .select('*', { count: 'exact' })
    .order('lines', { ascending: false });

  return (
    <div className="max-w-3xl py-12 space-y-8 mx-2 md:mx-auto">
      <div className="flex items-center justify-center gap-6" id="profile-card">
        <Image
          alt="Profile picture"
          width={256}
          height={256}
          className="rounded-full h-32 w-32 md:h-64 md:w-64"
          src="/icon"
        />
        <div className="flex flex-col gap-7">
          <h1 className="text-2xl md:text-4xl font-semibold">Maximilian</h1>
          <h2 className="text-1xl md:text-2xl font-semibold">Average hobby developer</h2>
        </div>
      </div>
      <div className="flex gap-10 align-top justify-center flex-col transition-all">
        <div className="flex flex-col md:text-2xl text-lg justify-center align-middle">
          <h1 className="text-center">About me</h1>
          <p className="mt-4 text-center">
            Hi, I'm Maximilian. I'm spending a lot of my time to make a single Roblox game. I cant say just yet what it it is or what it's about, but I can say that it has car's
            I love making games and I find that im really good at making funny additions to such games or Minecraft mods. 
            Speaking of Minecraft mods, anyone who uses anything but fabric is WRONG! Fabric is my personal go to for making Mods
            It's API I remember by heart and I love using it.
            I also spend time working on side projects like this site. Thats not all tho, I also work on a few open source projects on GitHub.
            I also game, duh. My favorite games of all time in order are probably Boneworks, Minecraft, and Roblox (the game studio).
          </p>
        </div>
        <div className="flex flex-col md:text-2xl text-lg justify-center align-middle">
          <h1 className="text-center">Links</h1>
          <SocialLinks></SocialLinks>
        </div>
      </div>
    </div>
  );
}