/**
 * Returns a semantic component-label class in dev builds so you can locate
 * DOM nodes in DevTools. Always returns '' in production → zero bytes shipped.
 */
export function dc(component: string): string {
  return import.meta.env.DEV ? `__${component}` : '';
}
