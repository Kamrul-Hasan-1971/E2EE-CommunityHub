import { TestBed } from '@angular/core/testing';

import { SignalServerStoreService } from './signal-server-store.service';

describe('SignalServerStoreService', () => {
  let service: SignalServerStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalServerStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
