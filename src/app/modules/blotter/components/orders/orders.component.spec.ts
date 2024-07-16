import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlotterService } from '../../services/blotter.service';
import { MockServiceBlotter } from '../../utils/mock-blotter-service';

import { OrdersComponent } from './orders.component';
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { of, Subject } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { OrdersGroupService } from "../../../../shared/services/orders/orders-group.service";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { LetDirective } from "@ngrx/component";
import { WsOrdersService } from "../../../../shared/services/orders/ws-orders.service";
import { NzContextMenuService } from "ng-zorro-antd/dropdown";

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));
    const settingsMock = {
      exchange: 'MOEX',
      portfolio: 'D39004',
      guid: '1230',
      ordersColumns: ['ticker'],
      tradesColumns: ['ticker'],
      positionsColumns: ['ticker'],
    };

    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        ...sharedModuleImportForTests,
        LetDirective
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        { provide: BlotterService, useClass: MockServiceBlotter },
        {
          provide: WsOrdersService,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.returnValue(new Subject())
          }
        },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        {
          provide: OrdersGroupService,
          useValue: {
            getAllOrderGroups: jasmine.createSpy('getAllOrderGroups').and.returnValue(new Subject())
          }
        },
        {
          provide: OrdersDialogService,
          useValue: {
            openEditOrderDialog: jasmine.createSpy('openEditOrderDialog').and.callThrough()
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough()
          }
        },
        ...commonTestProviders
      ],
      declarations: [
        OrdersComponent,
        mockComponent({ selector: 'ats-table-filter', inputs: ['columns'] }),
        mockComponent({ selector: 'ats-instrument-badge-display', inputs: ['columns'] }),
        mockComponent({
          selector: 'ats-add-to-watchlist-menu'
        })
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
