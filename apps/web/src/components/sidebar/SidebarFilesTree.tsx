import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, File, Folder, FolderOpen, Loader2 } from "lucide-react";
import { getUserFolders, listUploadedFiles, type UploadedFile } from "../../api/client";
import { buildFileTree, collectNodeFiles, type FileTreeNode } from "./fileTree";

const DRAG_MIME_TYPE = "application/x-vrnya-doc-ref";
const PLAIN_TEXT_PREFIX = "vrnya-doc-ref:";

type DragDoc = {
  id: string;
  name: string;
  path: string;
};

type DragPayload = {
  type: "vrnya/doc-ref";
  docs: DragDoc[];
  folder?: {
    name: string;
    path: string;
  };
};

const getFolderIconColor = (folderPath: string) => {
  let hash = 0;
  for (let i = 0; i < folderPath.length; i += 1) {
    hash = folderPath.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 58%, 66%)`;
};

const SidebarFilesTree: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [fileData, folderData] = await Promise.all([
          listUploadedFiles(),
          getUserFolders().catch(() => ({ folders: [] })),
        ]);
        setFiles(fileData.files);
        setFolders(folderData.folders || []);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const tree = useMemo(() => buildFileTree(files, folders), [files, folders]);

  const createDragPayload = (
    docs: DragDoc[],
    folder?: { name: string; path: string },
  ) =>
    JSON.stringify<DragPayload>({
      type: "vrnya/doc-ref",
      docs,
      folder,
    });

  const getNodeDocs = (node: FileTreeNode): DragDoc[] => {
    const sourceFiles =
      node.type === "file" ? (node.file ? [node.file] : []) : collectNodeFiles(node);

    return sourceFiles.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path || file.name,
    }));
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    node: FileTreeNode,
    docs: DragDoc[],
  ) => {
    if (!docs.length) return;
    const payload =
      node.type === "folder"
        ? createDragPayload(docs, { name: node.name, path: node.path })
        : createDragPayload(docs);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(DRAG_MIME_TYPE, payload);
    event.dataTransfer.setData(
      "text/plain",
      `${PLAIN_TEXT_PREFIX}${payload}`,
    );
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderNode = (node: FileTreeNode, depth = 0): React.ReactNode => {
    const nodeDocs = getNodeDocs(node);

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = Boolean(node.children?.length);

      return (
        <div key={node.path}>
          <button
            type="button"
            className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover)"
            style={{ paddingLeft: `${8 + depth * 15}px` }}
            onClick={() => toggleFolder(node.path)}
            draggable
            onDragStart={(e) => handleDragStart(e, node, nodeDocs)}
            aria-label={`Folder ${node.name}`}
            title="Drag folder to attach all files in chat"
          >
            {hasChildren ? (
              <ChevronRight
                size={15}
                className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            ) : (
              <span className="inline-block w-[15px] shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen
                size={16}
                className="shrink-0"
                style={{ color: getFolderIconColor(node.path) }}
              />
            ) : (
              <Folder
                size={16}
                className="shrink-0"
                style={{ color: getFolderIconColor(node.path) }}
              />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded &&
            hasChildren &&
            node.children?.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover)"
        style={{ paddingLeft: `${8 + depth * 15}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, node, nodeDocs)}
        title={`Drag ${node.name} into chat`}
        aria-label={`File ${node.name}`}
      >
        <File size={15} className="shrink-0 text-(--color-text-muted)" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 size={17} className="animate-spin text-(--color-text-muted)" />
      </div>
    );
  }

  if (!tree.length) {
    return (
      <p className="px-2 py-2 text-xs text-(--color-text-muted)">
        No uploaded files yet.
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto pb-1">
      {tree.map((node) => renderNode(node))}
    </div>
  );
};

export default SidebarFilesTree;
