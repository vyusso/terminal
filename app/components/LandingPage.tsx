"use client";

import { useState, useEffect } from "react";

/**
 * LandingPage Component
 *
 * Displays a landing page where users can set their nickname
 * Uses the same terminal styling as the main app
 * Saves nickname by IP address for persistence
 */
interface LandingPageProps {
  onNicknameSet: (nickname: string) => void;
}

export default function LandingPage({ onNicknameSet }: LandingPageProps) {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user already has a nickname saved
    const savedNickname = localStorage.getItem("terminal_nickname");
    if (savedNickname) {
      onNicknameSet(savedNickname);
    } else {
      setIsLoading(false);
    }
  }, [onNicknameSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError("Nickname must be between 2 and 20 characters");
      return;
    }

    if (nickname.includes(" ")) {
      setError("Nickname cannot contain spaces");
      return;
    }

    // Save nickname locally
    localStorage.setItem("terminal_nickname", nickname.trim());

    // Save nickname by IP (for future database integration)
    try {
      await fetch("/api/save-nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
    } catch {
      console.log("Failed to save nickname to server, but saved locally");
    }

    // Proceed to terminal
    onNicknameSet(nickname.trim());
  };

  if (isLoading) {
    return (
      <div className="landing-page">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-title">Terminal</div>

        <form onSubmit={handleSubmit} className="nickname-form">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="set nickname"
            className="nickname-input"
            autoFocus
            maxLength={20}
          />

          {error && <div className="error-message">{error}</div>}

          {/* <div className="help-text">Press Enter</div> */}
        </form>
      </div>

      <div className="landing-footer">
        by:{" "}
        <a
          href="https://github.com/vyusso"
          target="_blank"
          rel="noopener noreferrer"
        >
          vyusso
        </a>
      </div>
    </div>
  );
}
