import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId } from "../../../shared/models/settings/table-settings.model";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";

export interface InstrumentSelectSettings extends WidgetSettings {
  activeListId?: string;
  instrumentColumns: string[];
  showFavorites?: boolean;
  priceChangeTimeframe?: TimeframeValue;
}

export const allInstrumentsColumns: BaseColumnId[] = [
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Назв.", isDefault: true },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'priceChange', displayName: "Изм. цены", isDefault: true },
  { id: 'priceChangeRatio', displayName: "Изм. цены, %", isDefault: true },
  { id: 'maxPrice', displayName: "Д.макс.", isDefault: false },
  { id: 'minPrice', displayName: "Д.мин.", isDefault: false },
  { id: 'volume', displayName: "Объём", isDefault: false },
  { id: 'openPrice', displayName: "Откр.", isDefault: false },
  { id: 'closePrice', displayName: "Закр.", isDefault: false },
  { id: 'remove', displayName: "Удл.", isDefault: true }
];
