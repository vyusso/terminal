import { CommandResult, TerminalState } from "../types/terminal";
import { getNodeAtPath, getParentPath, isValidPath } from "./fileSystem";

export const executeCommand = (
  command: string,
  state: TerminalState
): CommandResult => {
  const [cmd, ...args] = command.trim().split(" ");

  switch (cmd) {
    case "cd":
      return executeCd(args, state);
    case "ls":
      return executeLs(args, state);
    case "mkdir":
      return executeMkdir(args, state);
    case "clear":
      return { output: [] };
    case "pwd":
      return { output: [state.currentDirectory] };
    case "whoami":
      return { output: ["angel"] };
    default:
      if (cmd) {
        return {
          output: [],
          error: `command not found: ${cmd}`,
        };
      }
      return { output: [] };
  }
};

const executeCd = (args: string[], state: TerminalState): CommandResult => {
  const targetPath = args[0];

  if (!targetPath || targetPath === "~") {
    return { output: [] }; // Will be handled by the hook
  }

  if (targetPath === "-") {
    // Go back to previous directory (simplified)
    return { output: [] };
  }

  // Handle relative paths
  let newPath = targetPath;
  if (targetPath === "..") {
    newPath = getParentPath(state.currentDirectory);
  } else if (!targetPath.startsWith("/")) {
    newPath =
      state.currentDirectory === "/"
        ? `/${targetPath}`
        : `${state.currentDirectory}/${targetPath}`;
  }

  if (!isValidPath(newPath)) {
    return {
      output: [],
      error: `cd: ${targetPath}: No such file or directory`,
    };
  }

  const targetNode = getNodeAtPath(state.fileSystem, newPath);
  if (!targetNode) {
    return {
      output: [],
      error: `cd: ${targetPath}: No such file or directory`,
    };
  }

  if (targetNode.type !== "directory") {
    return {
      output: [],
      error: `cd: ${targetPath}: Not a directory`,
    };
  }

  return { output: [] }; // Will be handled by the hook
};

const executeLs = (args: string[], state: TerminalState): CommandResult => {
  const targetPath = args[0] || state.currentDirectory;

  let pathToCheck = targetPath;
  if (!targetPath.startsWith("/")) {
    pathToCheck =
      state.currentDirectory === "/"
        ? `/${targetPath}`
        : `${state.currentDirectory}/${targetPath}`;
  }

  if (!isValidPath(pathToCheck)) {
    return {
      output: [],
      error: `ls: cannot access '${targetPath}': No such file or directory`,
    };
  }

  const targetNode = getNodeAtPath(state.fileSystem, pathToCheck);
  if (!targetNode) {
    return {
      output: [],
      error: `ls: cannot access '${targetPath}': No such file or directory`,
    };
  }

  if (targetNode.type === "file") {
    return { output: [targetNode.name] };
  }

  if (targetNode.type === "directory") {
    const children = targetNode.children || [];
    if (children.length === 0) {
      return { output: [] };
    }

    const names = children.map((child) => child.name);
    return { output: names };
  }

  return { output: [] };
};

const executeMkdir = (args: string[], state: TerminalState): CommandResult => {
  if (args.length === 0) {
    return {
      output: [],
      error: "mkdir: missing operand",
    };
  }

  const dirName = args[0];

  if (!dirName.match(/^[a-zA-Z0-9._-]+$/)) {
    return {
      output: [],
      error: `mkdir: cannot create directory '${dirName}': Invalid name`,
    };
  }

  // Check if directory already exists
  const currentDir = getNodeAtPath(state.fileSystem, state.currentDirectory);
  if (!currentDir || currentDir.type !== "directory") {
    return {
      output: [],
      error: "mkdir: current directory not found",
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

  // Add new directory (will be handled by the hook)
  return { output: [] };
};
