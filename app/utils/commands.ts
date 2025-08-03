import { CommandResult, TerminalState } from "../types/terminal";
import { getNodeAtPath, getParentPath, isValidPath } from "./fileSystem";

/**
 * Main command execution function
 * Parses the command string and routes to the appropriate command handler
 *
 * @param command - The full command string (e.g., "ls -la")
 * @param state - Current terminal state
 * @param nickname - Current user's nickname
 * @returns CommandResult with output or error
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

/**
 * Handles the 'cd' (change directory) command
 *
 * @param args - Command arguments (target directory)
 * @param state - Current terminal state
 * @returns CommandResult (empty output if successful, error if failed)
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

  // Check if the target exists in the file system
  const targetNode = getNodeAtPath(state.fileSystem, newPath);
  if (!targetNode) {
    return {
      output: [],
      error: `cd: ${targetPath}: No such file or directory`,
    };
  }

  // Ensure the target is a directory
  if (targetNode.type !== "directory") {
    return {
      output: [],
      error: `cd: ${targetPath}: Not a directory`,
    };
  }

  return { output: [] }; // Success - actual directory change handled by hook
};

/**
 * Handles the 'ls' (list) command
 *
 * @param args - Command arguments (optional target directory)
 * @param state - Current terminal state
 * @returns CommandResult with list of files/directories
 *
 * Usage:
 * - ls -> list current directory
 * - ls /path/to/dir -> list specified directory
 * - ls dirname -> list relative directory
 */
const executeLs = (args: string[], state: TerminalState): CommandResult => {
  // Use current directory if no target specified
  const targetPath = args[0] || state.currentDirectory;

  // Resolve relative paths to absolute paths
  let pathToCheck = targetPath;
  if (!targetPath.startsWith("/")) {
    pathToCheck =
      state.currentDirectory === "/"
        ? `/${targetPath}`
        : `${state.currentDirectory}/${targetPath}`;
  }

  // Validate path syntax
  if (!isValidPath(pathToCheck)) {
    return {
      output: [],
      error: `ls: cannot access '${targetPath}': No such file or directory`,
    };
  }

  // Get the target node from file system
  const targetNode = getNodeAtPath(state.fileSystem, pathToCheck);
  if (!targetNode) {
    return {
      output: [],
      error: `ls: cannot access '${targetPath}': No such file or directory`,
    };
  }

  // Handle file listing (just return the filename)
  if (targetNode.type === "file") {
    return { output: [targetNode.name] };
  }

  // Handle directory listing
  if (targetNode.type === "directory") {
    const children = targetNode.children || [];
    if (children.length === 0) {
      return { output: [] }; // Empty directory
    }

    // Return names of all children
    const names = children.map((child) => child.name);
    return { output: names };
  }

  return { output: [] };
};

/**
 * Handles the 'mkdir' (make directory) command
 *
 * @param args - Command arguments (directory name)
 * @param state - Current terminal state
 * @returns CommandResult (empty output if successful, error if failed)
 *
 * Usage:
 * - mkdir dirname -> create directory with specified name
 *
 * Validation:
 * - Directory name must contain only alphanumeric characters, dots, underscores, and hyphens
 * - Directory must not already exist
 */
const executeMkdir = (args: string[], state: TerminalState): CommandResult => {
  // Check if directory name was provided
  if (args.length === 0) {
    return {
      output: [],
      error: "mkdir: missing operand",
    };
  }

  const dirName = args[0];

  // Validate directory name format (alphanumeric, dots, underscores, hyphens only)
  if (!dirName.match(/^[a-zA-Z0-9._-]+$/)) {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': Invalid name`,
    };
  }

  // Get the current directory node
  const currentDir = getNodeAtPath(state.fileSystem, state.currentDirectory);
  if (!currentDir || currentDir.type !== "directory") {
    return {
      output: [],
      error: "mkdir: current directory not found",
    };
  }

  // Check if directory already exists
  const existingChild = currentDir.children?.find(
    (child) => child.name === dirName
  );
  if (existingChild) {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': Directory already exists`,
    };
  }

  // Directory creation will be handled by the hook
  return { output: [] };
};

/**
 * Handles the 'help' command
 * Displays all available commands with their descriptions
 *
 * @returns CommandResult with help information
 */
const executeHelp = (): CommandResult => {
  const helpText = [
    "Available commands:",
    "",
    "  cd [directory]     - Change directory",
    "                      Examples: cd, cd ~, cd .., cd Documents",
    "",
    "  ls [directory]     - List directory contents",
    "                      Examples: ls, ls /home/user",
    "",
    "  mkdir <name>       - Create a new directory",
    "                      Example: mkdir myfolder",
    "",
    "  pwd                - Print current working directory",
    "",
    "  whoami             - Display current user nickname",
    "",
    "  clear              - Clear terminal screen",
    "",
    "  help               - Show this help message",
    "",
    "Note: Directory names can contain letters, numbers, dots, underscores, and hyphens.",
  ];

  return { output: helpText };
};
