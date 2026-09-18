import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useT } from './i18n'

const assetPathPrefix = '/assets'
const imgScrollHint = `${assetPathPrefix}/c171b.svg`
const imgDragHandle = `${assetPathPrefix}/f5c65.svg`
const imgAIEdit = `${assetPathPrefix}/cc3b8.svg`
const imgBlockIcon = `${assetPathPrefix}/dff49.svg`
const imgDragDrop = `${assetPathPrefix}/41d03.svg`
const imgAIStar = `${assetPathPrefix}/e0407.svg`
const imgLock = `${assetPathPrefix}/6f09b.svg`
const imgSpeedometer = `${assetPathPrefix}/5f064.svg`
const imgCoin = `${assetPathPrefix}/4212c.svg`
const imgMarkdown = `${assetPathPrefix}/86076.svg`
const imgFilter = `${assetPathPrefix}/71e06.svg`
const imgDownload = `${assetPathPrefix}/d236f.svg`
const imgTerminal = `${assetPathPrefix}/08277.svg`
const imgGlobe = `${assetPathPrefix}/e8d06.svg`
const imgGithub = `${assetPathPrefix}/8586f.svg`
const imgEmail = `${assetPathPrefix}/6005d.svg`

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function mapRange(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin
  const t = clamp((val - inMin) / (inMax - inMin), 0, 1)
  return outMin + t * (outMax - outMin)
}

function MaskIcon({ src, w, h, color }: { src: string; w: number; h: number; color: string }) {
  const mask = `url(${src})`
  return (
    <span
      style={{
        display: 'inline-block',
        width: w,
        height: h,
        backgroundColor: color,
        WebkitMaskImage: mask,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskImage: mask,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
      }}
    />
  )
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return { ref, visible }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

function RevealSection({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  )
}

export default function App() {
  const { t, locale, setLocale } = useT()
  const heroSectionRef = useRef<HTMLDivElement>(null)
  const [heroProgress, setHeroProgress] = useState(0)
  const [tVisible, setTVisible] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') return false
    if (savedTheme === 'dark') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    const id = requestAnimationFrame(() => setTVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'pt' ? 'en' : 'pt')
  }, [locale, setLocale])

  const handleScroll = useCallback(() => {
    const section = heroSectionRef.current
    if (!section) return
    const sectionTop = section.offsetTop
    const sectionHeight = section.offsetHeight
    const viewportH = window.innerHeight
    const scrollable = sectionHeight - viewportH
    if (scrollable <= 0) return
    const scrolled = window.scrollY - sectionTop
    const p = clamp(scrolled / scrollable, 0, 1)
    setHeroProgress(p)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const p = heroProgress

  // TEX + RIS rise straight up from below, fading in
  const texOpacity = mapRange(p, 0.03, 0.42, 0, 1)
  const texY = mapRange(p, 0.03, 0.42, 72, 0)

  const risOpacity = mapRange(p, 0.03, 0.42, 0, 1)
  const risY = mapRange(p, 0.03, 0.42, 72, 0)

  // Headline fades in after logo assembles
  const headlineOpacity = mapRange(p, 0.45, 0.68, 0, 1)
  const headlineY = mapRange(p, 0.45, 0.68, 16, 0)

  // Scroll hint fades out early
  const hintOpacity = mapRange(p, 0, 0.12, 1, 0)

  // Header slides down from above
  const headerOpacity = mapRange(p, 0.75, 0.96, 0, 1)
  const headerY = mapRange(p, 0.75, 0.96, -20, 0)

  // Theme colors (app tokens)
  const colors = {
    bg: 'var(--color-canvas)',
    surface: 'var(--color-surface)',
    muted: 'var(--color-muted)',
    border: 'var(--color-divider)',
    text: 'var(--color-ink)',
    textMuted: 'var(--color-ink-secondary)',
    headerBg: 'var(--color-header-bg)',
  }

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: colors.bg, color: colors.text }}>
      {/* ── FIXED HEADER ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          pointerEvents: headerOpacity > 0.5 ? 'auto' : 'none',
          backdropFilter: 'blur(12px)',
          backgroundColor: colors.headerBg,
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div style={{ display: 'flex', height: isMobile ? 56 : 64, alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 24px' : '0 48px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Bytesized', 'Inter', sans-serif", fontSize: 16, letterSpacing: '0.22em', lineHeight: '28px', color: 'var(--color-ink-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              TEXTRIS
            </span>
            {!isMobile && (
              <div style={{ backgroundColor: colors.muted, padding: '2px 6px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, letterSpacing: '0.8px', color: colors.textMuted, textTransform: 'uppercase' as const }}>
                  BYOK V1.0
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={toggleLocale}
              className="flex h-7 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, letterSpacing: '0.8px', padding: '0 6px', cursor: 'pointer', backgroundColor: 'transparent', border: 'none' }}
            >
              {locale === 'pt' ? 'EN' : 'PT'}
            </button>
            <button
              onClick={toggleDarkMode}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
              title={darkMode ? t('header.darkModeOn') : t('header.darkModeOff')}
              aria-label={darkMode ? t('header.ariaLightMode') : t('header.ariaDarkMode')}
            >
              {darkMode ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <a
              href="https://app.textris.xyz"
              className="flex h-8 items-center rounded-[4px] bg-ink px-4 text-[12px] font-medium text-canvas transition-opacity hover:opacity-90"
              style={{ textDecoration: 'none', letterSpacing: '0.04em' }}
            >
              {t('header.accessApp')}
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SCROLL SECTION ── */}
      <div
        ref={heroSectionRef}
        style={{ height: '280vh', position: 'relative' }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo assembly */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: isMobile ? 80 : 138 }}>
            {/* TEX */}
            <div
              style={{
                opacity: texOpacity,
                transform: `translateY(${texY}px)`,
                fontFamily: "'Bytesized', 'Inter', sans-serif",
                fontSize: isMobile ? 64 : 112,
                lineHeight: isMobile ? '64px' : '112px',
                color: colors.text,
                letterSpacing: '-0.4px',
                userSelect: 'none' as const,
                willChange: 'transform, opacity',
              }}
            >
              TEX
            </div>

            {/* Central T — fades in on load */}
            <div
              style={{
                fontFamily: "'Bytesized', 'Inter', sans-serif",
                fontSize: isMobile ? 72 : 124,
                lineHeight: isMobile ? '72px' : '124px',
                color: colors.text,
                letterSpacing: isMobile ? '-4px' : '-6.2px',
                userSelect: 'none' as const,
                padding: '0 8px',
                opacity: tVisible ? 1 : 0,
                transition: 'opacity 1s ease',
              }}
            >
              T
            </div>

            {/* RIS */}
            <div
              style={{
                opacity: risOpacity,
                transform: `translateY(${risY}px)`,
                fontFamily: "'Bytesized', 'Inter', sans-serif",
                fontSize: isMobile ? 64 : 112,
                lineHeight: isMobile ? '64px' : '112px',
                color: colors.text,
                letterSpacing: '-0.4px',
                userSelect: 'none' as const,
                willChange: 'transform, opacity',
              }}
            >
              RIS
            </div>
          </div>

          {/* Headline revealed after assembly */}
          <div
            style={{
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              marginTop: isMobile ? 16 : 24,
              maxWidth: 618,
              textAlign: 'center' as const,
              padding: '0 24px',
              willChange: 'transform, opacity',
            }}
          >
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontSize: isMobile ? 20 : 32,
                lineHeight: isMobile ? '24px' : '36px',
                color: colors.text,
                letterSpacing: '-0.5px',
                margin: 0,
                width: '100%',
              }}
            >
              {t('hero.headline')}
            </p>
          </div>

          {/* Scroll hint */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: hintOpacity,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap' as const,
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <img src={imgScrollHint} alt="" style={{ width: 8.17, height: 11.67 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                {t('hero.scrollHint')}
              </span>
            </div>
            <div style={{ width: 64, height: 4, backgroundColor: colors.border, borderRadius: 12 }} />
          </div>
        </div>
      </div>

      {/* ── PRODUCT SHOWCASE ── */}
      <RevealSection className="flex flex-col gap-12 items-start w-full" style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '64px 24px' : '96px 48px' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1184 }}>
          <div style={{ backgroundColor: colors.muted, padding: '4px 10px', display: 'inline-block' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
              {t('showcase.tag')}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: isMobile ? 20 : 28,
              lineHeight: isMobile ? '28px' : '36px',
              color: colors.text,
              letterSpacing: '-0.7px',
              margin: 0,
            }}
          >
            {t('showcase.title')}
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: isMobile ? 16 : 18,
              lineHeight: isMobile ? '24px' : '30px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            {t('showcase.description')}
          </p>
        </div>

        {/* Editor simulation */}
        <div
          style={{
            backgroundColor: colors.surface,
            boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)',
            borderRadius: 8,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: '100%',
          }}
        >
          {/* Top ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontFamily: "'Bytesized', 'Inter', sans-serif", fontSize: 16, color: colors.text, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
              TEXTRIS
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px', cursor: 'pointer' }}>
              {t('showcase.configIA')}
            </span>
          </div>

          {/* Writing blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 768, margin: '0 auto', width: '100%', padding: '16px 0' }}>
            {/* Block 01 */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
                borderRadius: 4,
                padding: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: colors.textMuted, lineHeight: '20px', paddingTop: 4 }}>01</span>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: colors.text, margin: 0, flex: 1 }}>
                {t('showcase.block01')}
              </p>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative', height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ position: 'absolute', height: 1, left: 0, right: 0, top: 13, backgroundColor: colors.border }} />
            </div>

            {/* Block 02 */}
            <div
              style={{
                backgroundColor: colors.bg,
                boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
                borderRadius: 4,
                padding: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: colors.textMuted, lineHeight: '20px', paddingTop: 4 }}>02</span>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: colors.text, margin: 0, flex: 1 }}>
                {t('showcase.block02')}
              </p>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 6px 13px' }}>
                  <img src={imgDragHandle} alt="" style={{ width: 7.5, height: 12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 6px 13px' }}>
                  <img src={imgAIEdit} alt="" style={{ width: 15.75, height: 15.75 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div
            style={{
              backgroundColor: colors.muted,
              boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
              borderRadius: 4,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
              <button className="flex h-9 items-center gap-1 rounded-[4px] bg-ink px-4 transition-opacity hover:opacity-90" style={{ border: 'none', cursor: 'pointer' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: 'var(--color-accent)', letterSpacing: '0.48px' }}>+</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--color-canvas)', letterSpacing: '0.48px' }}>{t('showcase.newBlock')}</span>
              </button>
              {[t('showcase.copy'), t('showcase.open'), t('showcase.save'), t('showcase.exportMd'), t('showcase.exportHtml')].map(label => (
                <button key={label} className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>{label}</span>
                </button>
              ))}
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted, padding: '0 8px' }}>
              {t('showcase.activeBlocks')}
            </span>
          </div>
        </div>
      </RevealSection>

      {/* ── FEATURES GRID ── */}
      <RevealSection style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '64px 24px' : '80px 48px', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? 40 : 56 } as React.CSSProperties}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', paddingBottom: 24, width: '100%', flexWrap: 'wrap' as const, gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 672 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.text, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
              {t('features.tag')}
            </span>
            <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: isMobile ? 20 : 28, lineHeight: isMobile ? '28px' : '36px', color: colors.text, letterSpacing: '-0.7px', margin: 0 }}>
              {t('features.title')}
            </h2>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: isMobile ? 14 : 15, lineHeight: isMobile ? '20px' : '24px', color: colors.textMuted, maxWidth: 448, margin: 0 }}>
            {t('features.description')}
          </p>
        </div>

        {/* Bento grid */}
        <div className="bento-grid">
          {/* Card 1 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, minHeight: 204 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgBlockIcon} w={15} h={15} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>{t('card1.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card1.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card1.description')}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgDragDrop} w={13.33} h={16.67} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>{t('card2.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card2.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card2.description')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>⌥ Alt</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>+</span>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>↑</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>/</span>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>↓</span>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, minHeight: 204 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgAIStar} w={18.33} h={18.33} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: 'var(--color-accent)' }}>{t('card3.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card3.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card3.description')}
              </p>
            </div>
            <div style={{ backgroundColor: colors.muted, padding: '4px 12px', display: 'inline-block' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.text, letterSpacing: '0.8px' }}>{t('card3.badge')}</span>
            </div>
          </div>

          {/* Card 4 — spans 2 cols */}
          <div
            className="bento-span-left"
            style={{
              backgroundColor: 'var(--color-ink)',
              boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)',
              borderRadius: 8,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: 'var(--color-canvas)', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{t('card4.tag')}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--color-ink-muted)' }}>{t('card4.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 576 }}>
              <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, lineHeight: '28px', color: 'var(--color-canvas)', letterSpacing: '-0.5px', margin: 0 }}>
                {t('card4.title')}
              </h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: 'var(--color-ink-muted)', margin: 0 }}>
                {t('card4.description')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
              {[
                { icon: imgLock, w: 10.67, h: 14, label: t('card4.zeroTelemetry') },
                { icon: imgSpeedometer, w: 13.33, h: 10.67, label: t('card4.lowLatency') },
                { icon: imgCoin, w: 13.33, h: 12.67, label: t('card4.payPerUse') },
              ].map(({ icon, w, h, label }) => (
                <div key={label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <MaskIcon src={icon} w={w} h={h} color="var(--color-ink-muted)" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: 'var(--color-ink-muted)', letterSpacing: '0.8px' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgMarkdown} w={15} h={13.33} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>{t('card5.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card5.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card5.description')}
              </p>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}># H1 • **bold** • `code`</span>
          </div>

          {/* Card 6 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgFilter} w={15} h={15} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>{t('card6.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card6.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card6.description')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {[t('card6.synthesize'), t('card6.expand')].map(tag => (
                <span key={tag} style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Card 7 — spans 2 cols (cols 2-3) */}
          <div
            className="bento-span-right"
            style={{
              backgroundColor: colors.surface,
              boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
              borderRadius: 8,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaskIcon src={imgDownload} w={13.33} h={13.33} color={colors.text} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted }}>{t('card7.number')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 512 }}>
              <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>{t('card7.title')}</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                {t('card7.description')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              {['.markdown', '.html', 'clipboard'].map(tag => (
                <span key={tag} style={{ backgroundColor: colors.border, padding: '4px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.text }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── CREATOR SPOTLIGHT ── */}
      <RevealSection style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '64px 24px' : '96px 48px', width: '100%' } as React.CSSProperties}>
        <div
          style={{
            width: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: 'var(--color-ink)',
            boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1),0px 8px 10px -6px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: isMobile ? 24 : 48, gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: 'var(--color-accent)', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                {t('spotlight.name')}
              </span>
              <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: isMobile ? 20 : 28, lineHeight: isMobile ? '28px' : '36px', color: 'var(--color-canvas)', letterSpacing: '-0.7px', margin: 0 }}>
                {t('spotlight.headline')}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: isMobile ? 14 : 15, lineHeight: isMobile ? '20px' : '24px', color: 'var(--color-ink-muted)', margin: 0, maxWidth: 1086 }}>
                {t('spotlight.bio1')}
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: isMobile ? 12 : 13, lineHeight: isMobile ? '18px' : '21px', color: 'var(--color-ink-muted)', margin: 0, maxWidth: 1095 }}>
                {t('spotlight.bio2')}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' as const, width: '100%', borderTop: '1px solid rgba(227,226,223,0.2)', paddingTop: 17 }}>
              {[t('spotlight.badge1'), t('spotlight.badge2')].map(badge => (
                <div key={badge} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, backgroundColor: 'var(--color-accent)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: 'var(--color-ink-muted)', letterSpacing: '0.8px' }}>{badge}</span>
                </div>
              ))}
            </div>

            <a
              href="https://diogocvc.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'var(--color-accent)',
                display: 'inline-flex',
                gap: 8,
                alignItems: 'center',
                padding: '12px 20px',
                textDecoration: 'none',
                borderRadius: 4,
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: 'var(--color-canvas)', letterSpacing: '0.48px' }}>
                {t('spotlight.cta')}
              </span>
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ── CTA FINAL ── */}
      <RevealSection style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 1280, margin: '0 auto', padding: isMobile ? '64px 24px' : '80px 48px' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', maxWidth: 1024, padding: isMobile ? '64px 24px' : '80px 48px', width: '100%', textAlign: 'center' as const }}>
          <span style={{ fontFamily: "'Bytesized', 'Inter', sans-serif", fontSize: isMobile ? 24 : 34, lineHeight: '36px', color: colors.text, letterSpacing: '-0.85px' }}>
            TEXTRIS
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: isMobile ? 24 : 34, lineHeight: isMobile ? '28px' : '36px', color: colors.text, letterSpacing: '-0.85px', margin: 0 }}>
              {t('cta.title')}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? '24px' : '30px', color: colors.textMuted, margin: 0, maxWidth: 576 }}>
              {t('cta.description')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <a
              href="https://app.textris.xyz"
              className="flex h-9 items-center rounded-[4px] bg-ink px-6 text-[12px] font-medium text-canvas transition-opacity hover:opacity-90"
              style={{ textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)' }}
            >
              {t('cta.openApp')}
            </a>
            <a
              href="https://github.com/diogocvc/opencode-test"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-2 rounded-[4px] border border-divider bg-canvas px-5 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink"
              style={{ textDecoration: 'none', letterSpacing: '0.04em' }}
            >
              <img src={imgTerminal} alt="" style={{ width: 15, height: 12 }} />
              {t('cta.viewCode')}
            </a>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const, paddingTop: 24 }}>
            {[t('cta.marker1'), t('cta.marker2')].map(marker => (
              <div key={marker} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, backgroundColor: 'var(--color-ink)', borderRadius: 12 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{marker}</span>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: colors.surface, boxShadow: '0px -1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', justifyContent: 'space-between', maxWidth: 1280, margin: '0 auto', padding: isMobile ? 24 : 48, width: '100%', flexWrap: 'wrap' as const, gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: "'Bytesized', 'Inter', sans-serif", fontSize: 16, color: colors.text, letterSpacing: '-0.4px' }}>TEXTRIS</span>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0, maxWidth: 448 }}>
              {t('footer.description')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <a href="https://diogocvc.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgGlobe} alt="" style={{ width: 13.33, height: 13.33 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>diogocvc.com</span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgGithub} alt="" style={{ width: 13.33, height: 8 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>GitHub</span>
            </a>
            <a href="mailto:oi@diogocvc.com" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgEmail} alt="" style={{ width: 13.33, height: 10.67 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>oi@diogocvc.com</span>
            </a>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1280,
            margin: '0 auto',
            paddingLeft: isMobile ? 24 : 48,
            paddingRight: isMobile ? 24 : 48,
            paddingTop: 17,
            paddingBottom: 16,
            width: '100%',
            borderTop: `1px solid ${colors.border}`,
            flexWrap: 'wrap' as const,
            gap: 16,
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px' }}>
            {t('footer.copyright')}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.textMuted, letterSpacing: '0.8px' }}>
            {t('footer.crafted')}
          </span>
        </div>
      </footer>
    </div>
  )
}