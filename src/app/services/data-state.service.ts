import { Injectable } from '@angular/core';
import { RoomData } from '../interfaces/roomData';
import { Utility } from '../utility/utility';

@Injectable({
  providedIn: 'root'
})
export class DataStateService {

  private roomsConversationState = new Map<string, any[]>();
  private roomsState = new Map<string, RoomData>();
  communityRoom:RoomData ={
    name: "Community",
    id: "a5c1d297-1efd-4f63-8121-97b2172e46bc",
    photoURL: "",
    roomOrderId: -1,
    lastMessage: "",
    hasUnreadMessage: false
  }

  constructor() { }

  setRoomState(roomId, room)
  {
    this.roomsState.set(roomId,room);
  }

  getRoomNameFromRoomState(roomId)
  {
    if (this.roomsState.has(roomId)){
      return this.roomsState.get(roomId).name;
    }
    if(roomId == Utility.getCurrentUserId()){
      return "You";
      //return Utility.getCurrentUser().name;
    }
    return "";
  }

  getRoomState(roomId)
  {
    if(!this.roomsState.has(roomId)) this.roomsState.set(roomId,null);
    return this.roomsState.get(roomId);
  }
 
  getRoomsConversationState(roomId)
  {
    if (!this.roomsConversationState.has(roomId)){
      this.roomsConversationState.set(roomId,[]);
    }
    return this.roomsConversationState.get(roomId);
  }
  
  addMessageToRoomConversationState(roomId, messageObj)
  {
    if (!this.roomsConversationState.has(roomId)){
      this.roomsConversationState.set(roomId,[]);
    }
    let roomMessagesFromState = this.getRoomsConversationState(roomId);
    const prevMessageObj = roomMessagesFromState.find(msgObj => msgObj.messageId == messageObj.messageId);
    if(prevMessageObj){
      Utility.oldObjectUpdateByNewObjectKey(prevMessageObj,messageObj);
    }
    else{
      roomMessagesFromState.push(messageObj);
    }
  }

}
