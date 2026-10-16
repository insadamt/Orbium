export type StatisticsInsight =
    | 'words'
    | 'blocks'
    | 'storage'
    | 'tasks'
    | 'uploads'
    | 'organization';

export const insightLabels: Record<StatisticsInsight, string> = {
    organization: 'Content',
    words: 'Writing',
    blocks: 'Blocks',
    storage: 'Storage',
    tasks: 'Tasks',
    uploads: 'Uploads',
};
