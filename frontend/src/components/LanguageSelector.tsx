'use client'

import { Globe } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type SupportedLocale = 'vi' | 'en'

const LOCALE_STORAGE_KEY = 'flath-locale'

const localeLabels: Record<SupportedLocale, string> = {
    vi: 'Tiếng Việt',
    en: 'English'
}

function readStoredLocale(): SupportedLocale {
    if (typeof window === 'undefined') return 'vi'
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'vi') return stored
    return 'vi'
}

function writeStoredLocale(locale: SupportedLocale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

export function getCurrentLocale(): SupportedLocale {
    return readStoredLocale()
}

export default function LanguageSelector() {
    const [locale, setLocale] = useState<SupportedLocale>('vi')

    useEffect(() => {
        setLocale(readStoredLocale())
    }, [])

    const handleChange = useCallback((newLocale: SupportedLocale) => {
        setLocale(newLocale)
        writeStoredLocale(newLocale)
    }, [])

    return (
        <div className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" />
            <select
                value={locale}
                onChange={(e) => handleChange(e.target.value as SupportedLocale)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground outline-none"
            >
                {(Object.entries(localeLabels) as [SupportedLocale, string][]).map(
                    ([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    )
                )}
            </select>
        </div>
    )
}