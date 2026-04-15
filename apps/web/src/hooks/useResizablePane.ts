import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizablePaneOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number | ((windowWidth: number) => number);
}

export function useResizablePane(options: UseResizablePaneOptions) {
  const { initialWidth, minWidth, maxWidth } = options;
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);

  const getMaxWidth = useCallback(
    (windowWidth: number) =>
      typeof maxWidth === "function" ? maxWidth(windowWidth) : maxWidth,
    [maxWidth],
  );

  const stopResizing = useCallback(() => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const startResizing = useCallback(() => {
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const resizeFromClientX = useCallback(
    (clientX: number, rightOffset = 0) => {
      if (!isResizingRef.current) return;
      const limit = getMaxWidth(window.innerWidth);
      let nextWidth = window.innerWidth - clientX - rightOffset;
      if (nextWidth < minWidth) nextWidth = minWidth;
      if (nextWidth > limit) nextWidth = limit;
      setWidth(nextWidth);
    },
    [getMaxWidth, minWidth],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => resizeFromClientX(e.clientX);
    const handleMouseUp = () => stopResizing();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      stopResizing();
    };
  }, [resizeFromClientX, stopResizing]);

  return { width, setWidth, isResizing, startResizing, stopResizing, resizeFromClientX };
}
