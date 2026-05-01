import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import {
  getUserFolders,
  listUploadedFiles,
  type UploadedFile,
} from "../../api/client";
import { buildFileTree, collectNodeFiles, type FileTreeNode } from "./fileTree";
import ImagePreviewModal from "../ImagePreviewModal";
import { useComposerAttach } from "../../context/ComposerAttachContext";

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

function isPreviewableImageExtension(extension: string): boolean {
  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ].includes(extension.toLowerCase());
}

const getFolderIconColor = (folderPath: string) => {
  let hash = 0;
  for (let i = 0; i < folderPath.length; i += 1) {
    hash = folderPath.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 58%, 66%)`;
};

const SidebarFilesTree: React.FC = () => {
  const navigate = useNavigate();
  const { attachFromSidebar } = useComposerAttach();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

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
      node.type === "file"
        ? node.file
          ? [node.file]
          : []
        : collectNodeFiles(node);

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
    event.dataTransfer.setData("text/plain", `${PLAIN_TEXT_PREFIX}${payload}`);
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

  const handleOpenUploadedFile = (file: UploadedFile) => {
    if (isPreviewableImageExtension(file.extension)) {
      setPreviewId(file.id);
      setPreviewName(file.name);
      setPreviewOpen(true);
    } else {
      navigate(`/document/${file.id}`);
    }
  };

  const handleAttachClick = async (
    e: React.MouseEvent,
    node: FileTreeNode,
    docs: DragDoc[],
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!docs.length) return;

    await attachFromSidebar({
      docIds: docs.map((d) => d.id),
      folder:
        node.type === "folder"
          ? { name: node.name, path: node.path }
          : undefined,
    });
  };

  const renderNode = (node: FileTreeNode, depth = 0): React.ReactNode => {
    const nodeDocs = getNodeDocs(node);
    const pl = `${8 + depth * 15}px`;

    const atButtonClasses =
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-(--color-text-muted) transition-colors hover:bg-(--color-bg-hover) hover:text-(--color-accent) disabled:pointer-events-none disabled:opacity-40";

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = Boolean(node.children?.length);

      return (
        <div key={node.path}>
          <div className="flex min-w-0 items-center gap-0.5 pe-1">
            <button
              type="button"
              className="group flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pe-2 ps-2 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover)"
              style={{ paddingLeft: pl }}
              onClick={() => toggleFolder(node.path)}
              draggable={nodeDocs.length > 0}
              onDragStart={
                nodeDocs.length > 0
                  ? (e) => handleDragStart(e, node, nodeDocs)
                  : undefined
              }
              aria-label={`Folder ${node.name}`}
              title={
                nodeDocs.length > 0
                  ? "Open folder • drag to attach in chat"
                  : "Empty folder"
              }
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
            <button
              type="button"
              className={atButtonClasses}
              disabled={!nodeDocs.length}
              title={
                nodeDocs.length
                  ? "Add folder to chat (@mentions + context)"
                  : "No files in this folder yet"
              }
              aria-label={`Add folder ${node.name} to chat`}
              onClick={(e) => void handleAttachClick(e, node, nodeDocs)}
            >
              <AtSign size={15} aria-hidden strokeWidth={2.25} />
            </button>
          </div>
          {isExpanded &&
            hasChildren &&
            node.children?.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    const uf = node.file;

    return (
      <div key={node.path} className="flex min-w-0 items-center gap-0.5 pe-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 pe-2 ps-2 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-hover)"
          style={{ paddingLeft: pl }}
          draggable={Boolean(uf)}
          onDragStart={
            uf ? (e) => handleDragStart(e, node, nodeDocs) : undefined
          }
          onClick={() => uf && handleOpenUploadedFile(uf)}
          title={uf ? "Open preview or document viewer" : node.name}
          aria-label={`File ${node.name}`}
          disabled={!uf}
        >
          <File size={15} className="shrink-0 text-(--color-text-muted)" />
          <span className="truncate">{node.name}</span>
        </button>
        <button
          type="button"
          className={atButtonClasses}
          disabled={!uf || !nodeDocs.length}
          title="Add file to chat (@mentions + context)"
          aria-label={`Add ${node.name} to chat`}
          onClick={(e) =>
            uf ? void handleAttachClick(e, node, nodeDocs) : undefined
          }
        >
          <AtSign size={15} aria-hidden strokeWidth={2.25} />
        </button>
      </div>
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
    <>
      <div className="max-h-64 overflow-y-auto pb-1">
        {tree.map((node) => renderNode(node))}
      </div>
      {previewOpen && previewId ? (
        <ImagePreviewModal
          fileId={previewId}
          fileName={previewName}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewId(null);
          }}
        />
      ) : null}
    </>
  );
};

export default SidebarFilesTree;
