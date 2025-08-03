"use client";

import { useState, useEffect, useRef } from "react";

/**
 * AudioPlayer Component
 *
 * Handles background music with autoplay and play/pause functionality.
 * Shows a play/pause button in the bottom-right corner.
 *
 * Features:
 * - Autoplay on component mount (may be blocked by browser)
 * - Manual play/pause toggle
 * - Loop functionality
 * - Volume control (30% default)
 * - Multiple audio format support
 */
export default function AudioPlayer() {
  // Track if audio is currently playing
  const [isPlaying, setIsPlaying] = useState(false);
  // Track if CRT effect is enabled
  const [crtEnabled, setCrtEnabled] = useState(false);
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

  /**
   * Toggles between play and pause states
   * Handles both starting audio (if never played) and pausing/resuming
   */
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.log("Play failed:", error);
        });
    }
  };

  /**
   * Toggles the CRT effect on/off
   */
  const toggleCrt = () => {
    setCrtEnabled(!crtEnabled);
    // Toggle CRT effect by adding/removing CSS class
    document.body.classList.toggle("crt-enabled");
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
        <source src="/audio/background-music.ogg" type="audio/ogg" />
        <source src="/audio/background-music.wav" type="audio/wav" />
      </audio>

      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className="audio-control"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* CRT Toggle button */}
      <button
        onClick={toggleCrt}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "140px",
          background: "transparent",
          border: "1px solid #ff6b35",
          color: "#ff6b35",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px",
          zIndex: 1000,
        }}
        title={crtEnabled ? "Disable CRT Effect" : "Enable CRT Effect"}
      >
        {crtEnabled ? "CRT OFF" : "CRT ON"}
      </button>

      {/* Debug: Logout button (temporary) */}
      <button
        onClick={() => {
          localStorage.removeItem("terminal_nickname");
          window.location.reload();
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "55px",
          background: "transparent",
          border: "1px solid #ff6b35",
          color: "#ff6b35",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px",
          zIndex: 1000,
        }}
        title="Logout (Debug)"
      >
        LOGOUT
      </button>
    </>
  );
}
