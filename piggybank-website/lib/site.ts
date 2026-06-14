import type { Metadata } from 'next'
import { WEBSITE_URL } from '@/lib/legal'

export const SITE_NAME = 'CreditKid'
export const SITE_URL = WEBSITE_URL
export const LOGO_PATH = '/logo/logo.png'
export const DEFAULT_TITLE = 'The New Standard for Birthday Gifts'
export const DEFAULT_DESCRIPTION =
  'Give your child a virtual debit card for his gifts they can use anywhere. No more unused gift cards sitting in drawers. Just real freedom.'
export const SITE_KEYWORDS = [
  'creditkid',
  'birthday gift wallet',
  'kids events',
  'SMS invites',
  'gift registry',
  'parent controls',
  'Apple Pay kids',
  'birthday RSVP',
  'digital gifts',
]

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function logoUrl(): string {
  return absoluteUrl(LOGO_PATH)
}

const defaultOpenGraphImage = {
  url: LOGO_PATH,
  width: 512,
  height: 512,
  alt: `${SITE_NAME} logo`,
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: LOGO_PATH,
    apple: LOGO_PATH,
    shortcut: LOGO_PATH,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [defaultOpenGraphImage],
  },
  twitter: {
    card: 'summary',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [LOGO_PATH],
  },
}

type OgImage = NonNullable<Metadata['openGraph']>['images']

type PageMetadataOptions = {
  title: string
  description: string
  path?: string
  /** Override default logo OG image (e.g. dynamic event poster). */
  images?: OgImage
  robots?: Metadata['robots']
}

function normalizeOgImages(images?: OgImage) {
  if (!images) return [defaultOpenGraphImage]
  if (Array.isArray(images)) return images
  return [images]
}

export function pageMetadata({
  title,
  description,
  path,
  images,
  robots,
}: PageMetadataOptions): Metadata {
  const pageTitle = title
  const url = path ? absoluteUrl(path) : SITE_URL
  const ogImages = normalizeOgImages(images)
  const firstImage = ogImages[0]
  const twitterImages = ogImages
    .map((image) => {
      if (typeof image === 'string') return image
      if (image instanceof URL) return image
      return image.url
    })
    .filter((imageUrl): imageUrl is string | URL => Boolean(imageUrl))

  const useLargeTwitterCard =
    typeof firstImage === 'object' &&
    firstImage !== null &&
    'width' in firstImage &&
    typeof firstImage.width === 'number' &&
    firstImage.width > 600

  return {
    title: pageTitle,
    description,
    ...(robots ? { robots } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url,
      title: pageTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: useLargeTwitterCard ? 'summary_large_image' : 'summary',
      title: pageTitle,
      description,
      images: twitterImages,
    },
  }
}
