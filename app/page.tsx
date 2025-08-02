"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import AsciiArt from "./components/AsciiArt";
import PasswordScreen from "./components/PasswordScreen";
import NicknameScreen from "./components/NicknameScreen";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Dynamically import Clock component with no SSR to prevent hydration issues
const Clock = dynamic(() => import("./components/Clock"), {
  ssr: false,
  loading: () => (
    <div className="clock" suppressHydrationWarning={true}>
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
 * Orchestrates the entire terminal application flow:
 * 1. Password Screen (always first)
 * 2. Nickname Screen (if no nickname exists)
 * 3. Main Terminal (after authentication and nickname setup)
 *
 * Features:
 * - Multi-step authentication flow
 * - Dynamic nickname-based terminal
 * - Real-time clock and audio controls
 * - ASCII art display
 * - Auto-scrolling terminal output
 * - Persistent user sessions
 */
export default function Home() {
  // State for user's nickname (null if not set)
  const [nickname, setNickname] = useState<string | null>(null);

  // State for loading/initialization status
  const [isLoading, setIsLoading] = useState(true);

  // State for password authentication status
  const [passwordCorrect, setPasswordCorrect] = useState(false);

  // Get all terminal functionality from the custom hook
  const { lines, currentDirectory, currentPrompt, executeCommand, history } =
    useTerminal(nickname || "user");

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

  /**
   * Handles successful password authentication
   * Checks for existing nickname and proceeds accordingly
   */
  const handlePasswordCorrect = () => {
    setPasswordCorrect(true);

    // Check if user already has a nickname saved
    const savedNickname = localStorage.getItem("terminal_nickname");
    if (savedNickname) {
      // User has existing nickname - go straight to terminal
      setNickname(savedNickname);
      setIsLoading(false);
    }
    // If no nickname exists, the nickname screen will be shown
  };

  /**
   * Handles nickname setup completion
   * Proceeds to the main terminal with the new nickname
   */
  const handleNicknameSet = (newNickname: string) => {
    setNickname(newNickname);
    setIsLoading(false);
  };

  // Step 1: Show password screen first (always required)
  if (!passwordCorrect) {
    return <PasswordScreen onPasswordCorrect={handlePasswordCorrect} />;
  }

  // Step 2: Show nickname screen if password is correct but no nickname exists
  if (passwordCorrect && !nickname) {
    return <NicknameScreen onNicknameSet={handleNicknameSet} />;
  }

  // Step 3: Show main terminal (after password and nickname are set)
  return (
    <>
      {/* Clock component in top right */}
      <Clock />

      {/* Audio player component in bottom right */}
      <AudioPlayer />

      {/* Main terminal container */}
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
            nickname={nickname!}
          />
        ))}

        {/* Command input component at the bottom */}
        <TerminalInput
          onExecute={executeCommand}
          history={history}
          currentPrompt={currentPrompt}
          currentDirectory={currentDirectory}
          nickname={nickname!}
        />
      </div>
    </>
  );
}
