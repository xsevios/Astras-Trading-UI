import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take
} from "rxjs";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { RemoteStorageService } from "./remote-storage.service";
import {
  debounceTime,
  filter,
  map
} from "rxjs/operators";
import { TerminalSettingsDesktopMigrationManager } from "../../../modules/settings-migration/terminal-settings/terminal-settings-desktop-migration-manager";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsBrokerService {
  private readonly saveRequestDelay = 10;
  private readonly saveQuery$ = new Subject<TerminalSettings>();
  private saveStream$?: Observable<boolean>;

  constructor(
    private readonly remoteStorageService: RemoteStorageService,
    private readonly terminalSettingsDesktopMigrationManager: TerminalSettingsDesktopMigrationManager
  ) {
  }

  private get settingsKey(): string {
    return 'terminal-settings';
  }

  readSettings(): Observable<TerminalSettings | null> {
    return this.remoteStorageService.getRecord(this.settingsKey).pipe(
      take(1),
      switchMap(settings => {
        if (!!settings) {
          return this.terminalSettingsDesktopMigrationManager.applyMigrations<TerminalSettings>(
            settings.value,
            migrated => this.saveSettings(migrated)
          ).pipe(
            map(x => x.updatedData)
          );
        }

        return of(null);
      }),
      take(1)
    );
  }

  saveSettings(settings: TerminalSettings): Observable<boolean> {
    if (!this.saveStream$) {
      this.saveStream$ = this.saveQuery$.pipe(
        debounceTime(this.saveRequestDelay),
        switchMap(query => this.setRemoteRecord(query)),
        share()
      );
    }

    const result$ = new BehaviorSubject<boolean | null>(null);

    this.saveStream$.pipe(
      take(1)
    ).subscribe(x => {
      result$.next(x);
      result$.complete();
    });

    this.saveQuery$.next(settings);

    return result$.pipe(
      filter((x): x is boolean => x != null)
    );
  }

  removeSettings(): Observable<boolean> {
    return this.remoteStorageService.removeRecord(this.settingsKey);
  }

  private setRemoteRecord(settings: TerminalSettings): Observable<boolean> {
    return this.remoteStorageService.setRecord(
      {
        key: this.settingsKey,
        meta: {
          timestamp: this.getTimestamp()
        },
        value: settings
      });
  }

  private getTimestamp(): number {
    return Date.now();
  }
}
