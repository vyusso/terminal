import { FileSystemNode } from "../types/terminal";

/**
 * Creates a virtual file system with a basic directory structure
 * This simulates a Unix-like file system with common directories
 *
 * Structure:
 * /
 * ├── home/
 * │   └── [nickname]/
 * │       ├── Documents/
 * │       ├── Downloads/
 * │       ├── Desktop/
 * │       └── readme.txt
 * ├── bin/
 * ├── etc/
 * └── var/
 */
export const createFileSystem = (nickname: string): FileSystemNode => ({
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
            { name: "Documents", type: "directory", children: [] },
            { name: "Downloads", type: "directory", children: [] },
            { name: "Desktop", type: "directory", children: [] },
            { name: "readme.txt", type: "file" },
          ],
        },
      ],
    },
    { name: "bin", type: "directory", children: [] },
    { name: "etc", type: "directory", children: [] },
    { name: "var", type: "directory", children: [] },
  ],
});

/**
 * Navigates to a specific node in the file system using a path
 *
 * @param fileSystem - The root of the file system tree
 * @param path - The path to navigate to (e.g., "/home/user/Documents")
 * @returns The node at the specified path, or null if path doesn't exist
 *
 * Example:
 * getNodeAtPath(fileSystem, "/home/user") -> returns the user directory node
 */
export const getNodeAtPath = (
  fileSystem: FileSystemNode,
  path: string
): FileSystemNode | null => {
  // Root directory is a special case
  if (path === "/") return fileSystem;

  // Split path into parts and filter out empty strings
  const parts = path.split("/").filter(Boolean);
  let current = fileSystem;

  // Navigate through each part of the path
  for (const part of parts) {
    const child = current.children?.find((node) => node.name === part);
    if (!child) return null; // Path doesn't exist
    current = child;
  }

  return current;
};

/**
 * Gets the parent directory path of a given path
 *
 * @param path - The current path
 * @returns The parent directory path
 *
 * Examples:
 * getParentPath("/home/user/Documents") -> "/home/user"
 * getParentPath("/home/user") -> "/home"
 * getParentPath("/home") -> "/"
 */
export const getParentPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  parts.pop(); // Remove the last part (current directory)
  return parts.length === 0 ? "/" : "/" + parts.join("/");
};

/**
 * Extracts the name of the current directory from a full path
 *
 * @param path - The full path
 * @returns Just the name of the current directory
 *
 * Examples:
 * getCurrentDirectoryName("/home/user/Documents") -> "Documents"
 * getCurrentDirectoryName("/home/user") -> "user"
 * getCurrentDirectoryName("/") -> "/"
 */
export const getCurrentDirectoryName = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts.length === 0 ? "/" : parts[parts.length - 1];
};

/**
 * Validates if a path is syntactically correct
 *
 * @param path - The path to validate
 * @returns true if the path is valid, false otherwise
 *
 * Rules:
 * - Must start with "/" (absolute path)
 * - Cannot contain ".." (for security reasons)
 */
export const isValidPath = (path: string): boolean => {
  return path.startsWith("/") && !path.includes("..");
};
