import React, { useEffect, useRef, useState, useCallback } from 'react'

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
const imgArrow = `${assetPathPrefix}/06c9c.svg`
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

  // Theme colors
  const colors = {
    bg: darkMode ? '#1a1a1a' : '#faf9f5',
    surface: darkMode ? '#2a2a2a' : '#f5f4f0',
    muted: darkMode ? '#333333' : '#efeeea',
    border: darkMode ? '#444444' : '#e9e8e4',
    text: darkMode ? '#e0e0e0' : '#1b1c1a',
    textMuted: darkMode ? '#a0a0a0' : '#444748',
    headerBg: darkMode ? 'rgba(26,26,26,0.9)' : 'rgba(250,249,245,0.9)',
  }

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: colors.bg, color: colors.text }}>
      {/* ── THEME TOGGLE ── */}
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
        }}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

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
          boxShadow: '0px 1px 8px 0px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', height: isMobile ? 56 : 64, alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 24px' : '0 48px', maxWidth: 1280, width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Bytesized:Regular'", fontSize: isMobile ? 16 : 20, letterSpacing: '-0.5px', lineHeight: '28px', color: colors.text }}>
              TEXTRIS
            </span>
            <div style={{ backgroundColor: colors.muted, padding: '2px 6px' }}>
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, letterSpacing: '0.8px', color: colors.textMuted, textTransform: 'uppercase' as const }}>
                BYOK V1.0
              </span>
            </div>
          </div>
          <a href="https://opencode-test-two.vercel.app" style={{ backgroundColor: colors.text, padding: '8px 16px', cursor: 'pointer', textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 12, color: colors.bg, letterSpacing: '0.6px' }}>
              ACESSAR APP
            </span>
          </a>
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
                fontFamily: "'Bytesized:Regular'",
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
                fontFamily: "'Bytesized:Regular'",
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
                fontFamily: "'Bytesized:Regular'",
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
              maxWidth: 576,
              textAlign: 'center' as const,
              padding: '0 24px',
              willChange: 'transform, opacity',
            }}
          >
            <p
              style={{
                fontFamily: "'Space Mono:Bold'",
                fontWeight: 200,
                fontSize: isMobile ? 20 : 32,
                lineHeight: isMobile ? '24px' : '36px',
                color: colors.text,
                letterSpacing: '-0.5px',
                margin: 0,
                width: '100%',
              }}
            >
              Move your words to fit the perfect text.
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
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                ROLE PARA BAIXO
              </span>
            </div>
            <div style={{ width: 64, height: 4, backgroundColor: colors.border, borderRadius: 12 }} />
          </div>
        </div>
      </div>

      {/* ── PRODUCT SHOWCASE ── */}
      <RevealSection className="flex flex-col gap-12 items-start w-full" style={{ maxWidth: 1280, padding: isMobile ? '64px 24px' : '96px 48px' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 768 }}>
          <div style={{ backgroundColor: colors.muted, padding: '4px 10px', display: 'inline-block' }}>
            <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.text, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>
              INTERFACE &amp; FLUXO DE TRABALHO
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Space Mono:Bold'",
              fontSize: isMobile ? 20 : 28,
              lineHeight: isMobile ? '28px' : '36px',
              color: colors.text,
              letterSpacing: '-0.7px',
              margin: 0,
            }}
          >
            Um editor de textos para você ordenar o caos criativo.
          </h2>
          <p
            style={{
              fontFamily: "'Geist:Regular'",
              fontWeight: 400,
              fontSize: isMobile ? 16 : 18,
              lineHeight: isMobile ? '24px' : '30px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            Escreva blocos independentes conforme suas ideias surgem, reorganize a narrativa
            visualmente com drag-and-drop e deixe a inteligência artificial costurar as transições perfeitas.
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
            <span style={{ fontFamily: "'Bytesized:Regular'", fontSize: 16, color: colors.text, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
              TEXTRIS
            </span>
            <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px', cursor: 'pointer' }}>
              Configurar IA
            </span>
          </div>

          {/* Writing blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 768, margin: '0 auto', width: '100%', padding: '16px 0' }}>
            {/* Block 01 */}
            <div
              style={{
                backgroundColor: darkMode ? '#333333' : '#fff',
                boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
                borderRadius: 4,
                padding: 16,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 13, color: colors.textMuted, lineHeight: '20px', paddingTop: 4 }}>01</span>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: colors.text, margin: 0, flex: 1 }}>
                A mente humana raramente produz pensamentos em formato de ensaio corrido. Temos
                epifanias soltas, anotações de campo, argumentos fortes e conclusões antecipadas que
                precisam de encaixe sem atrito.
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
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 13, color: colors.textMuted, lineHeight: '20px', paddingTop: 4 }}>02</span>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: colors.text, margin: 0, flex: 1 }}>
                Quando quebramos a redação em peças isoladas, cada bloco adquire sua própria
                gravidade. Você move para cima, move para baixo e ajusta a cadência textual sem perder o
                raciocínio central.
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
              <button style={{ backgroundColor: colors.text, display: 'flex', gap: 4, alignItems: 'center', padding: '6px 14px', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 12, color: '#006c49', letterSpacing: '0.48px' }}>+</span>
                <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.bg, letterSpacing: '0.48px' }}>Novo bloco</span>
              </button>
              {['Copiar', 'Abrir .md', 'Salvar', 'Exportar .md', 'Exportar .html'].map(label => (
                <button key={label} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
                  <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>{label}</span>
                </button>
              ))}
            </div>
            <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted, padding: '0 8px' }}>
              2 blocos ativos • 68 palavras
            </span>
          </div>
        </div>
      </RevealSection>

      {/* ── FEATURES GRID ── */}
      <RevealSection style={{ maxWidth: 1280, padding: isMobile ? '64px 24px' : '80px 48px', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? 40 : 56 } as React.CSSProperties}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-end', justifyContent: 'space-between', paddingBottom: 24, width: '100%', flexWrap: 'wrap' as const, gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 672 }}>
            <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.text, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
              CAPACIDADES &amp; FILOSOFIA
            </span>
            <h2 style={{ fontFamily: "'Space Mono:Bold'", fontSize: isMobile ? 20 : 28, lineHeight: isMobile ? '28px' : '36px', color: colors.text, letterSpacing: '-0.7px', margin: 0 }}>
              Feito para o raciocínio não-linear.
            </h2>
          </div>
          <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: isMobile ? 14 : 15, lineHeight: isMobile ? '20px' : '24px', color: colors.textMuted, maxWidth: 448, margin: 0 }}>
            Cada detalhe de interface foi desenhado para eliminar distrações
            e devolver ao autor o controle cirúrgico de sua narrativa.
          </p>
        </div>

        {/* Bento grid */}
        <div className="bento-grid">
          {/* Card 1 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, minHeight: 204 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgBlockIcon} alt="" style={{ width: 15, height: 15 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>01 / ESTRUTURA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Escrita Modular por Blocos</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Escreva sem se preocupar com a ordem inicial. Concentre-se em capturar a matéria-prima das suas ideias antes de definir a introdução ou o desfecho.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgDragDrop} alt="" style={{ width: 13.33, height: 16.67 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>02 / FLUXO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Drag &amp; Drop &amp; Atalhos</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Reorganize parágrafos como peças num tabuleiro de Tetris. Utilize atalhos de teclado (Alt + ↑ / ↓) para deslocar parágrafos sem soltar as mãos do teclado.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'Space Mono:Bold'", fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>⌥ Alt</span>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>+</span>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'Space Mono:Bold'", fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>↑</span>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>/</span>
              <span style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'Space Mono:Bold'", fontSize: 13, color: colors.textMuted, display: 'inline-block' }}>↓</span>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, minHeight: 204 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgAIStar} alt="" style={{ width: 18.33, height: 18.33 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 13, color: '#006c49' }}>03 / CONECTOR</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Ponte de IA Contextual</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Identificou um salto abrupto entre dois pensamentos? Clique na ponte e a IA analisa o contexto anterior e posterior para gerar uma costura textual natural.
              </p>
            </div>
            <div style={{ backgroundColor: colors.muted, padding: '4px 12px', display: 'inline-block' }}>
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.text, letterSpacing: '0.8px' }}>Elimina vácuos conceituais</span>
            </div>
          </div>

          {/* Card 4 — spans 2 cols */}
          <div
            className="bento-span-left"
            style={{
              gridColumn: '1 / span 2',
              backgroundColor: '#000',
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
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: '#f5f4f0', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>ARQUITETURA SEGURA</span>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: '#858383' }}>04 / PRIVACIDADE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 576 }}>
              <h4 style={{ fontFamily: "'Space Mono:Bold'", fontSize: 20, lineHeight: '28px', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
                Privacidade Total: BYOK (Bring Your Own Key)
              </h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 15, lineHeight: '24px', color: '#e9e8e4', margin: 0 }}>
                Nenhum texto seu passa por servidores de terceiros gerenciados por nós. As requisições de IA saem do seu próprio browser diretamente para as APIs (OpenAI, Anthropic, Groq) usando suas chaves armazenadas no LocalStorage criptografado.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
              {[
                { icon: imgLock, w: 10.67, h: 14, label: 'Zero Telemetria de Conteúdo' },
                { icon: imgSpeedometer, w: 13.33, h: 10.67, label: 'Latência Reduzida' },
                { icon: imgCoin, w: 13.33, h: 12.67, label: 'Pague Apenas pelo Consumo' },
              ].map(({ icon, w, h, label }) => (
                <div key={label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <img src={icon} alt="" style={{ width: w, height: h }} />
                  <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: '#e9e8e4', letterSpacing: '0.8px' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgMarkdown} alt="" style={{ width: 15, height: 13.33 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>05 / MARKDOWN</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Markdown Puro &amp; Rico</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Títulos, ênfases, listas numeradas, blocos de código e citações preservados sem markup proprietário. Totalmente intercambiável com Obsidian e VS Code.
              </p>
            </div>
            <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}># H1 • **bold** • `code`</span>
          </div>

          {/* Card 6 */}
          <div style={{ backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgFilter} alt="" style={{ width: 15, height: 15 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>06 / REFINO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Refino &amp; Mudança de Tom</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Transforme raciocínios prolixos em parágrafos contundentes, amplie exemplos técnicos ou verifique coerência argumentativa com comandos inline rápidos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {['Sintetizar', 'Expandir'].map(tag => (
                <span key={tag} style={{ backgroundColor: colors.muted, padding: '2px 8px', fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Card 7 — spans 2 cols (cols 2-3) */}
          <div
            className="bento-span-right"
            style={{
              gridColumn: '2 / span 2',
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
              <div style={{ backgroundColor: colors.text, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imgDownload} alt="" style={{ width: 13.33, height: 13.33 }} />
              </div>
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted }}>07 / PORTABILIDADE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 512 }}>
              <h4 style={{ fontFamily: "'Geist:Bold'", fontWeight: 700, fontSize: 16, lineHeight: '24px', color: colors.text, margin: 0 }}>Portabilidade Instantânea &amp; Off-line</h4>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0 }}>
                Seu conteúdo não fica refém de uma plataforma fechada. Salve com um clique em .md, exporte páginas HTML estilizadas para publicação direta ou copie todo o texto consolidado em fração de segundos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
              {['.markdown', '.html', 'clipboard'].map(tag => (
                <span key={tag} style={{ backgroundColor: colors.border, padding: '4px 12px', fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.text }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── CREATOR SPOTLIGHT ── */}
      <RevealSection style={{ maxWidth: 1280, padding: isMobile ? '64px 24px' : '96px 48px', width: '100%' } as React.CSSProperties}>
        <div
          style={{
            width: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#000',
            boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1),0px 8px 10px -6px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: isMobile ? 24 : 48, gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: '#6cf8bb', letterSpacing: '1px', textTransform: 'uppercase' as const }}>
                DIOGO CARVALHO • PRODUCT DESIGNER &amp; PRODUCT LEADER
              </span>
              <h3 style={{ fontFamily: "'Space Mono:Bold'", fontSize: isMobile ? 20 : 28, lineHeight: isMobile ? '28px' : '36px', color: '#fff', letterSpacing: '-0.7px', margin: 0 }}>
                Construindo ferramentas para a era da IA.
              </h3>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: isMobile ? 14 : 15, lineHeight: isMobile ? '20px' : '24px', color: '#e9e8e4', margin: 0, maxWidth: 640 }}>
                "Transformo ideias complexas em produtos combinando estratégia de produto, design, tecnologia e Inteligência Artificial — desde a descoberta e sistemas até protótipos funcionais e lançamento."
              </p>
              <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: isMobile ? 12 : 13, lineHeight: isMobile ? '18px' : '21px', color: '#858383', margin: 0, maxWidth: 640 }}>
                O Textris nasceu da necessidade pessoal de Diogo Carvalho de desatar o nó entre pensamentos esparsos e publicações finais. Ao aplicar a metáfora dos blocos de encaixe e deixar a IA responsável apenas pelas costuras e atritos gramaticais, o foco volta a ser o raciocínio criativo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' as const, width: '100%', borderTop: '1px solid rgba(227,226,223,0.2)', paddingTop: 17 }}>
              {['20+ anos em Design & Produto', 'Design × Tecnologia × IA'].map(badge => (
                <div key={badge} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, backgroundColor: '#6cf8bb' }} />
                  <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: '#e9e8e4', letterSpacing: '0.8px' }}>{badge}</span>
                </div>
              ))}
            </div>

            <a
              href="https://diogocvc.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#6cf8bb',
                display: 'inline-flex',
                gap: 8,
                alignItems: 'center',
                padding: '12px 20px',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 12, color: '#00714d', letterSpacing: '0.48px' }}>
                Conhecer mais em diogocvc.com
              </span>
              <img src={imgArrow} alt="" style={{ width: 12, height: 12 }} />
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ── CTA FINAL ── */}
      <RevealSection style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: isMobile ? '64px 24px' : '80px 128px' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', maxWidth: 1024, padding: isMobile ? '64px 24px' : '80px 48px', width: '100%', textAlign: 'center' as const }}>
          <span style={{ fontFamily: "'Bytesized:Regular'", fontSize: isMobile ? 24 : 34, lineHeight: '36px', color: colors.text, letterSpacing: '-0.85px' }}>
            TEXTRIS
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'Space Mono:Bold'", fontSize: isMobile ? 24 : 34, lineHeight: isMobile ? '28px' : '36px', color: colors.text, letterSpacing: '-0.85px', margin: 0 }}>
              Pronto para encaixar suas ideias?
            </h3>
            <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: isMobile ? 16 : 18, lineHeight: isMobile ? '24px' : '30px', color: colors.textMuted, margin: 0, maxWidth: 576 }}>
              100% Gratuito &amp; Open Source — Sem cadastro obrigatório, sem
              mensalidades ocultas. Traga sua chave e comece a escrever agora mesmo.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <a href="https://opencode-test-two.vercel.app" style={{
              backgroundColor: colors.text,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: '14px 32px',
              textDecoration: 'none',
              boxShadow: '0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)',
            }}>
              <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 12, color: colors.bg, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
                ABRIR TEXTRIS NO NAVEGADOR
              </span>
            </a>
            <a href="https://github.com/diogocvc/opencode-test" target="_blank" rel="noopener noreferrer" style={{
              backgroundColor: colors.muted,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: '14px 24px',
              textDecoration: 'none',
            }}>
              <img src={imgTerminal} alt="" style={{ width: 15, height: 12 }} />
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.text, letterSpacing: '0.6px', textTransform: 'uppercase' as const }}>
                VER CÓDIGO NO GITHUB
              </span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const, paddingTop: 24 }}>
            {['RODA 100% NO SEU BROWSER', 'COMPATÍVEL COM MARKDOWN PADRÃO'].map(marker => (
              <div key={marker} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, backgroundColor: darkMode ? '#fff' : '#010101', borderRadius: 12 }} />
                <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{marker}</span>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: colors.surface, boxShadow: '0px -1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', justifyContent: 'space-between', maxWidth: 1280, padding: isMobile ? 24 : 48, width: '100%', flexWrap: 'wrap' as const, gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: "'Bytesized:Regular'", fontSize: 16, color: colors.text, letterSpacing: '-0.4px' }}>TEXTRIS</span>
            <p style={{ fontFamily: "'Geist:Regular'", fontWeight: 400, fontSize: 13, lineHeight: '20px', color: colors.textMuted, margin: 0, maxWidth: 448 }}>
              Ambiente de escrita por blocos modulares focado em fluxo, pensamento
              linear e inteligência artificial via chave própria (BYOK).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <a href="https://diogocvc.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgGlobe} alt="" style={{ width: 13.33, height: 13.33 }} />
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>diogocvc.com</span>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgGithub} alt="" style={{ width: 13.33, height: 8 }} />
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>GitHub</span>
            </a>
            <a href="mailto:oi@diogocvc.com" style={{ display: 'flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
              <img src={imgEmail} alt="" style={{ width: 13.33, height: 10.67 }} />
              <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 12, color: colors.textMuted, letterSpacing: '0.48px' }}>oi@diogocvc.com</span>
            </a>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1280,
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
          <span style={{ fontFamily: "'Space Mono:Bold'", fontSize: 10, color: colors.textMuted, letterSpacing: '0.8px' }}>
            © Textris. Arquitetura editorial minimalista.
          </span>
          <span style={{ fontFamily: "'Space Mono:Regular'", fontSize: 13, color: colors.textMuted, letterSpacing: '0.8px' }}>
            Crafted with BYOK Architecture
          </span>
        </div>
      </footer>
    </div>
  )
}