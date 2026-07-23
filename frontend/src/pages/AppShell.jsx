// Host for the ported app.
//
// The screens lay out with absolute-positioned overlays (the nav bar, the ambient
// background pools), so they need a fixed-size, clipped stage rather than a document that
// grows. That stage is simply the viewport: the app is phone-sized on a phone and
// desktop-sized on a desktop, adapting at the breakpoint shared by src/native/native.css
// and SegmentedTabBar.tsx.
import { useEffect } from 'react'
import MobileApp from '../mobile/MobileApp'
import './app-shell.css'

export default function AppShell() {
  // The app owns the viewport while it is mounted — its scrolling happens inside
  // ScrollViews, so the document itself must not scroll or rubber-band.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="app-shell">
      <MobileApp />
    </div>
  )
}
