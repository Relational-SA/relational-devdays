import { ApplicationRef, Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastController } from '@ionic/angular';
import { concat, filter, first, interval } from 'rxjs';

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Keeps long-running installs (the pinned booth tablets) on the latest deployed version:
 * polls for a new build and offers a reload once it has been downloaded.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);
  private readonly toasts = inject(ToastController);

  start(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Start polling only once the app is stable, otherwise the timer keeps it from ever stabilising.
    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
    concat(appIsStable$, interval(UPDATE_CHECK_INTERVAL_MS)).subscribe(() => {
      // Offline at the venue is expected; the next poll retries.
      this.swUpdate.checkForUpdate().catch(() => undefined);
    });

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => void this.offerReload());

    // The cached version can no longer be served (e.g. evicted assets): only a reload recovers.
    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());
  }

  private async offerReload(): Promise<void> {
    const toast = await this.toasts.create({
      message: 'A new version of the app is available.',
      position: 'bottom',
      buttons: [{ text: 'Reload', handler: () => document.location.reload() }],
    });
    await toast.present();
  }
}
