"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import AsciiArt from "./components/AsciiArt";
import ChessWindow from "./components/ChessWindow";
import PasswordScreen from "./components/PasswordScreen";
import NicknameScreen from "./components/NicknameScreen";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { getOrCreateDeviceId } from "./utils/device";

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

  /** CRT effect state */
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Apply CRT effect to body element
  useEffect(() => {
    if (crtEnabled) {
      document.body.classList.add("crt-enabled");
    } else {
      document.body.classList.remove("crt-enabled");
    }
  }, [crtEnabled]);

  // Apply bootup animation to body when on terminal page
  useEffect(() => {
    // Only add bootup animation when we're on the terminal page (after password and nickname)
    if (passwordCorrect && nickname) {
      // Ensure CRT effect is enabled first
      document.body.classList.add("crt-enabled");
      // Then add boot animation
      document.body.classList.add("crt-boot");

      // Remove the crt-boot class after animation completes (4 seconds total)
      const timer = setTimeout(() => {
        document.body.classList.remove("crt-boot");
      }, 4000);

      // Cleanup timer if component unmounts
      return () => {
        clearTimeout(timer);
        document.body.classList.remove("crt-boot");
      };
    }
  }, [passwordCorrect, nickname]);

  // ========================================
  // HOOKS & REFERENCES
  // ========================================

  /** Get all terminal functionality from the custom hook */
  const { lines, currentDirectory, executeCommand, history, fileSystem } =
    useTerminal(nickname || "user");

  // Chess window state
  const [isChessOpen, setIsChessOpen] = useState(false);

  // Ensure window toggles immediately on command
  const handleExecute = useCallback(
    (cmd: string) => {
      const name = cmd.trim().split(" ")[0];
      if (name === "chess") setIsChessOpen(true);
      executeCommand(cmd);
    },
    [executeCommand]
  );

  /** Reference to the terminal container for auto-scrolling */
  const terminalRef = useRef<HTMLDivElement>(null);

  // ========================================
  // Open Chess window only when the latest line is the chess command/output
  useEffect(() => {
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    const isChessCmd =
      last.type === "command" && last.content.trim().split(" ")[0] === "chess";
    const isChessOutput =
      last.type === "output" && last.content.includes("chess.exe running");
    if (isChessCmd || isChessOutput) {
      setIsChessOpen(true);
    }
  }, [lines]);
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
      const response = await fetch("/api/get-nickname", {
        headers: {
          "x-device-id": getOrCreateDeviceId(),
        },
      });
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
        onExecute={handleExecute}
        history={history}
        currentDirectory={currentDirectory}
        nickname={nickname}
        fileSystem={fileSystem}
      />
    );
  }, [handleExecute, history, currentDirectory, nickname, fileSystem]);

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
      {isChessOpen && <ChessWindow onClose={() => setIsChessOpen(false)} />}
      {/* Scan lines overlay - always on top */}
      {crtEnabled && <div className="scanlines-overlay"></div>}

      {/* Clock component in top right */}
      <Clock />

      {/* Audio player component in bottom right */}
      <AudioPlayer
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
      />

      {/* Main terminal container */}
      <div
        ref={terminalRef}
        className="terminal-container"
        suppressHydrationWarning={true}
        onClick={() => {
          // Focus the visible contentEditable input when clicking padding/anywhere
          const el = document.querySelector(
            '.terminal-line .command [contenteditable=""]'
          ) as HTMLElement | null;
          el?.focus();
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
