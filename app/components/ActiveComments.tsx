"use client";

import { useEffect, useState } from "react";

export default function ActiveComments() {
  const [items, setItems] = useState<
    Array<{ nickname: string; content: string }>
  >([]);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/get-active-comments");
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) setItems(data.data);
      } catch {}
    };
    load();
  }, []);

  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ color: "#ff6b35", marginBottom: 6, textShadow: "none" }}>
        Active comments (shared):
      </div>
      {items.map((it) => (
        <div key={it.nickname} className="terminal-line">
          <span className="output">
            {it.nickname}: {it.content}
          </span>
        </div>
      ))}
    </div>
  );
}
