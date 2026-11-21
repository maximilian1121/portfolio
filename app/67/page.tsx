"use client";

import ErrorTemplate from "@/components/errors/ErrorTemplate";
import { useEffect, useState } from "react";

export default function Page67() {
    return (
        <ErrorTemplate
            statusCode={6767676767}
            message={`Bro it's ${new Date().getFullYear()}`}
            description={`That meme died ${new Date().getFullYear() - 2025} year(s) ago`}
            actions={[]}
            reset={() => {}}
        />
    );
}
