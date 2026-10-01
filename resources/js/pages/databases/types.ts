export type PropertyType =
    | 'text'
    | 'number'
    | 'select'
    | 'multi_select'
    | 'checkbox'
    | 'date'
    | 'url'
    | 'email'
    | 'files'
    | 'mention';
export type Property = {
    id: number;
    name: string;
    type: PropertyType;
    position: number;
    config: { options?: string[]; default?: unknown };
};
export type DatabaseDocument = {
    id: number;
    title: string;
    cover_attachment_id: number | null;
    plain_text: string;
};
export type Value = {
    document_node_id: number;
    property_id: number;
    value: unknown;
};
export type Candidate = { id: number; title: string; type: string };
export type FileReference = { id: number; original_name: string };
export type Filter = {
    property_id: number;
    operator: 'is' | 'is_not' | 'contains' | 'is_empty';
    value?: unknown;
};
export type Sort = { field: string; direction: 'asc' | 'desc' };
export type ViewConfig = {
    visible_property_ids?: number[];
    widths?: Record<string, number>;
    preview?: 'cover' | 'body' | 'none';
    filters?: Filter[];
    sorts?: Sort[];
};
export type DatabasePageProps = {
    workspace: { id: number; name: string };
    database: {
        id: number;
        title: string;
        parent_id: number | null;
        icon: string | null;
        cover_attachment_id: number | null;
        icon_attachment_id: number | null;
    };
    properties: Property[];
    documents: DatabaseDocument[];
    values: Value[];
    views: Record<string, ViewConfig>;
    candidates: Candidate[];
    fileReferences: FileReference[];
    errors: Record<string, string>;
};
