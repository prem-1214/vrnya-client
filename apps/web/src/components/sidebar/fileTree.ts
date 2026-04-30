import type { UploadedFile } from "../../api/client";

export type FileTreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: FileTreeNode[];
  file?: UploadedFile;
};

export function buildFileTree(
  files: UploadedFile[],
  emptyFolders: string[] = [],
): FileTreeNode[] {
  const tree: Record<string, FileTreeNode> = {};

  files.forEach((file) => {
    const filePath = file.path || file.name;
    const parts = filePath.split("/").filter(Boolean);

    parts.slice(0, -1).forEach((_, folderIndex) => {
      const folderParts = parts.slice(0, folderIndex + 1);
      const folderPath = folderParts.join("/");
      const folderName = folderParts[folderParts.length - 1];

      if (!tree[folderPath]) {
        tree[folderPath] = {
          name: folderName,
          path: folderPath,
          type: "folder",
          children: [],
        };
      }
    });

    tree[filePath] = {
      name: file.name,
      path: filePath,
      type: "file",
      file,
    };
  });

  emptyFolders.forEach((folderPath) => {
    const parts = folderPath.split("/").filter(Boolean);
    parts.forEach((_, folderIndex) => {
      const segmentParts = parts.slice(0, folderIndex + 1);
      const segmentPath = segmentParts.join("/");
      if (!tree[segmentPath]) {
        tree[segmentPath] = {
          name: segmentParts[segmentParts.length - 1] || segmentPath,
          path: segmentPath,
          type: "folder",
          children: [],
        };
      }
    });
  });

  const root: FileTreeNode[] = [];
  Object.values(tree).forEach((node) => {
    const slashIndex = node.path.lastIndexOf("/");
    const parentPath = slashIndex > -1 ? node.path.slice(0, slashIndex) : "";

    if (!parentPath || !tree[parentPath]) {
      root.push(node);
      return;
    }

    if (!tree[parentPath].children) {
      tree[parentPath].children = [];
    }
    tree[parentPath].children?.push(node);
  });

  const sortTree = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children?.length) {
        sortTree(node.children);
      }
    });
  };

  sortTree(root);
  return root;
}

export function collectNodeFiles(node: FileTreeNode): UploadedFile[] {
  if (node.type === "file" && node.file) return [node.file];
  if (!node.children?.length) return [];
  return node.children.flatMap((child) => collectNodeFiles(child));
}
