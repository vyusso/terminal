import { CommandResult, TerminalState } from "../types/terminal";
import { upsertActiveComment } from "../lib/firestore";
import {
  getNodeAtPath,
  getParentPath,
  isValidPath,
  createFile,
  updateFile,
  getFileContent,
} from "./fileSystem";

/**
 * Main command execution function
 * Parses the command string and routes to the appropriate command handler
 *
 * Supported commands:
 * - cd: Change directory
 * - ls: List directory contents
 * - mkdir: Create directory
 * - comment: Create a text file with content
 * - open: Read and display file contents
 * - clear: Clear terminal (handled by hook)
 * - pwd: Print working directory
 * - whoami: Show current user
 * - help: Show available commands
 */
export const executeCommand = (
  command: string,
  state: TerminalState,
  nickname: string
): CommandResult => {
  // Split command into command name and arguments
  const [cmd, ...args] = command.trim().split(" ");

  // Route to appropriate command handler
  switch (cmd) {
    case "cd":
      return executeCd(args, state);
    case "ls":
      return executeLs(args, state);
    case "mkdir":
      return executeMkdir(args, state);
    case "chess":
      return { output: ["chess.exe running"] };
    case "comment":
      return executeComment(args, state, nickname);
    case "open":
      return executeOpen(args, state);
    case "clear":
      return { output: [] }; // Clear is handled by the hook
    case "pwd":
      return { output: [state.currentDirectory] };
    case "whoami":
      return { output: [nickname] };
    case "help":
      return executeHelp();
    default:
      if (cmd) {
        return {
          output: [],
          error: `command not found: ${cmd}
type "help" for a list of commands`,
        };
      }
      return { output: [] }; // Empty command
  }
};

// ========================================
// COMMAND HANDLERS
// ========================================

/**
 * Handles the 'cd' (change directory) command
 *
 * Supported syntax:
 * - cd (no args) -> go to home directory
 * - cd ~ -> go to home directory
 * - cd .. -> go to parent directory
 * - cd /path/to/dir -> go to absolute path
 * - cd dirname -> go to relative path
 */
const executeCd = (args: string[], state: TerminalState): CommandResult => {
  const targetPath = args[0];

  // Handle home directory cases
  if (!targetPath || targetPath === "~") {
    return { output: [] }; // Will be handled by the hook
  }

  // Handle previous directory (goes to home directory)
  if (targetPath === "-") {
    return { output: [] }; // Will be handled by the hook
  }

  // Calculate the new path
  let newPath = targetPath;
  if (targetPath === "..") {
    // Go to parent directory
    newPath = getParentPath(state.currentDirectory);
  } else if (!targetPath.startsWith("/")) {
    // Handle relative paths
    newPath =
      state.currentDirectory === "/"
        ? `/${targetPath}`
        : `${state.currentDirectory}/${targetPath}`;
  }

  // Validate the path syntax
  if (!isValidPath(newPath)) {
    return {
      output: [],
      error: `cd: ${targetPath}: No such file or directory`,
    };
  }

  // Check if the target directory exists
  const targetNode = getNodeAtPath(state.fileSystem, newPath);
  if (!targetNode || targetNode.type !== "directory") {
    return {
      output: [],
      error: `cd: ${targetPath}: No such file or directory`,
    };
  }

  return { output: [] }; // Success - will be handled by the hook
};

/**
 * Handles the 'ls' (list directory contents) command
 *
 * Supported syntax:
 * - ls (no args) -> list current directory
 * - ls /path/to/dir -> list specified directory
 */
const executeLs = (args: string[], state: TerminalState): CommandResult => {
  let targetPath = state.currentDirectory;

  // Parse arguments
  if (args.length > 0 && !args[0].startsWith("-")) {
    // First argument is a path
    targetPath = args[0];
  }

  // Validate the path
  if (!isValidPath(targetPath)) {
    return {
      output: [],
      error: `ls: ${targetPath}: No such file or directory`,
    };
  }

  // No special-casing for 'active': keep standard ls behavior

  // Get the target directory
  const targetNode = getNodeAtPath(state.fileSystem, targetPath);
  if (!targetNode) {
    return {
      output: [],
      error: `ls: ${targetPath}: No such file or directory`,
    };
  }

  if (targetNode.type !== "directory") {
    return {
      output: [],
      error: `ls: ${targetPath}: Not a directory`,
    };
  }

  // List directory contents
  const children = targetNode.children || [];
  if (children.length === 0) {
    return { output: [] }; // Empty directory
  }

  // Sort children: directories first, then files, both alphabetically
  const sortedChildren = children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Format output - just return the names
  const output = sortedChildren.map((child) => child.name);

  return { output };
};

/**
 * Handles the 'mkdir' (make directory) command
 *
 * Supported syntax:
 * - mkdir dirname -> create directory in current location
 */
const executeMkdir = (args: string[], state: TerminalState): CommandResult => {
  if (args.length === 0) {
    return {
      output: [],
      error: "mkdir: missing operand",
    };
  }

  const dirName = args[0];

  // Validate directory name
  if (!dirName || dirName.includes("/")) {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': Invalid argument`,
    };
  }

  // Check if directory already exists
  const currentDir = getNodeAtPath(state.fileSystem, state.currentDirectory);
  if (!currentDir || currentDir.type !== "directory") {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': No such file or directory`,
    };
  }

  const existingChild = currentDir.children?.find(
    (child) => child.name === dirName
  );

  if (existingChild) {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': File exists`,
    };
  }

  return { output: [] }; // Success - will be handled by the hook
};

/**
 * Handles the 'comment' command
 * Creates a .txt file with the user's nickname and specified content
 * If file already exists, updates its content
 */
const executeComment = (
  args: string[],
  state: TerminalState,
  nickname: string
): CommandResult => {
  if (args.length === 0) {
    return {
      output: [],
      error: "comment: missing content",
    };
  }

  const content = args.join(" ");
  const fileName = `${nickname}.txt`;

  // Try to create the file first
  let success = createFile(
    state.fileSystem,
    state.currentDirectory,
    fileName,
    content
  );

  // Save to shared DB as well (async fire-and-forget)
  void upsertActiveComment(nickname, content);

  if (success) return { output: ["file created (shared)"] };

  // File already exists, try to update it
  success = updateFile(
    state.fileSystem,
    state.currentDirectory,
    fileName,
    content
  );
  if (success) return { output: ["file updated (shared)"] };

  return {
    output: [],
    error: `comment: cannot update file '${fileName}': File not found`,
  };
};

/**
 * Handles the 'open' command
 * Reads and displays the content of a specified file
 */
const executeOpen = (args: string[], state: TerminalState): CommandResult => {
  if (args.length === 0) {
    return {
      output: [],
      error: "open: missing filename",
    };
  }

  const fileName = args[0];
  let filePath = fileName;

  // If filename doesn't start with /, assume it's in current directory
  if (!fileName.startsWith("/")) {
    filePath =
      state.currentDirectory === "/"
        ? `/${fileName}`
        : `${state.currentDirectory}/${fileName}`;
  }

  const content = getFileContent(state.fileSystem, filePath);

  if (content === null) {
    return {
      output: [],
      error: `open: ${fileName}: No such file`,
    };
  }

  return { output: [content] };
};

/**
 * Handles the 'help' command
 * Shows available commands and their descriptions
 */
const executeHelp = (): CommandResult => {
  const helpText = [
    "Available commands:",
    "",
    "  cd [directory]     Change directory",
    "  cd ..              Go to parent directory",
    "  ls                 List directory contents",
    "  mkdir [directory]  Create a new directory",
    "  chess              Launch chess window",
    "  comment [text]     Create a text file with content",
    "  open [filename]    Read and display file contents",
    "  pwd                Print working directory",
    "  whoami             Show current user",
    "  clear              Clear terminal screen",
    "  help               Show this help message",
  ];

  return { output: helpText };
};
