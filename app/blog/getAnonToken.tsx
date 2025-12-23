"use client";

import { useEffect } from "react";

export default function GetAnonToken() {
  useEffect(() => {
    fetch("/api/anon/new_anon", {
      method: "POST",
    }); // server will set it if the user doesn't have one and will not not set new ones if user does
  }, []);

  return <></>;
}
