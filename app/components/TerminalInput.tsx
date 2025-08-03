"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Props for the TerminalInput component
 * Contains all the data and callbacks needed for input functionality
 */
interface TerminalInputProps {
  /** Callback function to execute when a command is submitted */
  onExecute: (command: string) => void;
  /** Array of previously executed commands for history navigation */
  history: string[];
  /** Full current directory path */
  currentDirectory: string;
  /** User's nickname */
  nickname: string;
}

/**
 * TerminalInput Component
 *
 * Renders the command input line with prompt and handles:
 * - Command input and submission
 * - Command history navigation (up/down arrow keys)
 * - Auto-focus on mount
 *
 * The component displays a prompt showing the current user and directory,
 * followed by an input field where users can type commands.
 */
export default function TerminalInput({
  onExecute,
  history,
  currentDirectory,
  nickname,
}: TerminalInputProps) {
  /** Current input value in the command field */
  const [input, setInput] = useState("");

  /** Current position in command history (-1 means not browsing history) */
  const [historyIndex, setHistoryIndex] = useState(-1);

  /** Reference to the input element for auto-focus */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles form submission when user presses Enter
   * Executes the command and clears the input field
   *
   * @param e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onExecute(input.trim()); // Execute the command
      setInput(""); // Clear input field
      setHistoryIndex(-1); // Reset history navigation
    }
  };

  /**
   * Handles keyboard events for command history navigation
   *
   * Arrow Up: Navigate to previous commands in history
   * Arrow Down: Navigate to more recent commands in history
   *
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      // Navigate to previous command in history
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        // Display the command from history (most recent first)
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        // Navigate to more recent command in history
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        // Return to current input (not browsing history)
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  /**
   * Auto-focus the input field when component mounts
   * This ensures users can start typing immediately
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Refocuses the hidden input field when clicking anywhere in the terminal line
   * This mimics real terminal behavior where clicking anywhere brings back focus
   */
  const handleContainerClick = () => {
    inputRef.current?.focus();
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

  return (
    <div
      className="terminal-line"
      suppressHydrationWarning={true}
      onClick={handleContainerClick}
    >
      {/* Command prompt showing user and directory */}
      <span className="prompt">
        <span className="username">{nickname}</span>@terminal:{currentDirectory}
        $
      </span>
      {/* The actual command input with cursor */}
      <span className="command">
        {input}
        <span className="cursor">|</span>
      </span>

      {/* Hidden input field for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        autoFocus
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
