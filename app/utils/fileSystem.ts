import { FileSystemNode } from "../types/terminal";

export const createFileSystem = (): FileSystemNode => ({
  name: "/",
  type: "directory",
  children: [
    {
      name: "home",
      type: "directory",
      children: [
        {
          name: "angel",
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

export const getNodeAtPath = (
  fileSystem: FileSystemNode,
  path: string
): FileSystemNode | null => {
  if (path === "/") return fileSystem;

  const parts = path.split("/").filter(Boolean);
  let current = fileSystem;

  for (const part of parts) {
    const child = current.children?.find((node) => node.name === part);
    if (!child) return null;
    current = child;
  }

  return current;
};

export const getParentPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length === 0 ? "/" : "/" + parts.join("/");
};

export const getCurrentDirectoryName = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts.length === 0 ? "/" : parts[parts.length - 1];
};

export const isValidPath = (path: string): boolean => {
  return path.startsWith("/") && !path.includes("..");
};
