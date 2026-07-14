import { useState, useRef, useCallback } from 'react';

/**
 * A custom hook to manage drag-and-drop reordering for a list.
 * @param {function(fromIndex: number, toIndex: number): void} onReorder - A callback function that is called when an item is dropped into a new position.
 * @returns {{
 *   getDragProps: (index: number) => {
 *     draggable: boolean,
 *     onDragStart: () => void,
 *     onDragEnter: () => void,
 *     onDragEnd: () => void,
 *     onDrop: () => void,
 *     onDragOver: (e: React.DragEvent) => void
 *   },
 *   dragOverIndex: number | null
 * }}
 */
export const useDraggableList = (onReorder) => {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItemIndex = useRef(null);
  const dragOverItemIndex = useRef(null);

  const handleDrop = useCallback(() => {
    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null && dragItemIndex.current !== dragOverItemIndex.current) {
      onReorder(dragItemIndex.current, dragOverItemIndex.current);
    }
    // Reset all state and refs after any drop attempt
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
    setDragOverIndex(null);
  }, [onReorder]);

  const getDragProps = useCallback((index) => ({
    draggable: true,
    onDragStart: () => (dragItemIndex.current = index),
    onDragEnter: () => {
      dragOverItemIndex.current = index;
      setDragOverIndex(index);
    },
    onDragEnd: handleDrop, // Use onDragEnd for cleanup, as it fires after onDrop
    onDrop: handleDrop,
    onDragOver: (e) => e.preventDefault(),
  }), [handleDrop]);

  return { getDragProps, dragOverIndex };
};