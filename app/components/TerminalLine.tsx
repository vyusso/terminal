import { TerminalLine as TerminalLineType } from "../types/terminal";

interface TerminalLineProps {
  line: TerminalLineType;
  currentDirectory?: string;
}

export default function TerminalLine({
  line,
  currentDirectory,
}: TerminalLineProps) {
  if (line.type === "command") {
    return (
      <div className="terminal-line" suppressHydrationWarning={true}>
        <span className="prompt">
          <span className="username">angel</span>@terminal:
          {currentDirectory || "~"}$
        </span>
        <span className="command">{line.content}</span>
      </div>
    );
  }

  if (line.type === "error") {
    return (
      <div className="terminal-line" suppressHydrationWarning={true}>
        <span className="output" style={{ color: "#ff6b6b" }}>
          {line.content}
        </span>
      </div>
    );
  }

  return (
    <div className="terminal-line" suppressHydrationWarning={true}>
      <span className="output">{line.content}</span>
    </div>
  );
}
