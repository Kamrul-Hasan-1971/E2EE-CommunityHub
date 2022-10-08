export interface RoomData {
    name: string;
    id: string;
    photoURL: string;
    roomOrderId: any;
    lastMessage:string;
    hasUnreadMessage: boolean;
    lastSeen?:any;
    lastUpdated?:any
}