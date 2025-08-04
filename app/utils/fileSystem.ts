import { FileSystemNode } from "../types/terminal";

// ========================================
// FILE SYSTEM CREATION
// ========================================

/**
 * Creates a virtual file system for a user
 * Initializes with a home directory structure
 */
export const createFileSystem = (nickname: string): FileSystemNode => {
  return {
    name: "/",
    type: "directory",
    children: [
      {
        name: "home",
        type: "directory",
        children: [
          {
            name: nickname,
            type: "directory",
            children: [
              {
                name: "Documents",
                type: "directory",
                children: [
                  {
                    name: "readme.txt",
                    type: "file",
                  },
                ],
              },
              {
                name: "Downloads",
                type: "directory",
                children: [],
              },
              {
                name: "Desktop",
                type: "directory",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "bin",
        type: "directory",
        children: [],
      },
      {
        name: "etc",
        type: "directory",
        children: [],
      },
      {
        name: "tmp",
        type: "directory",
        children: [],
      },
    ],
  };
};

// ========================================
// PATH UTILITIES
// ========================================

/**
 * Gets the parent path of a given path
 * Handles edge cases like root directory
 */
export const getParentPath = (path: string): string => {
  if (path === "/") return "/";

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  return "/" + parts.slice(0, -1).join("/");
};

/**
 * Validates if a path has correct syntax
 * Checks for valid characters and structure
 */
export const isValidPath = (path: string): boolean => {
  // Must start with /
  if (!path.startsWith("/")) return false;

  // Check for invalid characters
  if (path.includes("//") || path.includes("\\")) return false;

  // Check for invalid path components
  const parts = path.split("/").filter(Boolean);
  for (const part of parts) {
    if (part === "." || part === "..") return false;
    if (part.length === 0) return false;
  }

  return true;
};

// ========================================
// NODE NAVIGATION
// ========================================

/**
 * Gets a node at a specific path in the file system
 * Returns null if the path doesn't exist
 */
export const getNodeAtPath = (
  fileSystem: FileSystemNode,
  path: string
): FileSystemNode | null => {
  if (path === "/") return fileSystem;

  const parts = path.split("/").filter(Boolean);
  let currentNode: FileSystemNode = fileSystem;

  for (const part of parts) {
    if (currentNode.type !== "directory") return null;

    const child = currentNode.children?.find((node) => node.name === part);
    if (!child) return null;

    currentNode = child;
  }

  return currentNode;
};
