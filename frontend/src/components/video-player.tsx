"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";
import { Card, CardContent } from "@/components/ui/card";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      if (!videoRef.current) return;

      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: "auto",
        poster: poster,
        playbackRates: [0.5, 1, 1.5, 2],
      });
    }

    // Update player source when src changes
    if (playerRef.current && src) {
      playerRef.current.src({
        src: src,
        type: "application/x-mpegURL", // HLS format
      });
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster]);

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div data-vjs-player>
          <div ref={videoRef} className="w-full aspect-video" />
        </div>
      </CardContent>
    </Card>
  );
}
