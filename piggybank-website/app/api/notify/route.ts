import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getFieldValue } from '@/lib/firebase-admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const db = await getAdminDb()
    const FieldValue = await getFieldValue()
    const docId = email.replace(/[^a-z0-9@._+-]/g, '_')
    const ref = db.collection('launchNotify').doc(docId)

    await ref.set(
      {
        email,
        source: 'coming-soon',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/notify]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
