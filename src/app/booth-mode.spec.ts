import { TestBed } from '@angular/core/testing';
import { BoothMode } from './booth-mode';

describe('BoothMode', () => {
  afterEach(() => {
    vi.useRealTimers();
    history.replaceState(null, '', '/');
    document.body.classList.remove('booth');
    document.head.querySelector('meta[name="viewport"]')?.remove();
  });

  it('stays off in a browser tab', () => {
    const booth = TestBed.inject(BoothMode);
    booth.start();

    expect(booth.active).toBe(false);
    expect(document.body.classList).not.toContain('booth');
  });

  it('turns on with ?booth: no zoom and no long-press menu', () => {
    history.replaceState(null, '', '/?booth');
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1';
    document.head.append(viewport);

    const booth = TestBed.inject(BoothMode);
    booth.start();
    const menu = new MouseEvent('contextmenu', { cancelable: true });
    document.dispatchEvent(menu);

    expect(booth.active).toBe(true);
    expect(document.body.classList).toContain('booth');
    expect(viewport.content).toBe(
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    );
    expect(menu.defaultPrevented).toBe(true);
  });

  it('reports a minute without input, and every tap starts the minute again', () => {
    vi.useFakeTimers();
    const idle = vi.fn();
    const stop = TestBed.inject(BoothMode).onIdle(60_000, idle);

    vi.advanceTimersByTime(59_000);
    document.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(59_000);
    expect(idle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(idle).toHaveBeenCalledOnce();

    stop();
    document.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(120_000);
    expect(idle).toHaveBeenCalledOnce();
  });
});
