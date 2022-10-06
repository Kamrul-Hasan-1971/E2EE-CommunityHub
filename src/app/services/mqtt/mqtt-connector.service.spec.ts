import { TestBed } from '@angular/core/testing';

import { MqttConnectorService } from './mqtt-connector.service';

describe('MqttConnectorService', () => {
  let service: MqttConnectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MqttConnectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
