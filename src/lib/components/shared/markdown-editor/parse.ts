import { marked } from 'marked';

export type ParsedLine =
    | { type: 'checkbox'; checked: boolean; html: string }
    | { type: 'heading'; level: number; html: string }
    | { type: 'listItem'; html: string }
    | { type: 'empty' }
    | { type: 'text'; html: string };

export const headingClasses: Record<number, string> = {
    1: 'text-2xl font-bold tracking-tight mt-5 mb-1',
    2: 'text-xl font-semibold tracking-tight mt-4 mb-0.5',
    3: 'text-lg font-semibold mt-3',
    4: 'text-base font-semibold mt-2',
    5: 'text-sm font-semibold mt-2',
    6: 'text-xs font-semibold mt-2'
};

// Inline markdown only; block structure is handled by the editor layout.
export function parseLine(line: string): ParsedLine {
    const trimmed = line.trim();
    if (!trimmed) return { type: 'empty' };

    const checkbox = trimmed.match(/^[-*]\s+\[([xX ])\]\s*(.*)$/);
    if (checkbox) {
        return {
            type: 'checkbox',
            checked: checkbox[1].toLowerCase() === 'x',
            html: marked.parseInline(checkbox[2]) as string
        };
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
        return {
            type: 'heading',
            level: heading[1].length,
            html: marked.parseInline(heading[2]) as string
        };
    }

    const listItem = trimmed.match(/^[-*]\s+(.+)$/);
    if (listItem) {
        return { type: 'listItem', html: marked.parseInline(listItem[1]) as string };
    }

    return { type: 'text', html: marked.parseInline(trimmed) as string };
}
