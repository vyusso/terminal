"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import AsciiArt from "./components/AsciiArt";
import PasswordScreen from "./components/PasswordScreen";
import NicknameScreen from "./components/NicknameScreen";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo } from "react";

// ========================================
// DYNAMIC IMPORTS (No SSR to prevent hydration issues)
// ========================================

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
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  /** User's nickname (null if not set) */
  const [nickname, setNickname] = useState<string | null>(null);

  /** Password authentication status */
  const [passwordCorrect, setPasswordCorrect] = useState(false);

  // ========================================
  // HOOKS & REFERENCES
  // ========================================

  /** Get all terminal functionality from the custom hook */
  const { lines, currentDirectory, executeCommand, history, fileSystem } =
    useTerminal(nickname || "user");

  /** Reference to the terminal container for auto-scrolling */
  const terminalRef = useRef<HTMLDivElement>(null);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Auto-scroll to keep terminal at bottom when new output is added
   * Only scroll when there are new output lines, not when user is typing
   */
  useEffect(() => {
    if (terminalRef.current && lines.length > 0) {
      // Check if any of the recent lines are output or error
      const recentLines = lines.slice(-3); // Check last 3 lines
      const hasNewOutput = recentLines.some(
        (line) => line.type === "output" || line.type === "error"
      );

      if (hasNewOutput) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
        });
      }
    }
  }, [lines]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handles successful password authentication
   * Checks for existing nickname and proceeds accordingly
   */
  const handlePasswordCorrect = async () => {
    setPasswordCorrect(true);

    try {
      // First check localStorage for immediate access
      const savedNickname = localStorage.getItem("terminal_nickname");
      if (savedNickname) {
        setNickname(savedNickname);
        return;
      }

      // If no localStorage, check database by IP
      const response = await fetch("/api/get-nickname");
      const data = await response.json();

      if (data.success && data.exists && data.nickname) {
        // User has existing nickname in database - save to localStorage and proceed
        localStorage.setItem("terminal_nickname", data.nickname);
        setNickname(data.nickname);
      }
      // If no nickname exists, the component will show the nickname screen
    } catch (error) {
      console.error("Error checking nickname:", error);
      // Fallback to showing nickname screen
    }
  };

  /**
   * Handles nickname setup completion
   * Proceeds to the main terminal with the new nickname
   */
  const handleNicknameSet = (newNickname: string) => {
    setNickname(newNickname);
  };

  // ========================================
  // MEMOIZED COMPONENTS
  // ========================================

  /** Memoize the TerminalInput component to prevent unnecessary re-renders */
  const memoizedTerminalInput = useMemo(() => {
    if (!nickname) return null;
    return (
      <TerminalInput
        onExecute={executeCommand}
        history={history}
        currentDirectory={currentDirectory}
        nickname={nickname}
        fileSystem={fileSystem}
      />
    );
  }, [executeCommand, history, currentDirectory, nickname, fileSystem]);

  // ========================================
  // RENDER LOGIC
  // ========================================

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
        onClick={() => {
          // Focus the hidden input when clicking anywhere in the terminal
          const input = document.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }}
      >
        {/* ASCII Art at the top */}
        <AsciiArt />

        {/* Render all terminal lines (commands, outputs, errors) */}
        {lines.map((line, index) => (
          <TerminalLine
            key={`${line.timestamp}-${index}`}
            line={line}
            nickname={nickname!}
          />
        ))}

        {/* Command input component at the bottom */}
        {memoizedTerminalInput}
      </div>
    </>
  );
}
