export type ThemeColor =
  | 'emerald'
  | 'blue'
  | 'yellow'
  | 'teal'
  | 'pink'
  | 'purple'
  | 'orange';

export const TYPE_SLUGS = [
  'phu-kien-ong-nuoc-dat-hoa-loai-day',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong',
  'ong-nuoc-dat-hoa',
  'ong-nuoc-van-phuoc',
  'ong-nhua-deo',
  'luoi',
  'day-bo',
] as const;

export type TypeSlug = (typeof TYPE_SLUGS)[number];

/** type slug -> theme color */
export const TYPE_TO_THEME_COLOR: Record<TypeSlug, ThemeColor> = {
  'phu-kien-ong-nuoc-dat-hoa-loai-day': 'emerald',
  'phu-kien-ong-nuoc-dat-hoa-loai-mong': 'blue',
  'ong-nuoc-van-phuoc': 'yellow',
  'ong-nuoc-dat-hoa': 'teal',
  'ong-nhua-deo': 'pink',
  'luoi': 'purple',
  'day-bo': 'orange',
};

export const themeColorClasses = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    borderLight: 'border-emerald-100',
    focus: 'focus:ring-emerald-500 focus:border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    linkCard: 'bg-emerald-50 border border-emerald-100 hover:border-emerald-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    borderLight: 'border-blue-100',
    focus: 'focus:ring-blue-500 focus:border-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    linkCard: 'bg-blue-50 border border-blue-100 hover:border-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    borderLight: 'border-yellow-100',
    focus: 'focus:ring-yellow-500 focus:border-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800',
    linkCard: 'bg-yellow-50 border border-yellow-100 hover:border-yellow-500',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    borderLight: 'border-teal-100',
    focus: 'focus:ring-teal-500 focus:border-teal-500',
    badge: 'bg-teal-100 text-teal-800',
    linkCard: 'bg-teal-50 border border-teal-100 hover:border-teal-500',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    borderLight: 'border-pink-100',
    focus: 'focus:ring-pink-500 focus:border-pink-500',
    badge: 'bg-pink-100 text-pink-800',
    linkCard: 'bg-pink-50 border border-pink-100 hover:border-pink-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    borderLight: 'border-purple-100',
    focus: 'focus:ring-purple-500 focus:border-purple-500',
    badge: 'bg-purple-100 text-purple-800',
    linkCard: 'bg-purple-50 border border-purple-100 hover:border-purple-500',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    borderLight: 'border-orange-100',
    focus: 'focus:ring-orange-500 focus:border-orange-500',
    badge: 'bg-orange-100 text-orange-800',
    linkCard: 'bg-orange-50 border border-orange-100 hover:border-orange-500',
  },
} as const;
