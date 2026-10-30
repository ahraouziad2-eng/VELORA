import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation, useParams, NavigateFunction, Location as Loc, Params } from 'react-router-dom';

type Href = string | { pathname: string; params?: Record<string, string> };

function resolveHref(href: Href): string {
  if (typeof href === 'string') return href;
  let path = href.pathname;
  const queryParams: Record<string, string> = {};
  if (href.params) {
    for (const [k, v] of Object.entries(href.params)) {
      const placeholder = `[${k}]`;
      if (path.includes(placeholder)) {
        path = path.replace(placeholder, v);
      } else {
        queryParams[k] = v;
      }
    }
  }
  const query = new URLSearchParams(queryParams).toString();
  return query ? `${path}?${query}` : path;
}

function normalizePath(path: string): string {
  let result = path;
  if (result === '/(tabs)') result = '/home';
  result = result.replace('/(tabs)', '');
  result = result.replace('/(auth)', '/auth');
  result = result.replace('/land/[id]', '/land/:id');
  result = result.replace('/messages/[id]', '/messages/:id');
  result = result.replace('/request/[type]', '/request/:type');
  return result;
}

let _navigate: NavigateFunction | null = null;

function getNavigate(): NavigateFunction {
  if (!_navigate) {
    throw new Error('Router not initialized: ExpoRouterProvider must wrap the app.');
  }
  return _navigate;
}

interface RouterContextValue {
  push: (href: Href) => void;
  replace: (href: Href) => void;
  back: () => void;
  navigate: NavigateFunction;
  location: Loc;
  params: Readonly<Params<string>>;
  setParams: (p: Record<string, string>) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function ExpoRouterProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  React.useEffect(() => {
    _navigate = navigate;
    return () => { _navigate = null; };
  }, [navigate]);

  const push = useCallback((href: Href) => {
    navigate(normalizePath(resolveHref(href)));
  }, [navigate]);

  const replace = useCallback((href: Href) => {
    navigate(normalizePath(resolveHref(href)), { replace: true });
  }, [navigate]);

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const value = useMemo<RouterContextValue>(() => ({
    push, replace, back, navigate, location, params, setParams: () => {},
  }), [push, replace, back, navigate, location, params]);

  return React.createElement(RouterContext.Provider, { value }, children);
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within ExpoRouterProvider');
  return ctx;
}

export const router = {
  push: (href: Href) => {
    const nav = getNavigate();
    nav(normalizePath(resolveHref(href)));
  },
  replace: (href: Href) => {
    const nav = getNavigate();
    nav(normalizePath(resolveHref(href)), { replace: true });
  },
  back: () => {
    const nav = getNavigate();
    nav(-1);
  },
};

export function useLocalSearchParams<T = Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  const pathParams = useParams();
  const search = ctx?.location?.search || '';
  const searchParams = new URLSearchParams(search);
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(pathParams)) {
    if (v !== undefined) result[k] = v;
  }
  searchParams.forEach((v, k) => {
    result[k] = v;
  });
  return result as unknown as T;
}

export function Redirect({ href }: { href: Href }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(normalizePath(resolveHref(href)), { replace: true });
  }, []);
  return null;
}

export function Link({ href, children, ...rest }: { href: Href; children: ReactNode } & Record<string, any>) {
  const navigate = useNavigate();
  return React.createElement('a', {
    ...rest,
    href: normalizePath(resolveHref(href)),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(normalizePath(resolveHref(href)));
    },
  }, children);
}

export function Stack({ children, screenOptions, ...rest }: any) {
  return React.createElement(React.Fragment, null, children);
}

Stack.Screen = function StackScreen(_props: any) {
  return null;
};

export function Tabs({ children, screenOptions, ...rest }: any) {
  return React.createElement(React.Fragment, null, children);
}

Tabs.Screen = function TabsScreen(_props: any) {
  return null;
};

export const useFocusEffect = React.useEffect;

export const usePathname = () => {
  const ctx = useContext(RouterContext);
  return ctx?.location?.pathname || '';
};

export const useSegments = () => {
  const ctx = useContext(RouterContext);
  const path = ctx?.location?.pathname || '';
  return path.split('/').filter(Boolean);
};
