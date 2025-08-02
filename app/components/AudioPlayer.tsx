"use client";

import { useState, useEffect, useRef } from "react";

/**
 * AudioPlayer Component
 *
 * Handles background music with autoplay and mute functionality
 * Shows a mute/unmute button in the bottom left corner
 */
export default function AudioPlayer() {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up audio properties
    audio.loop = true;
    audio.volume = 0.3; // Start at 30% volume

    // Add error handling for audio loading
    audio.addEventListener("error", (e) => {
      console.log("Audio loading error:", e);
    });

    audio.addEventListener("loadeddata", () => {
      console.log("Audio file loaded successfully");
    });

    // Handle autoplay (may be blocked by browser)
    const playAudio = async () => {
      try {
        console.log("Attempting to play audio...");
        await audio.play();
        setIsPlaying(true);
        console.log("Audio started successfully!");
      } catch (error) {
        console.log("Audio error:", error);
        console.log("Autoplay blocked by browser or audio file not found");
        setIsPlaying(false);
      }
    };

    playAudio();

    // Event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const manualPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio
      .play()
      .then(() => {
        console.log("Manual play successful");
        setIsPlaying(true);
      })
      .catch((error) => {
        console.log("Manual play failed:", error);
      });
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
        <source src="/audio/background-music.ogg" type="audio/ogg" />
        <source src="/audio/background-music.wav" type="audio/wav" />
      </audio>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="audio-control"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {/* Debug: Manual play button (temporary) */}
      <button
        onClick={manualPlay}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "60px",
          background: "transparent",
          border: "1px solid #ff6b35",
          color: "#ff6b35",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px",
          zIndex: 1000,
        }}
        title="Manual Play (Debug)"
      >
        PLAY
      </button>
    </>
  );
}
