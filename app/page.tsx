"use client";

import { useTerminal } from "./hooks/useTerminal";
import TerminalLine from "./components/TerminalLine";
import TerminalInput from "./components/TerminalInput";
import { useEffect, useRef } from "react";

export default function Home() {
  const { lines, currentDirectory, currentPrompt, executeCommand, history } =
    useTerminal();

  const terminalRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever lines change
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
      {lines.map((line, index) => (
        <TerminalLine
          key={`${line.timestamp}-${index}`}
          line={line}
          currentDirectory={currentDirectory}
        />
      ))}
      <TerminalInput
        onExecute={executeCommand}
        history={history}
        currentPrompt={currentPrompt}
        currentDirectory={currentDirectory}
      />
    </div>
  );
}
