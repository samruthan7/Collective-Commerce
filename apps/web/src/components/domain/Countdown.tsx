"use client";

import { useEffect, useState } from "react";
import { formatTimeLeft } from "@/lib/time";

export function Countdown({ target }: { target: string }) {
  const [label, setLabel] = useState<string>("…");
  useEffect(() => {
    const tick = () => setLabel(formatTimeLeft(target));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [target]);
  return <span>{label}</span>;
}
