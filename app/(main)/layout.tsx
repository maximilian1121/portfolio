"use server";

import MainAppBar from "@/components/windowframe";

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <MainAppBar gitSha={process.env.VERCEL_GIT_COMMIT_SHA}>
            {children}
        </MainAppBar>
    );
}
