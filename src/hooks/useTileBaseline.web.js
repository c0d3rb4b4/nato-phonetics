import { useLayoutEffect, useRef, useState } from 'react';

/** Browser boxes retain their CSS coordinates; native Yoga origin correction
 * is unnecessary here. @param {string} _key @param {number} nominalY */
export function useTileOrigin(_key, nominalY) {
  return { origin: nominalY, onLayout: undefined };
}

/** @param {string} key @param {number} target */
export function useTileBaseline(key, target) {
  const textRef = useRef(/** @type {import('react-native').Text | null} */ (null));
  const [measurement, setMeasurement] = useState({ key: '', baseline: 0 });
  useLayoutEffect(() => {
    const node = /** @type {HTMLElement | null} */ (/** @type {unknown} */ (textRef.current));
    if (!node) return;
    // The empty inline box's bottom lies on the actual browser line baseline.
    // Both rectangles include the existing translation, so subtracting them
    // measures unshifted typography and cannot cause an adjustment loop.
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline';
    node.append(marker);
    const baseline = marker.getBoundingClientRect().top - node.getBoundingClientRect().top;
    marker.remove();
    setMeasurement(previous => previous.key === key && previous.baseline === baseline ? previous : { key, baseline });
  }, [key]);
  return { offset: measurement.key === key ? target - measurement.baseline : 0, onTextLayout: undefined, textRef };
}
