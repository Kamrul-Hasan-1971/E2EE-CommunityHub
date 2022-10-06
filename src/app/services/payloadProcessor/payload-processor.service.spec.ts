import { TestBed } from '@angular/core/testing';

import { PayloadProcessorService } from './payload-processor.service';

describe('PayloadProcessorService', () => {
  let service: PayloadProcessorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayloadProcessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
