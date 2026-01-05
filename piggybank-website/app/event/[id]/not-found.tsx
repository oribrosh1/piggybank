import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl mb-6">🎈</div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">
                    Event Not Found
                </h1>
                <p className="text-gray-600 mb-8">
                    Oops! This event might have ended or the link is incorrect.
                    Check with the host for the correct invitation link.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                    Go to PiggyBank Home
                </Link>
            </div>
        </main>
    );
}

