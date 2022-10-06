import { TestBed } from '@angular/core/testing';

import { PouchDbService } from './pouch-db.service';

describe('PouchDbService', () => {
  let service: PouchDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PouchDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
