import { TestBed } from '@angular/core/testing';

import { SignalManagerService } from './signal-manager.service';

describe('SignalManagerService', () => {
  let service: SignalManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
