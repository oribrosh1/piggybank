import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'You\'re Invited!';
    const type = searchParams.get('type') || 'birthday';
    const date = searchParams.get('date') || '';
    const host = searchParams.get('host') || '';

    // Get emoji based on type
    const emoji = type === 'birthday' ? '🎂' :
        type === 'barMitzvah' ? '📖' :
            type === 'batMitzvah' ? '📖' : '🎉';

    // Get colors based on type
    const gradientFrom = type === 'birthday' ? '#FBBF24' :
        type === 'barMitzvah' ? '#3B82F6' :
            type === 'batMitzvah' ? '#EC4899' : '#8B5CF6';

    const gradientTo = type === 'birthday' ? '#F59E0B' :
        type === 'barMitzvah' ? '#2563EB' :
            type === 'batMitzvah' ? '#DB2777' : '#7C3AED';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {/* Decorative circles */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-80px',
                        left: '-80px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                    }}
                />

                {/* Main content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '40px',
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '12px 24px',
                            borderRadius: '50px',
                            marginBottom: '24px',
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>✨</span>
                        <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>
                            You&apos;re Invited!
                        </span>
                    </div>

                    {/* Emoji */}
                    <span style={{ fontSize: '120px', marginBottom: '16px' }}>{emoji}</span>

                    {/* Title */}
                    <h1
                        style={{
                            fontSize: '56px',
                            fontWeight: 900,
                            color: 'white',
                            textAlign: 'center',
                            margin: 0,
                            marginBottom: '12px',
                            maxWidth: '800px',
                        }}
                    >
                        {title}
                    </h1>

                    {/* Host */}
                    {host && (
                        <p
                            style={{
                                fontSize: '28px',
                                color: 'rgba(255,255,255,0.9)',
                                margin: 0,
                                marginBottom: '16px',
                            }}
                        >
                            Hosted by {host}
                        </p>
                    )}

                    {/* Date */}
                    {date && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'white',
                                padding: '16px 32px',
                                borderRadius: '20px',
                                marginTop: '16px',
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>📅</span>
                            <span style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>
                                {date}
                            </span>
                        </div>
                    )}

                    {/* CreditKid branding */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '40px',
                        }}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ fontSize: '28px' }}></span>
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                            CreditKid
                        </span>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}

