'use client';

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, useId } from 'react';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
  disabled?: boolean;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const contextId = useId();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        {items.map((item) => (
          <SortableRow key={item.id} id={item.id}>
            {(handle) => renderItem(item, handle)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
    cursor: isDragging ? 'grabbing' : undefined,
  };

  const handle = (
    <button
      type="button"
      aria-label="드래그하여 순서 변경"
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none shrink-0 px-1"
    >
      {/* 6-dot grip icon */}
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden>
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="4" cy="10" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="4" cy="16" r="1.5" />
        <circle cx="10" cy="16" r="1.5" />
      </svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}
