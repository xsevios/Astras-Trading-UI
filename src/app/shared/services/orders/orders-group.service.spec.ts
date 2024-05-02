import { TestBed } from '@angular/core/testing';

import { OrdersGroupService } from './orders-group.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { EnvironmentService } from "../environment.service";
import { WsOrdersService } from "./ws-orders.service";
import { Subject } from "rxjs";
import { OrderInstantTranslatableNotificationsService } from "./order-instant-translatable-notifications.service";

describe('OrdersGroupService', () => {
  let service: OrdersGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: WsOrdersService,
          useValue: {
            submitLimitOrder: jasmine.createSpy('submitLimitOrder').and.returnValue(new Subject()),
            submitStopMarketOrder: jasmine.createSpy('submitStopMarketOrder').and.returnValue(new Subject()),
            submitStopLimitOrder: jasmine.createSpy('submitStopLimitOrder').and.returnValue(new Subject()),
          }
        },
        {
          provide: OrderInstantTranslatableNotificationsService,
          useValue: {
            ordersGroupCreated: jasmine.createSpy('ordersGroupCreated').and.callThrough()
          }
        },
      ]
    });
    service = TestBed.inject(OrdersGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
