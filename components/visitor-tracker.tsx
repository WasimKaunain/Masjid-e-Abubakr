"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    // Fire-and-forget; never block rendering.
    fetch("/api/visitors", { method: "POST" }).catch(() => undefined);
  }, []);

  return null;
}
