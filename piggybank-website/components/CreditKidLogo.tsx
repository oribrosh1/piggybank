import Image from 'next/image'
import Link from 'next/link'
import { LOGO_PATH, SITE_NAME } from '@/lib/site'

type CreditKidLogoProps = {
  href?: string | null
  height?: number
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function CreditKidLogo({
  href = '/',
  height = 36,
  className = '',
  imageClassName = '',
  priority = false,
}: CreditKidLogoProps) {
  const logo = (
    <Image
      src={LOGO_PATH}
      alt={SITE_NAME}
      width={height * 3}
      height={height}
      className={`w-auto object-contain ${imageClassName}`}
      style={{ height }}
      priority={priority}
    />
  )

  if (href === null) {
    return <span className={`inline-flex items-center ${className}`}>{logo}</span>
  }

  return (
    <Link href={href} className={`inline-flex items-center no-underline ${className}`}>
      {logo}
    </Link>
  )
}
