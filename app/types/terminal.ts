export interface TerminalLine {
  type: "command" | "output" | "error";
  content: string;
  command?: string;
  timestamp: number;
}

export interface FileSystemNode {
  name: string;
  type: "file" | "directory";
  children?: FileSystemNode[];
}

export interface TerminalState {
  currentDirectory: string;
  fileSystem: FileSystemNode;
  history: string[];
  historyIndex: number;
}

export interface CommandResult {
  output: string[];
  error?: string;
}
