/**
 * TypeScript type definitions for the terminal application
 * This file defines all the interfaces and types used throughout the terminal system
 */

/**
 * Represents a single line in the terminal output
 * Each line can be a command, output, or error message
 */
export interface TerminalLine {
  /** Type of line: command (user input), output (command result), or error (error message) */
  type: "command" | "output" | "error";
  /** The actual text content of the line */
  content: string;
  /** The original command that was executed (only present for command lines) */
  command?: string;
  /** Unix timestamp when this line was created */
  timestamp: number;
}

/**
 * Represents a node in the virtual file system
 * Can be either a file or directory
 */
export interface FileSystemNode {
  /** Name of the file or directory */
  name: string;
  /** Type: either "file" or "directory" */
  type: "file" | "directory";
  /** Array of child nodes (only for directories) */
  children?: FileSystemNode[];
}

/**
 * Represents the current state of the terminal
 * Contains all the data needed to maintain terminal functionality
 */
export interface TerminalState {
  /** Current working directory path (e.g., "/home/user") */
  currentDirectory: string;
  /** The entire virtual file system structure */
  fileSystem: FileSystemNode;
  /** Array of previously executed commands for history navigation */
  history: string[];
  /** Index in the history array for navigation (used with arrow keys) */
  historyIndex: number;
}

/**
 * Result of executing a command
 * Contains either output lines or an error message
 */
export interface CommandResult {
  /** Array of output lines from the command execution */
  output: string[];
  /** Error message if the command failed (optional) */
  error?: string;
}
