import { TerminalLine as TerminalLineType } from "../types/terminal";

/**
 * Props for the TerminalLine component
 */
interface TerminalLineProps {
  /** The terminal line data to render */
  line: TerminalLineType;
  /** User's nickname */
  nickname: string;
}

/**
 * TerminalLine Component
 *
 * Renders individual lines in the terminal output.
 * Handles three different types of lines:
 * - command: User input commands with prompt
 * - output: Command output/results
 * - error: Error messages (displayed in red)
 *
 * Each line type is styled differently to provide visual distinction
 * between user input, program output, and error messages.
 */
export default function TerminalLine({ line, nickname }: TerminalLineProps) {
  // ========================================
  // RENDER LOGIC
  // ========================================

  // Render command lines with prompt
  if (line.type === "command") {
    return (
      <div className="terminal-line" suppressHydrationWarning={true}>
        {/* Command line showing the prompt and command */}
        <span className="command">
          <span className="username">{nickname}</span>@terminal:
          {line.directory || "~"}$ {line.content}
        </span>
      </div>
    );
  }

  // Render error messages in red
  if (line.type === "error") {
    return (
      <div className="terminal-line" suppressHydrationWarning={true}>
        <span className="output" style={{ color: "#ff6b6b" }}>
          {line.content}
        </span>
      </div>
    );
  }

  // Render regular output lines (default case)
  return (
    <div className="terminal-line" suppressHydrationWarning={true}>
      <span className="output">{line.content}</span>
    </div>
  );
}
