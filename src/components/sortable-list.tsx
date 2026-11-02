import type { CSSProperties, ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

// A drag handle for one item. Only the handle starts a drag, so typing in a caption or
// selecting text never moves anything. Works with mouse, touch and keyboard (focus the
// handle, Space to pick up, arrow keys to move, Space to drop).
export type DragHandle = ReactNode;

function SortableItem({
  id,
  label,
  disabled,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: (handle: DragHandle) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder: ${label}`}
      title="Drag to reorder"
      disabled={disabled}
      className={cn(
        "flex size-9 shrink-0 touch-none items-center justify-center rounded-md text-muted-foreground",
        "hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <GripVertical className="size-5" />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-80 shadow-lg")}>
      {children(handle)}
    </div>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  label,
  onReorder,
  disabled = false,
  className,
  children,
}: {
  items: T[];
  label: (item: T) => string;
  // Called with every id in its new order after a drop that changed something.
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
  children: (item: T, handle: DragHandle) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map((item) => item.id);
  function dragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("grid gap-4", className)}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} label={label(item)} disabled={disabled}>
              {(handle) => children(item, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
