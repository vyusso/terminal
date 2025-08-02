"use client";

import { useState, useRef, useEffect } from "react";

interface TerminalInputProps {
  onExecute: (command: string) => void;
  history: string[];
  currentPrompt: string;
  currentDirectory: string;
}

export default function TerminalInput({
  onExecute,
  history,
  currentPrompt,
  currentDirectory,
}: TerminalInputProps) {
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onExecute(input.trim());
      setInput("");
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="terminal-line" suppressHydrationWarning={true}>
      <span className="prompt">
        <span className="username">angel</span>@terminal:{currentDirectory}$
      </span>
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
