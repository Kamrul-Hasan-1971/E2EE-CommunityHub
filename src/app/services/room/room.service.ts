import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Utility } from 'src/app/utility/utility';
import { RoomData } from '../../interfaces/roomData';
import { PouchDbService } from '../clientDB/pouch-db.service';
import { DataStateService } from '../data-state.service';
import { UserService } from '../users/user.service';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  upStream = new Subject<string>();
  downStream = new Subject<string>();
  roomeChange = new Subject<string>();
  inputBoxVisibilitySub = new Subject<boolean>();
  sendMessage = new Subject<any>();
  activeRoomIdSubject = new Subject<string>();
  addUnreadClass = new Subject<string>();
  activatedRoomData: RoomData;
  activeRoomId : string = "";
  constructor(
    private dataStateService:DataStateService,
    private pouchDbService : PouchDbService,
    private userService : UserService
  ) { }

  async getRoomDataByRoomID(roomId)
  {
    //1st try from data state
    if(roomId == Utility.getCommunitityId()) return this.dataStateService.communityRoom;
    let room = this.dataStateService.getRoomState(roomId);
    if(room) {
      console.log("RoomService:: Get roomdata from state roomId",roomId,"room",room)
      return room;
    }

    //2nd try from clientDb
    room = await this.pouchDbService.getChatRoomByRoomId(roomId);
    this.dataStateService.setRoomState(roomId,room);
    room = this.dataStateService.getRoomState(roomId);
    if(room) {
      console.log("RoomService:: Get roomdata from clientDb roomId",roomId,"room",room)
      return room;
    }

    //3rd fetch from server
    room = await this.userService.getUserById(roomId) as RoomData;
    if(room) {
      console.log("RoomService:: Get roomdata from server roomId",roomId,"room",room)
      return room;
    }

    console.log("No roomdata for this roomId",roomId);
    return null;
  }

}
