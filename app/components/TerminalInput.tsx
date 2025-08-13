"use client";

import { useState, useRef } from "react";
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

  // Old caretIndex logic removed; contentEditable caret is used
  const editableRef = useRef<HTMLSpanElement>(null);

  /** Current position in command history (-1 means not browsing history) */
  const [historyIndex, setHistoryIndex] = useState(-1);

  // focus tracking not used

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

  // legacy input ref removed

  // ========================================
  // EFFECTS
  // ========================================

  // Removed auto-focus; focusing is handled by container clicks to avoid scroll quirks

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
      const nextVal = words.join(" ");
      setInput(nextVal);
      if (editableRef.current) {
        editableRef.current.innerText = nextVal;
        placeCaretAtEnd(editableRef.current);
      }
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
        const nextVal = words.join(" ");
        setInput(nextVal);
        if (editableRef.current) {
          editableRef.current.innerText = nextVal;
          placeCaretAtEnd(editableRef.current);
        }
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
      const nextVal = words.join(" ");
      setInput(nextVal);
      if (editableRef.current) {
        editableRef.current.innerText = nextVal;
        placeCaretAtEnd(editableRef.current);
      }
      setTabCompletionState(null); // Clear tab completion state
    } else if (matches.length > 1) {
      // Multiple matches - start cycling
      words[words.length - 1] = matches[0];
      const nextVal = words.join(" ");
      setInput(nextVal);
      if (editableRef.current) {
        editableRef.current.innerText = nextVal;
        placeCaretAtEnd(editableRef.current);
      }
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

  // submission handled in handleKeyDown

  /**
   * Handles keyboard events for command history navigation and tab completion
   *
   * Arrow Up: Navigate to previous commands in history
   * Arrow Down: Navigate to more recent commands in history
   * Tab: Complete file names
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // typing or navigation other than Tab cancels ongoing tab-cycling
    if (e.key !== "Tab") {
      setTabCompletionState(null);
    }
    // Enter submits; Shift+Enter creates a newline (default behavior in textarea)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onExecute(input.trim());
        setInput("");
        if (editableRef.current) editableRef.current.innerText = "";
        setHistoryIndex(-1);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      // Navigate to previous command in history
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        // Display the command from history (most recent first)
        const val = history[history.length - 1 - newIndex];
        setInput(val);
        if (editableRef.current) {
          editableRef.current.innerText = val;
          placeCaretAtEnd(editableRef.current);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        // Navigate to more recent command in history
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const val = history[history.length - 1 - newIndex];
        setInput(val);
        if (editableRef.current) {
          editableRef.current.innerText = val;
          placeCaretAtEnd(editableRef.current);
        }
      } else if (historyIndex === 0) {
        // Return to current input (not browsing history)
        setHistoryIndex(-1);
        setInput("");
        if (editableRef.current) editableRef.current.innerText = "";
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
  const placeCaretAtEnd = (el: HTMLElement) => {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {}
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!editableRef.current) return;
    const target = e.target as Node;
    const clickedInside = editableRef.current.contains(target);
    editableRef.current.focus();
    if (!clickedInside) {
      placeCaretAtEnd(editableRef.current);
    }
  };

  /**
   * Handles key press events on the hidden input field
   * Allows submission via Enter key
   */
  // Removed keyPress handler; handled via keyDown for Enter/Shift+Enter

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
        $
        <span contentEditable={false} aria-hidden="true">
          {" "}
        </span>
        <span
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onInput={(e) => {
            const text = (e.currentTarget.textContent || "").replace(
              /\u00A0/g,
              " "
            );
            setInput(text);
            setTabCompletionState(null);
            // caret naturally handled by contentEditable
          }}
          onKeyDown={handleKeyDown}
          style={{ outline: "none", whiteSpace: "pre-wrap" }}
        />
        {/* Remove legacy blinking cursor; rely on native caret */}
      </span>

      {/* Hidden input removed */}
    </div>
  );
}
