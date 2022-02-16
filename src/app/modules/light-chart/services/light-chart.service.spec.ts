import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HistoryService } from 'src/app/shared/services/history.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { LightChartService } from './light-chart.service';

describe('LightChartService', () => {
  let service: LightChartService;
  let httpController: HttpTestingController;
  let httpClient: HttpClient;

  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  const spyHistory = jasmine.createSpyObj('HistoryService', ['getHistory'])

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        { provide: WebsocketService, useValue: spy },
        { provide: HistoryService, useValue: spyHistory },
        LightChartService
      ]
    });
    service = TestBed.inject(LightChartService);
    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
