"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import AsciiArt from "./components/AsciiArt";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

// Dynamically import Clock component with no SSR to prevent hydration issues
const Clock = dynamic(() => import("./components/Clock"), {
  ssr: false,
  loading: () => (
    <div className="clock">
      <div className="clock-time">--:--:--</div>
      <div className="clock-date">-- -- --</div>
    </div>
  ),
});

// Dynamically import AudioPlayer component with no SSR to prevent hydration issues
const AudioPlayer = dynamic(() => import("./components/AudioPlayer"), {
  ssr: false,
  loading: () => null, // No loading state for audio player
});

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
    <>
      {/* Clock component in top right */}
      <Clock />

      {/* Audio player component */}
      <AudioPlayer />

      <div
        ref={terminalRef}
        className="terminal-container"
        suppressHydrationWarning={true}
      >
        {/* ASCII Art at the top */}
        <AsciiArt />

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
    </>
  );
}
