export type ActiveUser = 'user_a' | 'user_b';
export const ACTIVE_USERS: ActiveUser[] = ['user_a', 'user_b'];

const STORAGE_KEY = 'active_user';

class UserService {
    #user = $state<ActiveUser | null>(null);

    get activeUser(): ActiveUser | null {
        return this.#user;
    }

    /** Hydrate from localStorage — call once in onMount. */
    init(): void {
        if (typeof localStorage === 'undefined') return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && ACTIVE_USERS.includes(stored as ActiveUser)) {
            this.#user = stored as ActiveUser;
        }
    }

    setActiveUser(user: ActiveUser): void {
        this.#user = user;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, user);
        }
    }
}

export const userService = new UserService();
