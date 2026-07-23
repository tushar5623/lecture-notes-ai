// Shared entrance timing for the hero sequence:
// Logo -> Navbar controls -> Heading -> Description -> Search bar -> Tags
// Each step is ~80-100ms after the previous one, per the premium-SaaS entrance spec.
export const HERO_DELAYS = {
  logo: 0,
  navbar: 0.08,
  heading: 0.17,
  description: 0.25,
  searchbar: 0.33,
  tags: 0.41,
}

const EASE_OUT = [0.16, 1, 0.3, 1]

// A fade-up variant: opacity 0 -> 1, translateY 20px -> 0, ~500ms ease-out.
// `delay` is in seconds. Only transform/opacity are animated so it stays GPU-accelerated.
export function fadeUpVariant(delay = 0, duration = 0.5) {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: EASE_OUT },
    },
  }
}

// Scroll-reveal variant used with whileInView. Slightly larger travel distance
// since these sections are further down the page.
export function scrollFadeUpVariant(delay = 0, duration = 0.55) {
  return {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, delay, ease: EASE_OUT },
    },
  }
}

// Stagger container for groups of children (e.g. feature cards) revealed together.
export function staggerContainer(staggerChildren = 0.09, delayChildren = 0) {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren },
    },
  }
}
