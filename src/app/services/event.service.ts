import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  newUserInCommunity$ = new Subject<any>();
  typingPayload$ = new Subject<any>();
  activeStatusPayload$ = new Subject<any>();

  constructor() { }
}
