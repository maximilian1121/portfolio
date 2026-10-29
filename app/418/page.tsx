"use client";

import ErrorTemplate from "@/components/error-template";
import { Link } from "@mui/material";
import { TbTeapot } from "react-icons/tb";
import { GiTeapot } from "react-icons/gi";


export default function Teapot() {
    return (
        <ErrorTemplate
            statusCode={418}
            message="Teapot"
            description={<p>I'm a little teapot, short and stout. Here is my handle, here is my spout. <GiTeapot/></p>}
            reset={() => {}}
            actions={[
                <button
                    key="home"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                >
                    Go to Home
                </button>,
            ]}
        />
    );
}
