import { createHash, timingSafeEqual } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { JWT_SECRET, PASSPHRASE_HASH } from '$env/static/private';

export const AUTH_COOKIE_NAME = 'auth_token';
const JWT_EXPIRY = '30d';

// ── Passphrase ────────────────────────────────────────────────────────────────

/**
 * Hash a passphrase with SHA-256.
 * Use this once to generate the value to store in PASSPHRASE_HASH.
 */
export function hashPassphrase(passphrase: string): string {
    return createHash('sha256').update(passphrase).digest('hex');
}

/**
 * Timing-safe comparison between the submitted passphrase and the stored hash.
 */
export function verifyPassphrase(passphrase: string): boolean {
    try {
        const submitted = Buffer.from(hashPassphrase(passphrase), 'hex');
        const stored = Buffer.from(PASSPHRASE_HASH, 'hex');
        if (submitted.length !== stored.length) return false;
        return timingSafeEqual(submitted, stored);
    } catch {
        return false;
    }
}

// ── JWT ───────────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
    return new TextEncoder().encode(JWT_SECRET);
}

/** Create a signed JWT token. */
export async function createToken(): Promise<string> {
    return new SignJWT({ authenticated: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(getSecret());
}

/** Verify a JWT token. Returns true if valid, false otherwise. */
export async function verifyToken(token: string): Promise<boolean> {
    try {
        const result = await jwtVerify(token, getSecret());
        return result.payload.authenticated === true;
    } catch {
        return false;
    }
}
