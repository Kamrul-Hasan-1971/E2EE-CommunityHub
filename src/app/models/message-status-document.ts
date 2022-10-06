export class MessageStatusDocument {
  _id: string;
  messageId: string;
  from: string;
  messageStatus: number;
  modifyAt: any;
  roomId : string;
  constructor(
    messageId: string,
    from: string,
    messageStatus: number,
    roomId: string
  ) {
    this._id = messageId + '_' + from;
    this.messageId = messageId;
    this.from = from;
    this.messageStatus = messageStatus;
    this.roomId = roomId;
  }
}
