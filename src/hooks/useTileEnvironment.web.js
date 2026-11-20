import { useEffect, useState } from 'react';
import extraBold from '../../assets/fonts/NatoTile-ExtraBold.ttf';
import semiBold from '../../assets/fonts/NatoTile-SemiBold.ttf';
import italic from '../../assets/fonts/NatoTile-Italic.ttf';

/** @type {Promise<void> | undefined} */
let fontLoad;
function loadFonts() {
  if (!fontLoad) fontLoad = Promise.all([
    ['NatoTile-ExtraBold', extraBold, '800', 'normal'],
    ['NatoTile-SemiBold', semiBold, '600', 'normal'],
    ['NatoTile-Italic', italic, '400', 'italic'],
  ].map(async ([family, url, weight, style]) => {
    const face = new FontFace(family, `url("${url}")`, { weight, style, display: 'block' });
    await face.load();
    /** @type {FontFaceSet & {add(face: FontFace): void}} */ (document.fonts).add(face);
    if (face.status !== 'loaded') throw new Error(`Unable to load ${family}`);
  })).then(() => {});
  return fontLoad;
}

export function useTileEnvironment() {
  const [fontScale, setFontScale] = useState(() => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void loadFonts().then(() => { if (active) setReady(true); }, () => {
      if (active) setError('Tile fonts could not load. Reload this page to try again.');
    });
    // A rem probe follows browser default text size and explicit root text zoom.
    // Its geometry is independent of rendered tile text, avoiding feedback loops.
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1rem;height:1rem;pointer-events:none;visibility:hidden';
    document.body.append(probe);
    const update = () => setFontScale(probe.getBoundingClientRect().width / 16);
    const observer = new ResizeObserver(update);
    observer.observe(probe);
    update();
    return () => { active = false; observer.disconnect(); probe.remove(); };
  }, []);
  return { fontScale, textScale: fontScale, ready, error };
}
