import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import { primaryRoute, resolveRoute } from './routes';

const web = Platform.OS === 'web';
const historyKey = 'natoNavigationIndex';
let index = web ? Number(window.history.state?.[historyKey]) || 0 : 0;
let serial = 0;
/** @typedef {{path: import('../types').RoutePath, key: number, index: number}} RouteEntry */
/** @type {Map<number, RouteEntry>} */
const entries = new Map();
const initialPath = web ? resolveRoute(window.location.pathname) : '/';
entries.set(index, { path: initialPath, key: serial, index });
/** @type {Set<NonNullable<ReturnType<typeof primaryRoute>>>} */
const visitedTabs = new Set();
const initialTab = primaryRoute(initialPath);
if (initialTab) visitedTabs.add(initialTab);
let snapshot = { path: initialPath, key: serial, entries: [...entries.values()], tabs: [...visitedTabs] };
/** @type {Set<() => void>} */
const listeners = new Set();
/** @param {() => void} listener */
const subscribe = listener => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;

/** @param {import('../types').RoutePath} path @param {boolean} [reuse] */
function publish(path, reuse = false) {
  let entry = entries.get(index);
  if (!reuse || entry?.path !== path) {
    entry = { path, key: ++serial, index };
    entries.set(index, entry);
  }
  const tab = primaryRoute(path);
  if (tab) visitedTabs.add(tab);
  snapshot = { path, key: entry.key, entries: [...entries.values()], tabs: [...visitedTabs] };
  listeners.forEach(listener => listener());
}

/** @param {import('../types').RoutePath} path @param {boolean} replace */
function navigate(path, replace) {
  if (!replace) {
    index += 1;
    // A push after Back replaces the forward branch, just like browser history.
    for (const position of entries.keys()) if (position >= index) entries.delete(position);
  }
  if (web) window.history[replace ? 'replaceState' : 'pushState']({ [historyKey]: index }, '', path);
  publish(path);
}

export const router = {
  /** @param {import('../types').RoutePath} path */
  push: path => navigate(path, false),
  /** @param {import('../types').RoutePath} path */
  replace: path => navigate(path, true),
  canGoBack: () => index > 0,
  back: () => {
    if (!router.canGoBack()) { navigate('/', true); return; }
    if (web) window.history.back();
    else { index -= 1; publish(entries.get(index)?.path ?? '/', true); }
  },
};

export const useRouter = () => router;
export function useNavigationState() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }
export const ScreenFocusContext = createContext(true);

/** Retained screens keep form/quiz state but release audio/listeners when hidden.
 * @param {() => void | (() => void)} effect */
export function useFocusEffect(effect) {
  const focused = useContext(ScreenFocusContext);
  useEffect(() => { if (focused) return effect(); }, [effect, focused]);
}

export function useNavigationEvents() {
  useEffect(() => {
    if (web) {
      window.history.replaceState({ ...window.history.state, [historyKey]: index }, '', window.location.href);
      const pop = () => {
        index = Number(window.history.state?.[historyKey]) || 0;
        publish(resolveRoute(window.location.pathname), true);
      };
      window.addEventListener('popstate', pop);
      return () => window.removeEventListener('popstate', pop);
    }
    let active = true;
    const initialSerial = serial;
    /** @param {string | null} url @param {boolean} [initial] */
    const openLink = (url, initial = false) => {
      if (!active || !url || !/^natophonetics(?:-dev)?:\/\//i.test(url)) return;
      const path = resolveRoute(url);
      if (initial) { index = 0; entries.clear(); publish(path); }
      else navigate(path, false);
    };
    void Linking.getInitialURL().then(url => {
      // Do not overwrite navigation that happened while the OS was responding.
      if (serial === initialSerial) openLink(url, true);
    }).catch(() => {});
    const links = Linking.addEventListener('url', ({ url }) => openLink(url));
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!router.canGoBack()) return false;
      router.back();
      return true;
    });
    return () => { active = false; links.remove(); back.remove(); };
  }, []);
}
