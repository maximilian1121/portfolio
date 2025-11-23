import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { FaHome, FaNewspaper, FaDownload, FaCookie } from "react-icons/fa";
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maximilian - the website.",
  description: "Maximilians website.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Analytics/>
        <nav className="bg-neutral-primary fixed w-full z-20 top-0 left-0 border-b border-gray-600 bg-gray-700">
          <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <Image
                alt="Profile picture"
                width={256}
                height={256}
                className="rounded-full h-7 w-7"
                src="/icon"
              />
              <span className="self-center text-xl text-heading font-semibold whitespace-nowrap">
                Maximilian the website
              </span>
            </Link>

            {/* Hamburger button */}
            <button
              id="navbar-toggle"
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-md md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
              aria-controls="navbar-default"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
              </svg>
            </button>

            {/* Menu */}
            <div className="hidden w-full md:block md:w-auto" id="navbar-default">
              <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-600 rounded-md bg-gray-800 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-transparent">
                <li>
                  <Link href="/" className="flex items-center gap-1 py-2 px-3 font-bold text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0">
                    <FaHome className="h-5 w-5" /> Home
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="flex items-center gap-1 py-2 px-3 font-bold text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0">
                    <FaNewspaper className="h-5 w-5" /> Blog
                  </Link>
                </li>
                <li>
                  <Link href="/download-more-ram" className="flex items-center gap-1 py-2 px-3 font-bold text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0">
                    <FaDownload className="h-5 w-5" /> Download Ram
                  </Link>
                </li>
                <li>
                  <Link href="/ai-cookie-clicker" className="flex items-center gap-1 py-2 px-3 font-bold text-white bg-brand rounded md:bg-transparent md:text-fg-brand md:p-0">
                    <FaCookie className="h-5 w-5" /> Ai Cookie Clicker
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="h-16"></div>
        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `
      const toggleButton = document.getElementById('navbar-toggle');
      const menu = document.getElementById('navbar-default');

      // toggle menu on hamburger click
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent click from bubbling to document
        menu.classList.toggle('hidden');
      });

      // hide menu when any link inside is clicked
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.add('hidden');
        });
      });

      // hide menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggleButton.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });
    `,
          }}
        />

      </body>
    </html>

  );
}
