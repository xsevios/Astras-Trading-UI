import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BondScreenerWidgetComponent } from './widgets/bond-screener-widget/bond-screener-widget.component';
import { BondScreenerComponent } from './components/bond-screener/bond-screener.component';
import { BondScreenerSettingsComponent } from './components/bond-screener-settings/bond-screener-settings.component';
import { SharedModule } from "../../shared/shared.module";
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';



@NgModule({
  declarations: [
    BondScreenerWidgetComponent,
    BondScreenerComponent,
    BondScreenerSettingsComponent
  ],
  exports: [
    BondScreenerWidgetComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        NzResizeObserverModule
    ]
})
export class BondScreenerModule { }
