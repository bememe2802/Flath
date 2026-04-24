import { getInitials } from '@/src/lib/presentation'

type UserAvatarProps = {
  src?: string | null
  name: string
  className?: string
  fallbackClassName?: string
}

export default function UserAvatar({
  src,
  name,
  className = 'size-11',
  fallbackClassName = 'bg-slate-900 text-sm text-white'
}: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      className={`${className} ${fallbackClassName} flex items-center justify-center rounded-full font-semibold`}
    >
      {getInitials(name)}
    </span>
  )
}
