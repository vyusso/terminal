"use client";

import { useState } from "react";

/**
 * Props for the PasswordScreen component
 */
interface PasswordScreenProps {
  /** Callback function when password is correct */
  onPasswordCorrect: () => void;
}

/**
 * PasswordScreen Component
 *
 * CLI-style password authentication screen.
 * Always shown first before nickname setup.
 *
 * Features:
 * - Terminal-style interface with prompt and cursor
 * - Real-time typing display in command line
 * - Hidden input field for capturing keystrokes
 * - Click-to-refocus functionality
 * - Password validation
 * - Error handling and loading states
 */
export default function PasswordScreen({
  onPasswordCorrect,
}: PasswordScreenProps) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  /** Current password input value */
  const [password, setPassword] = useState("");

  /** Validation error message */
  const [error, setError] = useState("");

  /** Loading state during password verification */
  const [isLoading, setIsLoading] = useState(false);

  /** Whether the input field is currently focused */
  const [isFocused, setIsFocused] = useState(false);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handles password submission and validation
   * Verifies password and proceeds to next screen
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const trimmedPassword = password.trim();

    // Simple password validation
    if (trimmedPassword === "qwerty") {
      // Simulate API call delay
      setTimeout(() => {
        setIsLoading(false);
        onPasswordCorrect();
      }, 500);
    } else {
      // Simulate API call delay for error
      setTimeout(() => {
        setError("Incorrect password. Please try again.");
        setIsLoading(false);
        setPassword("");
      }, 500);
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
      'input[type="password"]'
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      setIsFocused(true);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="terminal-container" onClick={handleContainerClick}>
      {/* Main terminal line with prompt and command */}
      <div className="terminal-line">
        {/* Command line showing the password input with cursor */}
        <span className="command">
          Enter password: {password.replace(/./g, "*")}
          {isFocused && <span className="cursor">|</span>}
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
          <span className="output">Verifying password...</span>
        </div>
      )}

      {/* Hidden input field for capturing keystrokes */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
