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
        <div className="flex flex-row gap-10 justify-center align-middle flex-wrap md:flex-nowrap transition-all">
          <Image className="dark:hidden" src="https://github-readme-stats.vercel.app/api?username=maximilian1121" alt="Github top langs"></Image>
          <Image className="dark:block hidden" src="https://github-readme-stats.vercel.app/api?username=maximilian1121&theme=dark" alt="Github top langs dark"></Image>
          <Image className="dark:hidden" src="https://github-readme-stats.vercel.app/api/top-langs/?username=maximilian1121" alt="Github stats"></Image>
          <Image className="dark:block hidden" src="https://github-readme-stats.vercel.app/api/top-langs?username=maximilian1121&theme=dark" alt="Github stats dark"></Image>
        </div>
        <div className="flex flex-col md:text-2xl text-lg justify-center align-middle">
          <h1 className="text-center">Links</h1>
          <SocialLinks></SocialLinks>
        </div>
      </div>
    </div>
  );
}