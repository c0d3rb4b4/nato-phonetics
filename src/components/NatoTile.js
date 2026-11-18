import { createContext, useContext, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTileEnvironment } from '../hooks/useTileEnvironment';
import { useTileBaseline, useTileOrigin } from '../hooks/useTileBaseline';
import { tileTextUnits } from '../lib/tileTextUnits';
import { TILE_DESIGN as D, tileScale } from '../lib/tileDesign';

const TileEnvironment = createContext({ fontScale: 1, textScale: 1, ready: false, error: '', contextScale: 1 });

/** @param {{children: import('react').ReactNode, testID?: string, contextScale?: number}} props */
export function TileGrid({ children, testID, contextScale = 1 }) {
  const environment = useTileEnvironment();
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  return <View testID={testID} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.gridContainer}>
    {environment.error ? <Text accessibilityRole="alert" style={{ color: theme.colors.text }}>{environment.error}</Text>
      : !environment.ready ? <Text style={{ color: theme.colors.text }}>Loading tile fonts…</Text>
        : <ScrollView horizontal showsHorizontalScrollIndicator
          contentContainerStyle={{ minWidth: width }} style={styles.horizontal}>
          <TileEnvironment.Provider value={{ ...environment, contextScale }}>
            <View style={[styles.grid, { width: Math.max(width, D.width * tileScale(contextScale, environment.fontScale)) }]}>{children}</View>
          </TileEnvironment.Provider>
        </ScrollView>}
  </View>;
}

/**
 * @param {{entry: import('../types').LetterEntry | import('../types').DigitEntry,
 * concealed?: boolean, current?: boolean, testID?: string, symbolTestID?: string,
 * bodyTestID?: string, onPress?: () => void, accessibilityLabel?: string,
 * accessibilityHint?: string}} props
 */
export function NatoTile({ entry, concealed = false, current = false, testID,
  symbolTestID, bodyTestID, onPress, accessibilityLabel, accessibilityHint }) {
  const environment = useContext(TileEnvironment);
  const [focused, setFocused] = useState(false);
  const contextScale = environment.contextScale;
  const symbol = 'letter' in entry ? entry.letter : entry.digit;
  const id = testID || `tile-${symbol}`;
  const scale = tileScale(contextScale, environment.fontScale);
  const geometryKey = String(scale);
  const headerOrigin = useTileOrigin(geometryKey, 0);
  const bodyOrigin = useTileOrigin(geometryKey, D.headerHeight * scale);
  const contents = <>
    <View testID={`${id}-header`} onLayout={headerOrigin.onLayout} style={{ height: D.headerHeight * scale,
      borderBottomWidth: D.divider * scale, borderBottomColor: D.colors.divider }}>
      <TileText metric={D.letter} scale={scale} contextScale={contextScale} fontScale={environment.fontScale}
        testID={`${id}-letter`} runTestID={symbolTestID} parentY={headerOrigin.origin}
        accessibilityLabel={concealed ? `Symbol ${symbol}` : undefined}>{symbol}</TileText>
    </View>
    <View testID={!concealed && bodyTestID ? bodyTestID : `${id}-body`} onLayout={bodyOrigin.onLayout}
      style={{ height: (D.height - D.headerHeight) * scale }}>
      {!concealed && <>
        <TileText metric={D.word} scale={scale} contextScale={contextScale} fontScale={environment.fontScale}
          testID={`${id}-word`} parentY={bodyOrigin.origin}>{entry.word}</TileText>
        <TileText metric={D.pronunciation} scale={scale} contextScale={contextScale} fontScale={environment.fontScale}
          testID={`${id}-pronunciation`} parentY={bodyOrigin.origin}>{entry.pronunciation}</TileText>
      </>}
    </View>
  </>;
  const geometry = { width: D.width * scale, height: D.height * scale, borderRadius: D.radius * scale,
    backgroundColor: entry.color, flexGrow: 0, flexShrink: 0, overflow: /** @type {'hidden'} */ ('hidden') };
  // An internal border conveys focus/press without changing palette contrast
  // or geometry. Opacity dimming would fail small-guide contrast on pale tiles.
  const webProps = Platform.OS === 'web' ? { dataSet: { natoTile: 'v1', tileScale: String(scale) } } : {};
  return onPress ? <Pressable testID={id} {...webProps} accessibilityRole="button"
    aria-pressed={current}
    accessibilityState={{ selected: current }}
    accessibilityLabel={accessibilityLabel || `Play ${entry.word}`}
    accessibilityHint={accessibilityHint || `${entry.pronunciation}. Replaces current audio.`}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={geometry}>{({ pressed }) => <>{contents}{(focused || pressed || current) &&
      <View testID={`${id}-interaction-ring`} pointerEvents="none" style={[StyleSheet.absoluteFill,
        { borderWidth: focused || current ? 3 : 2, borderColor: D.colors.text, borderRadius: D.radius * scale }]} />}</>}</Pressable>
    : <View testID={id} {...webProps} style={geometry}>{contents}</View>;
}

/** @param {{metric: typeof D.letter | typeof D.word | typeof D.pronunciation,
 * scale: number, contextScale: number, fontScale: number, testID: string, parentY: number,
 * runTestID?: string, accessibilityLabel?: string, children: string}} props */
function TileText({ metric, scale, contextScale, fontScale, testID, parentY, runTestID, accessibilityLabel, children }) {
  const fontSize = tileTextUnits(metric.size, contextScale, fontScale);
  const lineHeight = tileTextUnits(metric.height, contextScale, fontScale);
  const key = `${children}:${fontSize}:${lineHeight}:${scale}`;
  const boxY = (metric.y - (metric === D.letter ? 0 : D.headerHeight)) * scale;
  // Geometry remains valid when a quiz changes its letter without relaying out
  // the box. Keep its key independent from text and native typography events.
  const boxOrigin = useTileOrigin(`${scale}:${metric.y}`, boxY);
  const { offset, onTextLayout, textRef } = useTileBaseline(key,
    metric.baseline * scale - parentY - boxOrigin.origin);
  return <View testID={testID} onLayout={boxOrigin.onLayout} style={{ position: 'absolute', left: metric.x * scale,
    top: boxY,
    width: metric.width * scale, height: metric.height * scale }}>
    <Text testID={runTestID || `${testID}-run`} ref={textRef} onTextLayout={onTextLayout}
      accessibilityLabel={accessibilityLabel} allowFontScaling
      style={{ position: 'absolute', left: 0, top: 0, width: metric.width * scale, height: metric.height * scale,
        fontFamily: metric.family, fontSize, lineHeight,
        fontWeight: /** @type {'800' | '600' | '400'} */ (metric.weight),
        fontStyle: metric === D.pronunciation ? 'italic' : 'normal', letterSpacing: 0,
        textAlign: 'center', includeFontPadding: false,
        color: metric === D.pronunciation ? D.colors.guide : D.colors.text,
        transform: [{ translateY: offset }],
      }}>{children}</Text>
  </View>;
}

const styles = StyleSheet.create({
  gridContainer: { width: '100%', flexShrink: 0 },
  horizontal: { flexGrow: 0, flexShrink: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', justifyContent: 'center', gap: 12, paddingBottom: 4 },
});
