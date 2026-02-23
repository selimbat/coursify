/**
 * Centralised online/offline connectivity service.
 *
 * - Registers a single pair of browser event listeners for the whole app.
 * - On reconnection, automatically syncs all locally-pending changes and
 *   exposes the result as reactive state so any component can react.
 *
 * Usage:
 *   // In root layout onMount (once):
 *   offlineService.init();
 *
 *   // Subscribe to connectivity changes from any component:
 *   const unsub = offlineService.onOnline(() => { ... });
 *   // Unsubscribe in component cleanup (return from onMount / onDestroy).
 *
 *   // Reactive reads:
 *   offlineService.isOnline          → boolean
 *   offlineService.reconnectInfo     → ReconnectInfo
 */

import { syncAllPendingChanges } from './pending-changes.service';

type Callback = () => void;

export type ReconnectStatus = 'idle' | 'syncing' | 'synced';

export interface ReconnectInfo {
    status: ReconnectStatus;
    /** Number of lists successfully pushed to the server on last reconnect. */
    syncedCount: number;
}

class OfflineService {
    #isOnline = $state(true);
    #reconnectInfo = $state<ReconnectInfo>({ status: 'idle', syncedCount: 0 });
    #onlineCallbacks = new Set<Callback>();
    #offlineCallbacks = new Set<Callback>();
    #resetTimer: ReturnType<typeof setTimeout> | null = null;

    /** Reactive online flag. */
    get isOnline(): boolean {
        return this.#isOnline;
    }

    /**
     * Reactive reconnect feedback.
     * `status` transitions: idle → syncing → synced → (auto-reset after 4 s) → idle.
     */
    get reconnectInfo(): ReconnectInfo {
        return this.#reconnectInfo;
    }

    /**
     * Register a callback that fires when the browser regains connectivity
     * (fires synchronously before the async sync starts).
     * Returns an unsubscribe function.
     */
    onOnline(cb: Callback): () => void {
        this.#onlineCallbacks.add(cb);
        return () => this.#onlineCallbacks.delete(cb);
    }

    /**
     * Register a callback that fires when the browser loses connectivity.
     * Returns an unsubscribe function.
     */
    onOffline(cb: Callback): () => void {
        this.#offlineCallbacks.add(cb);
        return () => this.#offlineCallbacks.delete(cb);
    }

    /**
     * Attach browser event listeners. Call once from the root layout's onMount.
     * If the app starts online, any locally-pending changes are synced immediately.
     */
    init(): void {
        if (typeof window === 'undefined') return;
        this.#isOnline = navigator.onLine;
        window.addEventListener('online', this.#handleOnline);
        window.addEventListener('offline', this.#handleOffline);

        // Sync pending changes on startup if we are already online.
        if (navigator.onLine) {
            this.#syncPending();
        }
    }

    readonly #syncPending = (): void => {
        this.#reconnectInfo = { status: 'syncing', syncedCount: 0 };
        syncAllPendingChanges().then((syncedCount) => {
            if (syncedCount > 0) {
                this.#reconnectInfo = { status: 'synced', syncedCount };
                if (this.#resetTimer) clearTimeout(this.#resetTimer);
                this.#resetTimer = setTimeout(() => {
                    this.#reconnectInfo = { status: 'idle', syncedCount: 0 };
                    this.#resetTimer = null;
                }, 4000);
            } else {
                this.#reconnectInfo = { status: 'idle', syncedCount: 0 };
            }
        });
    };

    readonly #handleOnline = (): void => {
        this.#isOnline = true;

        // Notify component-level subscribers first (e.g. ListDetails submits its form).
        for (const cb of this.#onlineCallbacks) cb();

        // Kick off global sync for all pending changes across all lists.
        this.#syncPending();
    };

    readonly #handleOffline = (): void => {
        this.#isOnline = false;

        // Cancel any pending success-reset timer.
        if (this.#resetTimer) {
            clearTimeout(this.#resetTimer);
            this.#resetTimer = null;
        }
        this.#reconnectInfo = { status: 'idle', syncedCount: 0 };

        for (const cb of this.#offlineCallbacks) cb();
    };
}

export const offlineService = new OfflineService();

