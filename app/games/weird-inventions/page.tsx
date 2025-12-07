"use client";
import { useEffect, useState } from "react";

const topbarId = "topBar";

export default function WeirdInventions() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function updateHeight() {
      const topbar = document.getElementById(topbarId);
      if (topbar) {
        setHeight(window.innerHeight - topbar.offsetHeight);
      }
    }

    updateHeight();

    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div style={{ height: `${height - 3}px` }}>
      <iframe src="https://weird-inventions.latific.click/" className="w-full h-full" />
    </div>
  );
}
