import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Currency } from 'src/app/shared/models/enums/currencies.model';
import { allOrdersColumns, allPositionsColumns, allTradesColumns, BlotterSettings, ColumnIds } from 'src/app/shared/models/settings/blotter-settings.model';
import { BlotterService } from '../../services/blotter.service';

@Component({
  selector: 'ats-blotter-settings[guid]',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent implements OnInit {
  @Input()
  guid!: string

  @Output()
  settingsChange: EventEmitter<BlotterSettings> = new EventEmitter<BlotterSettings>();

  form!: FormGroup;

  allOrdersColumns: ColumnIds[] = allOrdersColumns;
  allTradesColumns: ColumnIds[] = allTradesColumns;
  allPositionsColumns: ColumnIds[] = allPositionsColumns;
  prevSettings?: BlotterSettings;

  constructor(private service: BlotterService ) { }

  ngOnInit() {
    this.service.getSettings(this.guid).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;
        this.form = new FormGroup({
          portfolio: new FormControl(settings.portfolio, [
            Validators.required,
            Validators.minLength(4)
          ]),
          exchange: new FormControl(settings.exchange, Validators.required),
          ordersColumns: new FormControl(settings.ordersColumns),
          tradesColumns: new FormControl(settings.tradesColumns),
          positionsColumns: new FormControl(settings.positionsColumns),
          currency: new FormControl(this.currencyToCode(settings.currency)),
        });
      }
    })
  }

  codeToCurrency(code: string) {
    switch(code) {
      case 'USD':
        return  Currency.Usd
      case 'EUR':
        return Currency.Eur
      default:
        return Currency.Rub
    }
  }

  currencyToCode(currency: Currency) {
    switch(currency) {
      case Currency.Usd:
        return 'USD'
      case Currency.Eur:
        return 'EUR'
      default:
        return 'RUB'
    }
  }

  submitForm(): void {
    this.form.value.currency = this.codeToCurrency(this.form.value.currency);
    this.service.setSettings({ ...this.prevSettings, ...this.form.value, linkToActive: false})
    this.settingsChange.emit()
  }
}
