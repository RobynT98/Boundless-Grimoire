export type FieldType = 'text' | 'longtext' | 'number' | 'select' | 'date';

export interface CollectionField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface Collection {
  id: string;
  name: string;
  icon?: string;
  fields: CollectionField[];
}

export interface Entry {
  id: string;
  collectionId: string;
  title: string;
  contentMD: string;
  tags: string[];
  images: string[];                // dataURL: enkla inline-bilder (räcker fint i IndexedDB)
  relatedIds: string[];            // relationer till andra poster
  custom: Record<string, string | number | boolean | null>;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  theme: 'dark' | 'light' | 'parchment';
  language: 'sv' | 'en';
}