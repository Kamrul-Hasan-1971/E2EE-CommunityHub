
export interface MessageData {
    messageId,
    from: string;
    to: string;
    name: string;
    message: any;
    time: any;
    orderId:number;
    isGroupRoom: boolean;
    roomMemberCount : number,
    messageStatus? : number,
    deliveredUsers? : any,
    readUsers?: any
}