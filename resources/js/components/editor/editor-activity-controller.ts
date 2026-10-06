import { adjustEditorPerformanceCounter } from '@/lib/editor-performance';

export type EditorActivityState = Readonly<{
    active: boolean;
    visible: boolean;
}>;

type ActivitySubscriber = () => void;

export class EditorActivityController {
    private snapshot: EditorActivityState;
    private subscribers = new Set<ActivitySubscriber>();
    private mounted = false;

    constructor(initialActivity: EditorActivityState) {
        this.snapshot = Object.freeze({
            active: initialActivity.active,
            visible: initialActivity.visible,
        });
    }

    getSnapshot = (): EditorActivityState => this.snapshot;

    subscribe = (subscriber: ActivitySubscriber) => {
        this.subscribers.add(subscriber);
        return () => {
            this.subscribers.delete(subscriber);
        };
    };

    setActivity(activity: EditorActivityState) {
        const previous = this.snapshot;
        if (
            previous.active === activity.active &&
            previous.visible === activity.visible
        )
            return;

        this.snapshot = Object.freeze({
            active: activity.active,
            visible: activity.visible,
        });
        if (this.mounted) {
            this.adjustActivityGauges(previous, -1);
            this.adjustActivityGauges(this.snapshot, 1);
            adjustEditorPerformanceCounter('editor-activity.transitions', 1);
        }
        for (const subscriber of this.subscribers) subscriber();
    }

    mount() {
        if (this.mounted) return;
        this.mounted = true;
        adjustEditorPerformanceCounter('editor-activity.controllers', 1);
        adjustEditorPerformanceCounter('editor-activity.transitions', 0);
        this.adjustActivityGauges(this.snapshot, 1);
    }

    dispose() {
        if (this.mounted) {
            this.mounted = false;
            adjustEditorPerformanceCounter('editor-activity.controllers', -1);
            this.adjustActivityGauges(this.snapshot, -1);
        }
        // Tiptap can survive React effect replay; consumers unsubscribe when their own lifecycle ends.
    }

    private adjustActivityGauges(
        activity: EditorActivityState,
        amount: number,
    ) {
        adjustEditorPerformanceCounter(
            'editor-activity.active-editors',
            activity.active ? amount : 0,
        );
        adjustEditorPerformanceCounter(
            'editor-activity.visible-editors',
            activity.visible ? amount : 0,
        );
    }
}
