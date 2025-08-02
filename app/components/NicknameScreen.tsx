"use client";

import { useState } from "react";

interface NicknameScreenProps {
  onNicknameSet: (nickname: string) => void;
}

/**
 * NicknameScreen Component
 *
 * CLI-style screen for setting nickname.
 * Only shown if no nickname exists in localStorage.
 *
 * Features:
 * - Terminal-style interface with prompt and cursor
 * - Real-time typing display in command line
 * - Hidden input field for capturing keystrokes
 * - Click-to-refocus functionality
 * - Nickname validation (2-20 characters)
 * - Local storage and API persistence
 * - Error handling and loading states
 */
export default function NicknameScreen({ onNicknameSet }: NicknameScreenProps) {
  // State for nickname input value
  const [nickname, setNickname] = useState("");

  // State for displaying validation errors
  const [error, setError] = useState("");

  // State for showing loading/saving status
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles nickname submission and validation
   * Saves to localStorage and API, then proceeds to terminal
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const trimmedNickname = nickname.trim();

    // Validate nickname length (minimum 2 characters)
    if (trimmedNickname.length < 2) {
      setError("Nickname must be at least 2 characters");
      setIsLoading(false);
      return;
    }

    // Validate nickname length (maximum 20 characters)
    if (trimmedNickname.length > 20) {
      setError("Nickname must be less than 20 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Save to API first (this will check for duplicates)
      const response = await fetch("/api/save-nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: trimmedNickname }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save nickname to localStorage for persistence
        localStorage.setItem("terminal_nickname", trimmedNickname);

        // Proceed to terminal with the new nickname
        onNicknameSet(trimmedNickname);
      } else {
        // Handle API errors (like duplicate nickname)
        if (response.status === 409) {
          setError("Nickname already taken, please choose another one");
        } else {
          setError("Failed to save nickname. Please try again.");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to save nickname:", error);
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  /**
   * Handles key press events on the hidden input field
   * Allows submission via Enter key
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as React.FormEvent);
    }
  };

  /**
   * Refocuses the hidden input field when clicking anywhere in the terminal
   * This mimics real terminal behavior where clicking anywhere brings back focus
   */
  const handleContainerClick = () => {
    // Find and refocus the hidden input field
    const input = document.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    if (input) {
      input.focus();
    }
  };

  return (
    <div className="terminal-container" onClick={handleContainerClick}>
      {/* Main terminal line with prompt and command */}
      <div className="terminal-line">
        {/* Terminal prompt (system@terminal:~$) */}
        <span className="prompt">
          <span className="username">system</span>@terminal:~$
        </span>

        {/* Command line showing the nickname input with cursor */}
        <span className="command">
          Enter a nickname: {nickname}
          <span className="cursor">|</span>
        </span>
      </div>

      {/* Error message displayed as terminal output */}
      {error && (
        <div className="terminal-line">
          <span className="output error">{error}</span>
        </div>
      )}

      {/* Loading message displayed as terminal output */}
      {isLoading && (
        <div className="terminal-line">
          <span className="output">Setting nickname...</span>
        </div>
      )}

      {/* Hidden input field for capturing keystrokes */}
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyPress={handleKeyPress}
        autoFocus
        disabled={isLoading}
        style={{
          position: "absolute",
          top: "0",
          left: "-9999px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
