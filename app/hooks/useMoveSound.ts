import { useEffect, useRef } from "react";

export function useMoveSound(sourceUrl: string): () => void {
  const poolRef = useRef<HTMLAudioElement[]>([]);
  const nextIndexRef = useRef<number>(0);
  const unlockedRef = useRef<boolean>(false);

  useEffect(() => {
    const pool: HTMLAudioElement[] = [];
    for (let i = 0; i < 3; i += 1) {
      const a = new Audio(sourceUrl);
      a.preload = "auto";
      try {
        a.load();
      } catch {}
      pool.push(a);
    }
    poolRef.current = pool;

    const unlock = async () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      for (const a of poolRef.current) {
        try {
          await a.play();
          a.pause();
          a.currentTime = 0;
        } catch {}
      }
    };

    const pointerDownHandler = () => void unlock();
    const keyHandler = () => void unlock();
    window.addEventListener("pointerdown", pointerDownHandler);
    window.addEventListener("keydown", keyHandler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", pointerDownHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [sourceUrl]);

  const play = () => {
    const pool = poolRef.current;
    if (!pool || pool.length === 0) return;
    const index = nextIndexRef.current % pool.length;
    nextIndexRef.current = (index + 1) % pool.length;
    const a = pool[index];
    try {
      a.currentTime = 0;
      void a.play();
    } catch {}
  };

  return play;
}
