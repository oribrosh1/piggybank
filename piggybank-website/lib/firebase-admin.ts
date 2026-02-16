/**
 * Firebase Admin - lazy loaded so it is not required at Next.js build time.
 *
 * Auth (pick one):
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (env) – JSON string of the service account key. Use for local/dev or any host.
 * 2. No key – Uses Application Default Credentials (ADC). Works on Google Cloud (Cloud Run, App Engine, GCE,
 *    Cloud Functions) with the runtime’s default service account. Locally: run
 *    `gcloud auth application-default login` first.
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
                const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
                if (key?.startsWith('"""') && key.endsWith('"""')) key = key.slice(3, -3).trim();
                if (key) {
                    let serviceAccount: object;
                    try {
                        serviceAccount = JSON.parse(key);
                    } catch {
                        // Fallback: init with project from client env; will use Application Default Credentials
                        console.warn('[lib/firebase-admin.ts]: FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON, initializing with projectId only (ADC)');
                        console.log(key);
                        console.log(projectId);
                        console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
                        initializeApp({
                            projectId: projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                        });
                        db = getFirestore();
                        return { db, FieldValue: firestoreMod.FieldValue };
                    }
                    initializeApp({
                        credential: cert(serviceAccount as any),
                        projectId,
                    });
                } else {
                    // No key: use Application Default Credentials (GCP or gcloud auth application-default login)
                    initializeApp({
                        projectId: projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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
