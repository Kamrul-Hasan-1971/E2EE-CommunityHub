import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CommonService {
  roomListChangesForLastMessage$: Subject<any> = new Subject<any>()
  clinetId: number =0;
  senderId: number = 1;
  user: any[] = [
    {
      id: "f2b07c17-73eb-436f-8c2e-9e3969b5c9df",
      name: "Kamrul"
    },
    {
      id: "d3d7ea19-21a1-4608-8e62-521aeb62f716",
      name: "Hasan"
    }
  ];

  constructor() { }


}

