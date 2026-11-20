import { useLayoutEffect, useMemo, useState } from 'react';

/** Reject callbacks retained by a previous geometry or unmounted view.
 * @param {string} key */
function useLayoutKey(key) {
  // A new token is also required when a scale changes 1 -> 2 -> 1: an event
  // retained from the first 1 must not become current during the second 1.
  const generation = useMemo(() => ({ key, active: false }), [key]);
  useLayoutEffect(() => {
    generation.active = true;
    return () => { generation.active = false; };
  }, [generation]);
  return generation;
}

/** Native Yoga rounds each box origin to physical pixels. Retain its actual
 * parent-relative origin so the inner run can target the whole tile baseline.
 * @param {string} key @param {number} nominalY */
export function useTileOrigin(key, nominalY) {
  const [layout, setLayout] = useState({ key: '', y: 0,
    generation: /** @type {{active: boolean} | null} */ (null) });
  const generation = useLayoutKey(key);
  /** @param {import('react-native').LayoutChangeEvent} event */
  const onLayout = event => {
    const y = event.nativeEvent.layout.y;
    if (!generation.active || !Number.isFinite(y)) return;
    setLayout(previous => previous.generation === generation && previous.y === y ? previous : { key, y, generation });
  };
  return { origin: layout.generation === generation ? layout.y : nominalY, onLayout };
}

/** Align the measured single-line baseline without changing its outer box.
 * @param {string} key @param {number} target */
export function useTileBaseline(key, target) {
  const [measurement, setMeasurement] = useState({ key: '', baseline: 0,
    generation: /** @type {{active: boolean} | null} */ (null) });
  const generation = useLayoutKey(key);
  /** @param {import('react-native').TextLayoutEvent} event */
  const onTextLayout = event => {
    const line = event.nativeEvent.lines[0];
    if (!generation.active || !line) return;
    const baseline = line.y + line.ascender;
    if (!Number.isFinite(baseline)) return;
    setMeasurement(previous => previous.generation === generation && previous.baseline === baseline
      ? previous : { key, baseline, generation });
  };
  // Only Text is translated. The measured parent and outer box do not move,
  // so updating this offset cannot feed back into their layout measurements.
  return { offset: measurement.generation === generation ? target - measurement.baseline : 0,
    onTextLayout, textRef: undefined };
}
