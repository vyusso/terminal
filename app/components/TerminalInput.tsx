"use client";

import { useState, useRef, useEffect } from "react";
import { getNodeAtPath } from "../utils/fileSystem";
import { FileSystemNode } from "../types/terminal";

/**
 * Props for the TerminalInput component
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
  /** File system for tab completion */
  fileSystem: FileSystemNode;
}

/**
 * TerminalInput Component
 *
 * Renders the command input line with prompt and handles:
 * - Command input and submission
 * - Command history navigation (up/down arrow keys)
 * - Auto-focus on mount
 * - Focus state management for cursor display
 * - Tab completion for file names
 *
 * The component displays a prompt showing the current user and directory,
 * followed by an input field where users can type commands.
 */
export default function TerminalInput({
  onExecute,
  history,
  currentDirectory,
  nickname,
  fileSystem,
}: TerminalInputProps) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  /** Current input value in the command field */
  const [input, setInput] = useState("");

  /** Current position in command history (-1 means not browsing history) */
  const [historyIndex, setHistoryIndex] = useState(-1);

  /** Whether the input field is currently focused */
  const [isFocused, setIsFocused] = useState(false);

  /** Current tab completion state */
  const [tabCompletionState, setTabCompletionState] = useState<{
    matches: string[];
    currentIndex: number;
    originalPartial: string;
    isCycling: boolean;
  } | null>(null);

  // ========================================
  // REFERENCES
  // ========================================

  /** Reference to the input element for auto-focus */
  const inputRef = useRef<HTMLInputElement>(null);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Auto-focus the input field when component mounts
   * This ensures users can start typing immediately
   */
  useEffect(() => {
    inputRef.current?.focus();
    setIsFocused(true);
  }, []);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Gets all files and directories in the current directory
   * Used for tab completion
   */
  const getCurrentDirectoryContents = (): string[] => {
    // Get the current directory node from the file system
    const currentDir = getNodeAtPath(fileSystem, currentDirectory);
    if (!currentDir || currentDir.type !== "directory") {
      return [];
    }

    return (currentDir.children || []).map(
      (child: FileSystemNode) => child.name
    );
  };

  /**
   * Gets only directories in the current directory
   * Used for cd command tab completion
   */
  const getCurrentDirectories = (): string[] => {
    const currentDir = getNodeAtPath(fileSystem, currentDirectory);
    if (!currentDir || currentDir.type !== "directory") {
      return [];
    }

    return (currentDir.children || [])
      .filter((child: FileSystemNode) => child.type === "directory")
      .map((child: FileSystemNode) => child.name);
  };

  /**
   * Gets only files in the current directory
   * Used for open command tab completion
   */
  const getCurrentFiles = (): string[] => {
    const currentDir = getNodeAtPath(fileSystem, currentDirectory);
    if (!currentDir || currentDir.type !== "directory") {
      return [];
    }

    return (currentDir.children || [])
      .filter((child: FileSystemNode) => child.type === "file")
      .map((child: FileSystemNode) => child.name);
  };

  /**
   * Handles tab completion
   * Finds matching files and cycles through them
   */
  const handleTabCompletion = () => {
    const words = input.split(" ");
    const currentWord = words[words.length - 1];
    const command = words[0]?.toLowerCase();

    // If we're already cycling and the current word matches our original partial
    if (tabCompletionState && tabCompletionState.isCycling) {
      const nextIndex =
        (tabCompletionState.currentIndex + 1) %
        tabCompletionState.matches.length;
      words[words.length - 1] = tabCompletionState.matches[nextIndex];
      setInput(words.join(" "));
      setTabCompletionState({
        ...tabCompletionState,
        currentIndex: nextIndex,
      });
      return;
    }

    // Determine which list to use based on the command
    let availableItems: string[] = [];
    if (command === "cd") {
      availableItems = getCurrentDirectories();
    } else if (command === "open") {
      availableItems = getCurrentFiles();
    } else {
      // For other commands, use all contents
      availableItems = getCurrentDirectoryContents();
    }

    // If current word is empty, cycle through appropriate items
    if (!currentWord || currentWord.length === 0) {
      if (availableItems.length > 0) {
        words[words.length - 1] = availableItems[0];
        setInput(words.join(" "));
        setTabCompletionState({
          matches: availableItems,
          currentIndex: 0,
          originalPartial: "",
          isCycling: true,
        });
      }
      return;
    }

    // If current word has content, find matches from appropriate list
    const matches = availableItems.filter((name) =>
      name.startsWith(currentWord)
    );

    if (matches.length === 1) {
      // Single match - complete it
      words[words.length - 1] = matches[0];
      setInput(words.join(" "));
      setTabCompletionState(null); // Clear tab completion state
    } else if (matches.length > 1) {
      // Multiple matches - start cycling
      words[words.length - 1] = matches[0];
      setInput(words.join(" "));
      setTabCompletionState({
        matches,
        currentIndex: 0,
        originalPartial: currentWord,
        isCycling: true,
      });
    } else {
      // No matches - clear tab completion state
      setTabCompletionState(null);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handles form submission when user presses Enter
   * Executes the command and clears the input field
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
   * Handles keyboard events for command history navigation and tab completion
   *
   * Arrow Up: Navigate to previous commands in history
   * Arrow Down: Navigate to more recent commands in history
   * Tab: Complete file names
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
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleTabCompletion();
    }
  };

  /**
   * Refocuses the hidden input field when clicking anywhere in the terminal line
   * This mimics real terminal behavior where clicking anywhere brings back focus
   */
  const handleContainerClick = () => {
    if (inputRef.current) {
      // Prevent any scroll behavior when focusing
      const originalScrollIntoView = inputRef.current.scrollIntoView;
      inputRef.current.scrollIntoView = () => {};
      inputRef.current.focus();
      setIsFocused(true);
      // Restore the original method after focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView = originalScrollIntoView;
        }
      }, 0);
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

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className="terminal-line"
      suppressHydrationWarning={true}
      onClick={handleContainerClick}
    >
      {/* Command line showing the prompt and input with cursor */}
      <span className="command">
        <span className="username">{nickname}</span>@terminal:{currentDirectory}
        $ {input}
        {isFocused && <span className="cursor">|</span>}
      </span>

      {/* Hidden input field for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          // Clear tab completion state when user types something different
          if (tabCompletionState && tabCompletionState.isCycling) {
            const words = e.target.value.split(" ");
            const currentWord = words[words.length - 1];
            // If user types something that's not in our cycling list, stop cycling
            if (!tabCompletionState.matches.includes(currentWord)) {
              setTabCompletionState(null);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: "fixed",
          top: "-1000px",
          left: "-1000px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </div>
  );
}
