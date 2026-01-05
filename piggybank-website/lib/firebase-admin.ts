import { initializeApp, getApps, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function initAdmin() {
    if (getApps().length === 0) {
        // For local development, use service account
        // For production (Vercel), use environment variables
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            console.log('DEBUG: FIREBASE_SERVICE_ACCOUNT_KEY first 100 chars:', rawKey.substring(0, 100));
            console.log('DEBUG: FIREBASE_SERVICE_ACCOUNT_KEY length:', rawKey.length);
            const serviceAccount: ServiceAccount = ({
                projectId: "piggybank-a0011",
                privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjkr6qlXIDUR9W\nKYk2kWUUfRXOi7pjy5wQlR/H7i96JVVhAlf8MzgrnD19kB7WMg5vc/OzxKSXamse\nqAkZf32xFyUi+1b0r8XDH0xFaK3L9mhHO0w51lzdTOH9z2knWddPcLoNeYD/HoZM\n1ll+6momu53uRf56Bo8Tp/FxJ6/Csww8GdeFDWWXBVNK79SuldRdoIe1twmvTS7y\nVuEc7/JYtZ22H+ozoUPGVqoJB1jfVCIroCasTvkNyGwY4G9Ys5PdrLMIOVCogEGy\nIv1tfMACe+venCu/xlNfU5AN6ED4v0XUo5PFIJGhajBnTcEsFv92TzQfvjfqBbOk\ncC3mE4/VAgMBAAECggEACsN2wXHZEUfOyJQuH8WcgacjfrZqGvQEfoDZmQXe4OpA\n/oOxd3qFWTVMRI1twgmEMqhOIoevjvklOFy1UJS3mCYePvmMBMjmOgs+sRiMyy2Z\nOgq4Xtvwu206N8HkuP6r8OHJlGZo6yC+lKLMO9JADvFsmIfJkY0J8DCubhQ++BBG\nBemAoSnln3Zj1+SKOUOUZrbNTUDQ95imPd/oClHY+pR9x9Q5IaneHmP+iY3o3BCz\n4WoAjhZZ/3vcM2d+6fMecTKvTsblTizclwQNzCJoSO4UmO20KHE+B7Ywu8SXi7yr\nBVPwAluGvaxsbRHRkzQyOcc7G0u69bboRL546paJIQKBgQDkz6ATnaXttTOz1v2u\neGqKENaJiNRsGyNcDqoOUSKoSiP6o/NMzVdaWtpUSdKnpjBHtKBqDNTrHNfnnndN\n15J/NwS8LJCKmkFB37tX+gN4BEtG6lI11X9N37E+og3KoVQXZ1bYz7vR9DaWase6\nxh+gpITvsmbd6H9mCAl/jkUIBQKBgQC3Apn3gnT8Yxv0vWJOtVW5d9gmXD/Uu0a2\nknVp60ze8SCALTat2YLS0TJBSy9xnjNhPXREUeVRLcO/Ufknl6Am8gnpai0WXmAT\n+5Bo3FM8GbZi0vgBe2yZdj3hWQQlStnRQg6HPImEkcvM8wpsjzyXTeO9lYJu9tFO\n96BuWMoBkQKBgAeH4d/jZ2usdBguMklEw1Tp+vWp4DvypLZJ8UTpXLenQQnlzYMw\nmvhpVxhBGcLU0G/7vO/gnj1ixKRl7c1NFBBF0k0TNmqpaw5s+7CIlQalNYkO+0e0\nUC1S+HV0RfnuV2MxzoTySV8+p3FJ8GrwTGgwIgP1njcdiNvl1dIx74m1AoGAHaXN\nPZyjyRNhPwfDOk8EITS6DpTZPmRMc11MqikVXfSgOEOa3RUkrXR4eL1uZTCk0Db9\nc+f0h28ri/4CqBhXOJfzZR3vSfVmCTay0VoIHe9obaARz2OoV0AhjDU4h7YVjWHv\nKpdzC8f2xTAGW0nlHfnfUCI9bC6OAAX7toSpzRECgYEAnMj17IYgi8Uzl+eknz79\n98RfwDbZWhnxVIIDXP5NRnYv2Ejyx9OZ3A6r3IopLS8xMKftkthwg7IQYuc0wqR7\nbhF6BPr9beE+7iD4zw53steP24Tl+D6HC6HMbVHimBjgTgR8TfXNYIhFLVAr8tWs\nLRUmbReelbtzS6W5gd3LBtc=\n-----END PRIVATE KEY-----\n",
                clientEmail: "firebase-adminsdk-fbsvc@piggybank-a0011.iam.gserviceaccount.com",
            });

            // Fix escaped newlines in private_key (common issue with .env files)
            app = initializeApp({
                credential: cert(serviceAccount),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        } else {
            // Fallback for development - requires GOOGLE_APPLICATION_CREDENTIALS env var
            app = initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        }
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    return { app, db };
}

export function getAdminDb() {
    if (!db) {
        initAdmin();
    }
    return db;
}

export { app, db };

