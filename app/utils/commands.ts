import { CommandResult, TerminalState } from "../types/terminal";
import { getNodeAtPath, getParentPath, isValidPath } from "./fileSystem";

/**
 * Main command execution function
 * Parses the command string and routes to the appropriate command handler
 *
 * Supported commands:
 * - cd: Change directory
 * - ls: List directory contents
 * - mkdir: Create directory
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
          error: `command not found: ${cmd}`,
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
 * - cd - -> go to previous directory (simplified)
 * - cd /path/to/dir -> go to absolute path
 * - cd dirname -> go to relative path
 */
const executeCd = (args: string[], state: TerminalState): CommandResult => {
  const targetPath = args[0];

  // Handle home directory cases
  if (!targetPath || targetPath === "~") {
    return { output: [] }; // Will be handled by the hook
  }

  // Handle previous directory (simplified implementation)
  if (targetPath === "-") {
    return { output: [] };
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
 * - ls -la -> list with details (simplified)
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

  // Format output
  const output = sortedChildren.map((child) => {
    const type = child.type === "directory" ? "d" : "-";
    const name = child.name;
    return `${type}rw-r--r-- 1 user user 4096 Jan 1 00:00 ${name}`;
  });

  return { output };
};

/**
 * Handles the 'mkdir' (make directory) command
 *
 * Supported syntax:
 * - mkdir dirname -> create directory in current location
 * - mkdir /path/to/dir -> create directory at absolute path
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
 * Handles the 'help' command
 * Shows available commands and their descriptions
 */
const executeHelp = (): CommandResult => {
  const helpText = [
    "Available commands:",
    "",
    "  cd [directory]     Change directory",
    "  ls [options] [dir] List directory contents",
    "  mkdir [directory]  Create a new directory",
    "  pwd                Print working directory",
    "  whoami             Show current user",
    "  clear              Clear terminal screen",
    "  help               Show this help message",
    "",
    "Navigation:",
    "  cd ~               Go to home directory",
    "  cd ..              Go to parent directory",
    "  cd -               Go to previous directory",
    "",
    "File operations:",
    "  ls -la             List with details",
    "  mkdir mydir        Create directory 'mydir'",
  ];

  return { output: helpText };
};
