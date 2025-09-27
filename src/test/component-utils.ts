import { vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { ComponentType } from 'svelte';

/**
 * Renders a Svelte component with the given props and waits for it to be fully mounted.
 * @param component - The Svelte component to render
 * @param props - Optional props to pass to the component
 * @returns The result of the render function with additional helper methods
 */
export async function renderComponent<T extends Record<string, any>>(
  component: ComponentType,
  props: T = {} as T
) {
  const result = render(component, { props });
  await tick(); // Wait for initial render
  return result;
}

/**
 * Fires a custom event on an element and waits for the next tick.
 * @param element - The element to fire the event on
 * @param event - The name of the event to fire
 * @param options - Optional event options
 * @returns A promise that resolves after the event has been processed
 */
export async function fireEventAndWait(
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
  await tick();
  return evt;
}

/**
 * Waits for an element to appear in the DOM.
 * @param selector - The selector to find the element
 * @param options - Optional timeout and container
 * @returns A promise that resolves with the element when found
 */
export async function waitForElement(
  selector: string,
  options: { timeout?: number; container?: HTMLElement } = {}
) {
  const { timeout = 1000, container = document.body } = options;
  
  return waitFor(
    () => {
      const element = container.querySelector(selector);
      if (!element) {
        throw new Error(`Element with selector "${selector}" not found`);
      }
      return element;
    },
    { timeout, container }
  );
}

/**
 * Mocks the browser's clipboard API.
 * @returns An object with the mock implementation and test helpers
 */
export function mockClipboard() {
  const clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  };
  
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    writable: true,
  });
  
  return {
    /** The mock clipboard implementation */
    mock: clipboard,
    /** Simulate writing to the clipboard */
    async simulateWrite(text: string) {
      clipboard.writeText.mockResolvedValueOnce(undefined);
      await navigator.clipboard.writeText(text);
    },
    /** Simulate reading from the clipboard */
    async simulateRead(text: string) {
      clipboard.readText.mockResolvedValueOnce(text);
      return navigator.clipboard.readText();
    },
  };
}

/**
 * Mocks the browser's localStorage API.
 * @returns An object with the mock implementation and test helpers
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};
  
  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  return {
    /** The mock localStorage implementation */
    mock: localStorageMock,
    /** The current store content */
    store,
    /** Reset the mock */
    reset() {
      Object.keys(store).forEach((key) => delete store[key]);
      Object.values(localStorageMock).forEach((fn: any) => fn.mockClear?.());
    },
  };
}

// Re-export testing library utilities
export { render, fireEvent, screen, waitFor, within } from '@testing-library/svelte';
