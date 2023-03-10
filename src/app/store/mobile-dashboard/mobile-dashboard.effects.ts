import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { Store } from '@ngrx/store';
import {
  filter,
  map,
} from 'rxjs/operators';
import { GuidGenerator } from '../../shared/utils/guid';
import { distinctUntilChanged, take, tap, withLatestFrom } from 'rxjs';
import {
  Dashboard,
} from '../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import { instrumentsHistory, mobileDashboard } from './mobile-dashboard.selectors';
import { MobileDashboardActions } from './mobile-dashboard-actions';
import { mapWith } from "../../shared/utils/observable-helper";
import { PortfoliosStreams } from "../portfolios/portfolios.streams";
import { getDefaultPortfolio, isPortfoliosEqual } from "../../shared/utils/portfolios";
import { MarketService } from "../../shared/services/market.service";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { WidgetSettingsService } from "../../shared/services/widget-settings.service";
import { WidgetNames } from "../../shared/models/enums/widget-names";
import { Widget } from "../../shared/models/dashboard/widget.model";
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { defaultBadgeColor } from "../../shared/utils/instruments";

@Injectable()
export class MobileDashboardEffects {
  initMobileDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboard),
      map(() => {
        const dashboard = this.readMobileDashboardFromLocalStorage();
        const instrumentsHistory = this.readInstrumentsHistoryFromLocalStorage();
        this.excludeTerminalSettings();

        return MobileDashboardActions.initMobileDashboardSuccess({
            mobileDashboard: dashboard,
            instrumentsHistory
          }
        );
      })
    );
  });

  createSaveAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardActions.addMobileDashboard,
        MobileDashboardActions.selectPortfolio,
        MobileDashboardActions.selectInstrument
      ),
      map(() => MobileDashboardActions.saveMobileDashboard())
    );
  });

  saveDashboards$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(MobileDashboardActions.saveMobileDashboard),
        withLatestFrom(this.store.select(mobileDashboard)),
        tap(([, dashboard]) => {
          if (dashboard) {
            this.saveMobileDashboardToLocalStorage(dashboard);
          }
        })
      );
    },
    { dispatch: false }
  );

  createSaveInstrumentsHistoryAction = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardActions.selectInstrument
      ),
      map(() => MobileDashboardActions.saveInstrumentsHistory())
    );
  });

  saveInstrumentsHistory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardActions.saveInstrumentsHistory),
      withLatestFrom(this.store.select(instrumentsHistory)),
      tap(([, instruments]) => {
        this.saveInstrumentsHistoryToLocalStorage(instruments ?? []);
      })
    );
  },
    { dispatch: false }
  );

  setDefaultPortfolioForMobileDashboard$ = createEffect(() => {
    return this.store.select(mobileDashboard).pipe(
      filter(d => !!d),
      mapWith(
        () => PortfoliosStreams.getAllPortfolios(this.store),
        (dashboard, allPortfolios) => ({ dashboard, allPortfolios })
      ),
      filter(({ dashboard, allPortfolios }) =>
        !dashboard!.selectedPortfolio ||
        !allPortfolios.find(p => isPortfoliosEqual(p, dashboard!.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({ ...source, defaultExchange })
      ),
      map( ({ allPortfolios, defaultExchange}) => MobileDashboardActions.selectPortfolio({
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForMobileDashboard$ = createEffect(() => {
    return this.store.select(mobileDashboard).pipe(
      filter(d => !!d),
      distinctUntilChanged((previous, current) => previous?.guid === current!.guid),
      filter(d => !d!.instrumentsSelection),
      map(() => MobileDashboardActions.selectInstrument({
          selection: {
            groupKey: defaultBadgeColor,
            instrumentKey: {
              symbol: 'SBER',
              exchange: 'MOEX',
              instrumentGroup: 'TQBR'
            }
          }
        })
      ));
  });

  private readonly mobileDashboardStorageKey = 'mobile-dashboard';
  private readonly instrumentsHistoryStorageKey = 'instruments-history';

  createDefaultMobileDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboardSuccess),
      filter(action => !action.mobileDashboard),
      map(() => {
        return MobileDashboardActions.addMobileDashboard({
          guid: GuidGenerator.newGuid(),
          title: 'Mobile dashboard',
          items: this.dashboardService.getMobileDashboardWidgets()
        });
      })
    )
  );

  excludeSettingsFromWidgets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardActions.addMobileDashboard),
      tap(d => {
        d.items.forEach(widget => this.excludeWidgetSettings(widget));
      })
    ),
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  private readMobileDashboardFromLocalStorage(): Dashboard | undefined {
    return this.localStorage.getItem<Dashboard>(this.mobileDashboardStorageKey);
  }

  private saveMobileDashboardToLocalStorage(dashboard: Dashboard) {
    this.localStorage.setItem(this.mobileDashboardStorageKey, dashboard);
  }

  private readInstrumentsHistoryFromLocalStorage(): InstrumentKey[] {
    return this.localStorage.getItem(this.instrumentsHistoryStorageKey) ?? [];
  }

  private saveInstrumentsHistoryToLocalStorage(instruments: InstrumentKey[]) {
    this.localStorage.setItem(this.instrumentsHistoryStorageKey, instruments);
  }

  private excludeWidgetSettings(widget: Widget) {
    const settingsToUpdate: any = {};
    switch (widget.widgetType) {
      case WidgetNames.orderBook:
        settingsToUpdate.excludedFields = ['instrument', 'exchange', 'useOrderWidget'];
        settingsToUpdate.useOrderWidget = true;
        break;
      case WidgetNames.blotter:
        settingsToUpdate.excludedFields = ['portfolio', 'exchange'];
        break;
      case WidgetNames.lightChart:
      case WidgetNames.orderSubmit:
        settingsToUpdate.excludedFields = ['instrument', 'exchange'];
        break;
    }

    this.widgetSettingsService.getSettings(widget.guid)
      .pipe(
        take(1),
      )
      .subscribe(() => this.widgetSettingsService.updateSettings(widget.guid, settingsToUpdate));
  }

  private excludeTerminalSettings() {
    this.terminalSettingsService.getSettings()
      .pipe(
        take(1)
      )
      .subscribe(s => {
        if (!s.excludedSettings?.length) {
          this.terminalSettingsService.updateSettings({ excludedSettings: ['hotKeysSettings', 'badgesBind'] });
        }
      });
  }
}
