import { db } from '$lib/server/db';
import { lists, type List } from '$lib/server/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

export const getAllLists = async () => {
    return await db
        .select()
        .from(lists)
        .where(eq(lists.is_template, false))
        .orderBy(
            sql`CASE WHEN ${lists.status} = 'ongoing' THEN 0 ELSE 1 END`,
            desc(lists.created_at)
        );
};

export const getAllTemplates = async () => {
    return await db
        .select()
        .from(lists)
        .where(eq(lists.is_template, true))
        .orderBy(desc(lists.created_at));
};

export const getListById = async (id: string) => {
    const results = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
    return results[0] ?? null;
};

/**
 * Extracts unchecked checkbox items from a Markdown string.
 * Matches lines of the form `- [ ] ...`
 */
function extractUncheckedItems(markdown: string): string[] {
    return markdown.split('\n').filter((line) => /^- \[ \]/.test(line));
}

function formatListHeader(title: string, created_at: Date | null): string {
    const date = created_at
        ? new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(new Date(created_at))
        : null;
    return date ? `## Pas achetés — ${title} du ${date}` : `## Pas achetés — ${title}`;
}

export interface LastDoneListInfo {
    title: string;
    created_at: Date | null;
    uncheckedItems: string[];
}

/**
 * Returns info about the most recently modified done list, including its unchecked items.
 * Used to populate the confirmation dialog before creating a list.
 */
export const getLastDoneListInfo = async (): Promise<LastDoneListInfo | null> => {
    const results = await db
        .select()
        .from(lists)
        .where(and(eq(lists.is_template, false), eq(lists.status, 'done')))
        .orderBy(desc(lists.updated_at))
        .limit(1);

    const lastList = results[0] ?? null;
    if (!lastList) return null;
    return {
        title: lastList.title,
        created_at: lastList.created_at,
        uncheckedItems: extractUncheckedItems(lastList.markdown)
    };
};

export const createList = async (
    title: string = 'Nouvelle liste',
    includeUnchecked: boolean = false
) => {
    let markdown = '';

    if (includeUnchecked) {
        const lastDoneList = await getLastDoneListInfo();
        if (lastDoneList && lastDoneList.uncheckedItems.length > 0) {
            const header = formatListHeader(lastDoneList.title, lastDoneList.created_at);
            markdown = header + '\n' + lastDoneList.uncheckedItems.join('\n');
        }
    }

    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown,
            is_template: false,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};

export const createTemplate = async (title: string = 'Nouveau modèle') => {
    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown: '',
            is_template: true,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};

export const updateList = async (
    id: string,
    data: Partial<Pick<List, 'title' | 'status' | 'markdown'>>
) => {
    const [updated] = await db
        .update(lists)
        .set({ ...data, updated_at: new Date() })
        .where(eq(lists.id, id))
        .returning();
    return updated ?? null;
};

export const deleteList = async (id: string) => {
    const [deleted] = await db
        .delete(lists)
        .where(eq(lists.id, id))
        .returning();
    return deleted ?? null;
};

export const createListFromTemplate = async (
    templateId: string,
    title: string = 'Nouvelle liste',
    includeUnchecked: boolean = true
) => {
    const template = await getListById(templateId);
    if (!template || !template.is_template) {
        throw new Error('Template introuvable');
    }

    let markdown = template.markdown;

    if (includeUnchecked) {
        const lastDoneList = await getLastDoneListInfo();
        if (lastDoneList && lastDoneList.uncheckedItems.length > 0) {
            const header = formatListHeader(lastDoneList.title, lastDoneList.created_at);
            const section = '\n\n' + header + '\n' + lastDoneList.uncheckedItems.join('\n');
            markdown = markdown + section;
        }
    }

    const [created] = await db
        .insert(lists)
        .values({
            title,
            status: 'ongoing',
            markdown,
            is_template: false,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();
    return created;
};