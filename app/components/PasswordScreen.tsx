"use client";

import { useState } from "react";

interface PasswordScreenProps {
  onPasswordCorrect: () => void;
}

/**
 * PasswordScreen Component
 *
 * First screen users see when loading the app.
 * Requires correct password to proceed to the next step.
 *
 * Features:
 * - Password validation (hardcoded to "qwerty")
 * - Error handling for incorrect passwords
 * - Loading state during authentication
 * - Auto-focus on input field
 * - Enter key submission
 */
export default function PasswordScreen({
  onPasswordCorrect,
}: PasswordScreenProps) {
  // State for password input value
  const [password, setPassword] = useState("");

  // State for displaying error messages
  const [error, setError] = useState("");

  // State for showing loading/authenticating status
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles form submission when user presses Enter
   * Validates password and triggers appropriate callbacks
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a brief delay for better UX (feels more realistic)
    setTimeout(() => {
      if (password === "qwerty") {
        // Password is correct - proceed to next step
        onPasswordCorrect();
      } else {
        // Password is incorrect - show error and clear input
        setError("Incorrect password");
        setPassword("");
      }
      setIsLoading(false);
    }, 300);
  };

  /**
   * Handles key press events on the password input
   * Allows submission via Enter key
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as React.FormEvent);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Terminal title */}
        <h1 className="landing-title">TERMINAL</h1>

        {/* Password input form */}
        <form onSubmit={handleSubmit} className="password-form">
          {/* Password prompt with input field */}
          <div className="password-prompt">
            <span className="prompt-text">Enter password:</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="password-input"
              placeholder=""
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Error message display */}
          {error && (
            <div
              className="error-message"
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "300px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Loading state display */}
          {isLoading && (
            <div
              className="loading-text"
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "300px",
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              Authenticating...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
