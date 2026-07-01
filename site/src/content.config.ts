import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const noteSourceTypes = ['markdown', 'html', 'manual'] as const;

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1),
    topic: z.string().min(1).optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    summary: z.string().optional().default(''),
    pinned: z.boolean().optional().default(false),
    order: z.number().int().nonnegative().optional().default(999),
    hidden: z.boolean().optional().default(false),
    coverImage: z.string().optional().default(''),
    icon: z.string().optional().default(''),
    reviewNeeded: z.boolean().optional().default(false),
    sourceType: z.enum(noteSourceTypes).optional().default('markdown'),
    sourcePath: z.string().optional().default(''),
    createdAt: z.coerce.date().optional().default(new Date()),
    updatedAt: z.coerce.date().optional().default(new Date()),
  }),
});

export const collections = { notes };
