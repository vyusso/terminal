"use client";

import { useState, useCallback, useEffect } from "react";
import { TerminalLine, TerminalState } from "../types/terminal";
import {
  createFileSystem,
  getNodeAtPath,
  getParentPath,
} from "../utils/fileSystem";
import { executeCommand } from "../utils/commands";

/**
 * Custom React hook that manages the terminal state and functionality
 * This is the main logic hub for the terminal application
 *
 * Features:
 * - Command execution and history
 * - File system navigation
 * - Terminal output management
 * - Directory creation
 * - Terminal clearing
 */
export const useTerminal = (nickname: string) => {
  /**
   * Main terminal state containing:
   * - currentDirectory: Current working directory path
   * - fileSystem: Virtual file system structure
   * - history: Array of previously executed commands
   * - historyIndex: Current position in command history
   */
  const [state, setState] = useState<TerminalState>({
    currentDirectory: `/home/${nickname}`, // Start in user's home directory
    fileSystem: createFileSystem(nickname), // Initialize virtual file system
    history: [], // Command history starts empty
    historyIndex: -1, // No history position initially
  });

  /**
   * Array of terminal lines (commands, outputs, errors)
   * Each line represents something displayed in the terminal
   */
  const [lines, setLines] = useState<TerminalLine[]>([]);

  // Update terminal state when nickname changes
  useEffect(() => {
    setState({
      currentDirectory: `/home/${nickname}`, // Start in user's home directory
      fileSystem: createFileSystem(nickname), // Initialize virtual file system
      history: [], // Command history starts empty
      historyIndex: -1, // No history position initially
    });
    setLines([]); // Clear terminal lines when nickname changes
  }, [nickname]);

  /**
   * Adds a new line to the terminal output
   * Automatically adds a timestamp to each line
   *
   * @param line - The line to add (without timestamp)
   */
  const addLine = useCallback((line: Omit<TerminalLine, "timestamp">) => {
    setLines((prev) => [...prev, { ...line, timestamp: Date.now() }]);
  }, []);

  /**
   * Main command execution function
   * Handles command parsing, execution, and state updates
   *
   * @param command - The command string to execute
   */
  const executeCommandLine = useCallback(
    (command: string) => {
      // Skip empty commands
      if (!command.trim()) return;

      // Add command to history for future navigation
      setState((prev) => ({
        ...prev,
        history: [...prev.history, command],
        historyIndex: -1, // Reset history index when new command is added
      }));

      // Display the command in the terminal
      addLine({
        type: "command",
        content: command,
        command,
      });

      // Execute the command and get result
      const result = executeCommand(command, state, nickname);

      // Parse command for special handling
      const [cmd, ...args] = command.trim().split(" ");

      // Handle commands that modify terminal state
      if (cmd === "cd") {
        // Only change directory if command executed successfully
        if (!result.error) {
          const targetPath = args[0];
          let newPath = state.currentDirectory;

          // Handle different cd scenarios
          if (!targetPath || targetPath === "~") {
            // Go to home directory
            newPath = `/home/${nickname}`;
          } else if (targetPath === "..") {
            // Go to parent directory
            newPath = getParentPath(state.currentDirectory);
          } else if (targetPath === "-") {
            // Go back to previous directory (simplified - always goes to home)
            newPath = `/home/${nickname}`;
          } else {
            // Handle relative and absolute paths
            if (!targetPath.startsWith("/")) {
              // Relative path - append to current directory
              newPath =
                state.currentDirectory === "/"
                  ? `/${targetPath}`
                  : `${state.currentDirectory}/${targetPath}`;
            } else {
              // Absolute path - use as is
              newPath = targetPath;
            }
          }

          // Update the current directory in state
          setState((prev) => ({ ...prev, currentDirectory: newPath }));
        }
      } else if (cmd === "mkdir") {
        // Handle directory creation
        const dirName = args[0];
        if (dirName) {
          setState((prev) => {
            const newFileSystem = { ...prev.fileSystem };
            const currentDir = getNodeAtPath(
              newFileSystem,
              prev.currentDirectory
            );

            // Add new directory to current directory's children
            if (currentDir && currentDir.type === "directory") {
              if (!currentDir.children) currentDir.children = [];
              currentDir.children.push({
                name: dirName,
                type: "directory",
                children: [],
              });
            }

            return { ...prev, fileSystem: newFileSystem };
          });
        }
      } else if (cmd === "clear") {
        // Clear all terminal lines
        setLines([]);
        return; // Don't add any output lines
      }

      // Display command results
      if (result.error) {
        // Show error message in red
        addLine({
          type: "error",
          content: result.error,
        });
      } else if (result.output.length > 0) {
        // Show each output line
        result.output.forEach((output) => {
          addLine({
            type: "output",
            content: output,
          });
        });
      }
    },
    [state, addLine]
  );

  /**
   * Gets the current directory name for display in the prompt
   * Extracts just the directory name from the full path
   *
   * @returns The name of the current directory
   *
   * Examples:
   * "/home/user" -> "user"
   * "/home/user/Documents" -> "Documents"
   * "/" -> "/"
   */
  const getCurrentPrompt = useCallback(() => {
    const parts = state.currentDirectory.split("/").filter(Boolean);
    const currentDir = parts.length === 0 ? "/" : parts[parts.length - 1];
    return currentDir;
  }, [state.currentDirectory]);

  // Return the public interface of the hook
  return {
    lines, // All terminal lines for display
    currentDirectory: state.currentDirectory, // Current working directory
    currentPrompt: getCurrentPrompt(), // Directory name for prompt
    executeCommand: executeCommandLine, // Function to execute commands
    history: state.history, // Command history for navigation
  };
};
