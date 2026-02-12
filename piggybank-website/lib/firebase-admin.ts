/**
 * Firebase Admin - lazy loaded so it is not required at Next.js build time.
 * Uses only FIREBASE_SERVICE_ACCOUNT_KEY from env (JSON string). No hardcoded credentials.
 */

import type { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;
let initPromise: Promise<{ db: Firestore; FieldValue: typeof import('firebase-admin/firestore').FieldValue }> | null = null;

async function initAdmin(): Promise<{ db: Firestore; FieldValue: typeof import('firebase-admin/firestore').FieldValue }> {
    if (db !== null && initPromise !== null) {
        const resolved = await initPromise;
        return resolved;
    }
    if (initPromise === null) {
        initPromise = (async () => {
            const { initializeApp, getApps, cert } = await import('firebase-admin/app');
            const firestoreMod = await import('firebase-admin/firestore');
            const { getFirestore } = firestoreMod;

            if (getApps().length === 0) {
                const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
                console.log('FIREBASE_SERVICE_ACCOUNT_KEY', key);
                if (key) {
                    let serviceAccount: object;
                    try {
                        serviceAccount = JSON.parse(key);
                    } catch {
                        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON');
                    }
                    initializeApp({
                        credential: cert(serviceAccount as any),
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    });
                } else {
                    initializeApp({
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    });
                }
            }
            db = getFirestore();
            return { db, FieldValue: firestoreMod.FieldValue };
        })();
    }
    return initPromise;
}

export async function getAdminDb(): Promise<Firestore> {
    const { db: resolvedDb } = await initAdmin();
    return resolvedDb;
}

export async function getFieldValue(): Promise<typeof import('firebase-admin/firestore').FieldValue> {
    const { FieldValue } = await initAdmin();
    return FieldValue;
}
