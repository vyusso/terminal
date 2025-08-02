"use client";

import { useState, useCallback } from "react";
import { TerminalLine, TerminalState } from "../types/terminal";
import {
  createFileSystem,
  getNodeAtPath,
  getParentPath,
} from "../utils/fileSystem";
import { executeCommand } from "../utils/commands";

export const useTerminal = () => {
  const [state, setState] = useState<TerminalState>({
    currentDirectory: "/home/angel",
    fileSystem: createFileSystem(),
    history: [],
    historyIndex: -1,
  });

  const [lines, setLines] = useState<TerminalLine[]>([]);

  const addLine = useCallback((line: Omit<TerminalLine, "timestamp">) => {
    setLines((prev) => [...prev, { ...line, timestamp: Date.now() }]);
  }, []);

  const executeCommandLine = useCallback(
    (command: string) => {
      if (!command.trim()) return;

      // Add command to history
      setState((prev) => ({
        ...prev,
        history: [...prev.history, command],
        historyIndex: -1,
      }));

      // Add command line to display
      addLine({
        type: "command",
        content: command,
        command,
      });

      // Execute command
      const result = executeCommand(command, state);

      // Handle special commands that modify state
      const [cmd, ...args] = command.trim().split(" ");

      if (cmd === "cd") {
        // Only change directory if no error occurred
        if (!result.error) {
          const targetPath = args[0];
          let newPath = state.currentDirectory;

          if (!targetPath || targetPath === "~") {
            newPath = "/home/angel";
          } else if (targetPath === "..") {
            newPath = getParentPath(state.currentDirectory);
          } else if (targetPath === "-") {
            // Go back to previous directory (simplified)
            newPath = "/home/angel";
          } else {
            // Handle relative paths
            if (!targetPath.startsWith("/")) {
              newPath =
                state.currentDirectory === "/"
                  ? `/${targetPath}`
                  : `${state.currentDirectory}/${targetPath}`;
            } else {
              newPath = targetPath;
            }
          }

          setState((prev) => ({ ...prev, currentDirectory: newPath }));
        }
      } else if (cmd === "mkdir") {
        const dirName = args[0];
        if (dirName) {
          setState((prev) => {
            const newFileSystem = { ...prev.fileSystem };
            const currentDir = getNodeAtPath(
              newFileSystem,
              prev.currentDirectory
            );
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
        setLines([]);
        return;
      }

      // Add output lines
      if (result.error) {
        addLine({
          type: "error",
          content: result.error,
        });
      } else if (result.output.length > 0) {
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

  const getCurrentPrompt = useCallback(() => {
    const parts = state.currentDirectory.split("/").filter(Boolean);
    const currentDir = parts.length === 0 ? "/" : parts[parts.length - 1];
    return currentDir;
  }, [state.currentDirectory]);

  return {
    lines,
    currentDirectory: state.currentDirectory,
    currentPrompt: getCurrentPrompt(),
    executeCommand: executeCommandLine,
    history: state.history,
  };
};
