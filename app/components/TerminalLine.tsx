import { TerminalLine as TerminalLineType } from "../types/terminal";

/**
 * Props for the TerminalLine component
 * Contains the line data to display and optional current directory
 */
interface TerminalLineProps {
  /** The terminal line data to render */
  line: TerminalLineType;
  /** Current directory path (used for command line prompts) */
  currentDirectory?: string;
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
export default function TerminalLine({
  line,
  currentDirectory,
}: TerminalLineProps) {
  // Render command lines with prompt
  if (line.type === "command") {
    return (
      <div className="terminal-line" suppressHydrationWarning={true}>
        {/* Command prompt showing user and directory */}
        <span className="prompt">
          <span className="username">angel</span>@terminal:
          {currentDirectory || "~"}$
        </span>
        {/* The actual command that was typed */}
        <span className="command">{line.content}</span>
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
