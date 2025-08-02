"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import { useEffect, useRef } from "react";

/**
 * Main Terminal Page Component
 *
 * This is the root component that renders the entire terminal interface.
 * It manages the terminal state using the useTerminal hook and handles
 * the display of all terminal lines and the input component.
 *
 * Features:
 * - Displays all terminal output lines
 * - Shows the command input at the bottom
 * - Auto-scrolls to the bottom when new content is added
 * - Provides a complete terminal experience
 */
export default function Home() {
  // Get all terminal functionality from the custom hook
  const { lines, currentDirectory, currentPrompt, executeCommand, history } =
    useTerminal();

  // Reference to the terminal container for auto-scrolling
  const terminalRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to the bottom whenever new lines are added
   * This ensures users always see the latest output
   */
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={terminalRef}
      className="terminal-container"
      suppressHydrationWarning={true}
    >
      {/* Render all terminal lines (commands, outputs, errors) */}
      {lines.map((line, index) => (
        <TerminalLine
          key={`${line.timestamp}-${index}`}
          line={line}
          currentDirectory={currentDirectory}
        />
      ))}

      {/* Command input component at the bottom */}
      <TerminalInput
        onExecute={executeCommand}
        history={history}
        currentPrompt={currentPrompt}
        currentDirectory={currentDirectory}
      />
    </div>
  );
}
