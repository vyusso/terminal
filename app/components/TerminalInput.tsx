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
  /** Current directory name to display in the prompt */
  currentPrompt: string;
  /** Full current directory path */
  currentDirectory: string;
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
  currentPrompt,
  currentDirectory,
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

  return (
    <div className="terminal-line" suppressHydrationWarning={true}>
      {/* Command prompt showing user and current directory */}
      <span className="prompt">
        <span className="username">angel</span>@terminal:{currentDirectory}$
      </span>

      {/* Command input form */}
      <form onSubmit={handleSubmit} className="flex-1 flex">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="command flex-1 bg-transparent outline-none border-none"
          autoFocus
        />
      </form>
    </div>
  );
}
