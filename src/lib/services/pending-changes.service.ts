/**
 * localStorage helper that persists pending (offline) markdown edits per list
 * until they are successfully synced with the server.
 *
 * Key format: `coursify:pending:<listId>`
 */

const KEY_PREFIX = 'coursify:pending:';

export interface PendingChange {
    markdown: string;
    /** Unix ms timestamp of when the change was saved locally. */
    savedAt: number;
}

/** Return the pending change for a list, or null if none exists. */
export function getPendingChange(listId: string): PendingChange | null {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + listId);
        if (!raw) return null;
        return JSON.parse(raw) as PendingChange;
    } catch {
        return null;
    }
}

/** Persist a pending markdown change for a list. */
export function persistPendingChange(listId: string, markdown: string): void {
    try {
        const change: PendingChange = { markdown, savedAt: Date.now() };
        localStorage.setItem(KEY_PREFIX + listId, JSON.stringify(change));
    } catch {
        // localStorage may be unavailable (private browsing quota, etc.)
    }
}

/** Remove the pending change once it has been successfully synced. */
export function clearPendingChange(listId: string): void {
    try {
        localStorage.removeItem(KEY_PREFIX + listId);
    } catch {
        // noop
    }
}

/** Return every pending change currently stored in localStorage. */
export function getAllPendingChanges(): Array<{ listId: string; change: PendingChange }> {
    const results: Array<{ listId: string; change: PendingChange }> = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key?.startsWith(KEY_PREFIX)) continue;
            const listId = key.slice(KEY_PREFIX.length);
            const change = getPendingChange(listId);
            if (change) results.push({ listId, change });
        }
    } catch {
        // noop
    }
    return results;
}

/**
 * Push every locally-pending markdown change to the server via the
 * `?/saveMarkdown` form action.
 *
 * Returns the number of lists successfully synced.
 */
export async function syncAllPendingChanges(): Promise<number> {
    const pending = getAllPendingChanges();
    if (pending.length === 0) return 0;

    const results = await Promise.all(
        pending.map(async ({ listId, change }) => {
            try {
                const body = new URLSearchParams({ markdown: change.markdown });
                const res = await fetch(`/lists/${listId}?/saveMarkdown`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });
                if (res.ok) {
                    clearPendingChange(listId);
                    return true;
                }
                return false;
            } catch {
                // Network still unavailable or server error — keep the localStorage
                // entry so the next reconnect can retry.
                return false;
            }
        })
    );

    return results.filter(Boolean).length;
}
