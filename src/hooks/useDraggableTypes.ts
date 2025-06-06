
export interface Position {
  x: number;
  y: number;
}

export interface UseDraggableOptions {
  defaultPosition?: Position;
  storageKey?: string;
  boundaries?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  currentPosition: Position;
}
