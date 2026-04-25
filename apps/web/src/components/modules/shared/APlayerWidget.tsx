"use client";

import "aplayer/dist/APlayer.min.css";

import { useEffect, useRef } from "react";

interface APlayerAudio {
  name: string;
  artist: string;
  url: string;
  cover?: string;
  lrc?: string;
  theme?: string;
}

interface APlayerWidgetProps {
  audio?: APlayerAudio[];
  theme?: string;
  autoplay?: boolean;
  loop?: "all" | "one" | "none";
  order?: "list" | "random";
  volume?: number;
  mini?: boolean;
}

const DEFAULT_AUDIO: APlayerAudio[] = [
  {
    name: "未完成ストライド",
    artist: "こだまさおり",
    url: "https://img.eruchitand.top/music/hyouka.mp3",
    cover:
      "https://img.eruchitand.top/2026/04/c6fafbc1cc86982e7e5b19c0ba13ca46.png",
  },
  {
    name: "優しさの理由",
    artist: "ChouCho",
    url: "https://img.eruchitand.top/music/hyouka1.mp3",
    cover:
      "https://img.eruchitand.top/2026/04/95398e7735e578b70d35a6dc995654db.png",
  },
];

export const APlayerWidget = ({
  audio = DEFAULT_AUDIO,
  theme = "#60a9b4",
  autoplay = false,
  loop = "all",
  order = "random",
  volume = 0.5,
  mini = false,
}: APlayerWidgetProps = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: { destroy?: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const mod = (await import("aplayer")) as any;
      const APlayer = mod.default ?? mod;
      if (cancelled || !containerRef.current) return;
      instance = new APlayer({
        container: containerRef.current,
        fixed: true,
        mini,
        autoplay,
        theme,
        loop,
        order,
        preload: "auto",
        volume,
        audio,
      });
    })();

    return () => {
      cancelled = true;
      instance?.destroy?.();
    };
  }, [audio, theme, autoplay, loop, order, volume, mini]);

  return <div data-hide-print ref={containerRef} />;
};
