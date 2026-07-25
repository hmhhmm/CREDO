// Host for the ported app.
//
// The screens lay out with absolute-positioned overlays (the nav bar, the ambient
// background pools), so they need a fixed-size, clipped stage rather than a document that
// grows. That stage is simply the viewport: the app is phone-sized on a phone and
// desktop-sized on a desktop, adapting at the breakpoint shared by src/native/native.css
// and SegmentedTabBar.tsx.
import { useEffect, useRef } from 'react'
import MobileApp from '../mobile/MobileApp'
import './app-shell.css'

export default function AppShell() {
  const shellRef = useRef(null)

  // The app owns the viewport while it is mounted — its scrolling happens inside
  // ScrollViews, so the document itself must not scroll or rubber-band.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Nothing inside .app-shell is ever meant to scroll horizontally — each screen manages
  // its own vertical ScrollView. The stack navigator (src/native/navigation.jsx) briefly
  // renders the incoming and outgoing screen in the same layout pass while a route push
  // commits, which can momentarily double this container's content width; the browser's
  // scroll-anchoring then nudges scrollLeft to keep content in view, and that offset
  // doesn't self-correct once the width snaps back. Actively pinning scrollLeft to 0 here
  // is a blunter guarantee than relying on overflow-anchor alone (which doesn't cover
  // every path that can shift it), and is a genuine no-op the rest of the time since this
  // container should never legitimately be scrolled.
  useEffect(() => {
    const el = shellRef.current
    if (!el) return undefined
    const resetScroll = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0
    }
    el.addEventListener('scroll', resetScroll)
    const observer = new ResizeObserver(resetScroll)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', resetScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="app-shell" ref={shellRef}>
      <MobileApp />
    </div>
  )
}
