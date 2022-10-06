import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { RoomData } from '../../interfaces/roomData';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  upStream = new Subject<string>();
  downStream = new Subject<string>();
  roomeName = new Subject<string>();
  inputBoxVisibilitySub = new Subject<boolean>();
  sendMessage = new Subject<any>();
  activeRoomIdSubject = new Subject<string>();
  addUnreadClass = new Subject<string>();
  activatedRoomData: RoomData;
  activeRoomId : string = "";
  constructor() { }

  setActiveRoomId(roomId) {
    this.activeRoomId = roomId;
  }
  getActiveRoomId() {
    if (this.activeRoomId) {
      return this.activeRoomId;
    }
    return "";
  }

  setActiveRoomData(roomData) {
    this.activatedRoomData = roomData;
  }
  getActiveRoomData() {
    if (this.activatedRoomData) {
      return this.activatedRoomData;
    }
    return null;
  }
}
