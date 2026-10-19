import { DOCUMENT, Injectable, inject } from '@angular/core';

/** Input that counts as someone using the tablet. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown'] as const;

const STORAGE_KEY = 'relational-devdays.booth';

/**
 * The booth tablets run the installed app full screen; visitors' phones open it from the QR code,
 * in the browser or installed. On the tablets the app keeps the screen on, blocks zooming and the
 * long-press menu, and pages can return to their start when nobody is using it.
 *
 * Booth mode belongs to the device, not to the installed app: `?booth` in the address switches it
 * on and the device remembers it, so the app installed on a tablet keeps it (on Android it shares
 * the browser's storage). `?booth=off` switches it off again.
 */
@Injectable({ providedIn: 'root' })
export class BoothMode {
  private readonly document = inject(DOCUMENT);

  readonly active = this.detect();

  start(): void {
    if (!this.active) {
      return;
    }
    this.document.body.classList.add('booth');
    this.blockZoom();
    this.document.addEventListener('contextmenu', (event) => event.preventDefault());
    void this.keepAwake();
    // The browser releases the wake lock whenever the app is hidden; take it again on return.
    this.document.addEventListener('visibilitychange', () => void this.keepAwake());
  }

  /** Calls `callback` after `ms` without input; returns a function that stops watching. */
  onIdle(ms: number, callback: () => void): () => void {
    let timer = setTimeout(callback, ms);
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(callback, ms);
    };
    for (const type of ACTIVITY_EVENTS) {
      this.document.addEventListener(type, restart, { capture: true, passive: true });
    }
    return () => {
      clearTimeout(timer);
      for (const type of ACTIVITY_EVENTS) {
        this.document.removeEventListener(type, restart, { capture: true });
      }
    };
  }

  private detect(): boolean {
    const window = this.document.defaultView;
    if (!window) {
      return false;
    }
    const asked = new URLSearchParams(window.location.search).get('booth');
    if (asked === null) {
      return remembered(window);
    }
    const on = asked !== 'off';
    remember(window, on);
    return on;
  }

  /** Pinch zoom is also blocked in CSS (`body.booth` in styles.scss). */
  private blockZoom(): void {
    const viewport = this.document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewport) {
      viewport.content += ', maximum-scale=1, user-scalable=no';
    }
  }

  private async keepAwake(): Promise<void> {
    const wakeLock = this.document.defaultView?.navigator.wakeLock;
    if (!wakeLock || this.document.visibilityState !== 'visible') {
      return;
    }
    try {
      await wakeLock.request('screen');
    } catch {
      // Refused, e.g. in battery saver: the tablet's own screen timeout applies.
    }
  }
}

function remembered(window: Window): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function remember(window: Window, on: boolean): void {
  try {
    if (on) {
      window.localStorage.setItem(STORAGE_KEY, 'on');
      // Asks the browser to keep this setting and the offline copy when space runs low.
      window.navigator.storage?.persist?.().catch(() => undefined);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage blocked (e.g. a private window): booth mode only while the address has `?booth`.
  }
}
