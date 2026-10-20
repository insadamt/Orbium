import type {
    BoardCamera,
    BoardObject,
    BoardPoint,
    BoardPlacementKind,
} from './board-types';
import type { BoardAlignmentIndex } from './board-alignment-index';
import type { BoardPaintTargets } from './board-pointer-paint';
import type { BoardGuide } from './board-alignment';

export type BoardGesture =
    | {
          kind: 'place';
          pointerId: number;
          start: BoardPoint;
          blockKind: BoardPlacementKind;
          moved: boolean;
      }
    | { kind: 'pan'; pointerId: number; start: BoardPoint; camera: BoardCamera }
    | {
          kind: 'pinch';
          camera: BoardCamera;
          distance: number;
          anchor: BoardPoint;
      }
    | {
          kind: 'marquee';
          pointerId: number;
          start: BoardPoint;
          end: BoardPoint;
          previous: string[];
      }
    | {
          kind: 'move' | 'resize';
          pointerId: number;
          start: BoardPoint;
          originals: BoardObject[];
          paintTargets: BoardPaintTargets;
          screenStart: BoardPoint;
          activated: boolean;
          targets: BoardObject[];
          alignmentIndex?: BoardAlignmentIndex;
          preview: BoardObject[];
          axis: string;
          guides: BoardGuide[];
      };
