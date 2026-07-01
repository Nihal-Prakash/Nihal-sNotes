import { getCollection, type CollectionEntry } from 'astro:content';
import notesMetadataData from '../data/notes-metadata.json';
import topicsData from '../data/topics.json';

type RawNote = CollectionEntry<'notes'>;

type NoteMetadata = {
  title?: string;
  topic?: string;
  tags?: string[];
  summary?: string;
  pinned?: boolean;
  order?: number;
  hidden?: boolean;
  coverImage?: string;
  icon?: string;
  reviewNeeded?: boolean;
};

export type TopicDefinition = {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon?: string;
};

export type MergedNote = Omit<RawNote, 'data'> & {
  data: RawNote['data'] & {
    title: string;
    slug: string;
    topic: string;
    tags: string[];
    summary: string;
    pinned: boolean;
    order: number;
    hidden: boolean;
    coverImage?: string;
    icon?: string;
    reviewNeeded: boolean;
  };
};

const notesMetadata = notesMetadataData as Record<string, NoteMetadata>;
const topics = (topicsData as TopicDefinition[])
  .map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    order: toNumber(topic.order, 999),
    icon: topic.icon ?? '',
  }))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function getTopics(): TopicDefinition[] {
  return topics;
}

export function getTopicBySlug(slug: string): TopicDefinition | undefined {
  return topics.find((topic) => topic.slug === slug);
}

export async function getMergedNotes(options: { includeHidden?: boolean } = {}): Promise<MergedNote[]> {
  const rawNotes = await getCollection('notes');
  const merged = rawNotes.map(mergeNote).sort(compareNotesPinnedOrderTitle);
  return options.includeHidden ? merged : merged.filter((note) => !note.data.hidden);
}

export function mergeNote(note: RawNote): MergedNote {
  const slug = note.data.slug || note.id.replace(/\.(md|mdx)$/i, '');
  const metadata = notesMetadata[slug] ?? {};
  const title = text(metadata.title) || text(note.data.title) || titleFromSlug(slug);
  const topic = text(metadata.topic) || text(note.data.topic) || '';

  return {
    ...note,
    data: {
      ...note.data,
      title,
      slug,
      topic,
      tags: stringArray(metadata.tags ?? note.data.tags ?? []),
      summary: text(metadata.summary) || text(note.data.summary) || `Notes for ${title}.`,
      pinned: toBoolean(metadata.pinned ?? note.data.pinned, false),
      order: toNumber(metadata.order ?? note.data.order, 999),
      hidden: toBoolean(metadata.hidden ?? note.data.hidden, false),
      coverImage: text(metadata.coverImage ?? note.data.coverImage) || undefined,
      icon: text(metadata.icon ?? note.data.icon) || undefined,
      reviewNeeded: toBoolean(metadata.reviewNeeded ?? note.data.reviewNeeded, false),
      sourceType: note.data.sourceType ?? 'markdown',
      sourcePath: note.data.sourcePath ?? '',
      createdAt: toDate(note.data.createdAt),
      updatedAt: toDate(note.data.updatedAt),
    },
  } as MergedNote;
}

export function compareNotesPinnedOrderTitle(a: MergedNote, b: MergedNote) {
  if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
  if (a.data.order !== b.data.order) return a.data.order - b.data.order;
  return a.data.title.localeCompare(b.data.title);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const date = new Date(String(value || Date.now()));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
