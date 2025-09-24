import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { ComponentType } from 'svelte';

export async function renderComponent<T extends Record<string, any>>(
  component: ComponentType,
  props: T = {} as T
) {
  const result = render(component, { props });
  await tick(); // Wait for initial render
  return result;
}

export function fireEvent(
  element: Element,
  event: string,
  options: CustomEventInit = {}
) {
  const evt = new CustomEvent(event, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
  
  element.dispatchEvent(evt);
  return evt;
}
