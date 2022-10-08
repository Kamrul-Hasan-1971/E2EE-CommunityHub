import { Injectable } from '@angular/core';

import PouchDBFind from 'pouchdb-find';
import * as pouchdbUpsert from 'pouchdb-upsert';
import PouchDB from 'pouchdb';


import { AuthService } from '../auth/auth.service';
import { Subject } from 'rxjs';
import { Utility } from 'src/app/utility/utility';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MessageChangesEmit } from 'src/app/models/message-changes-emit-enum';
import { chatRoomChangesEmit } from 'src/app/models/chatRoom-changes-emit-enum';
//import { MessageStatusDocument } from 'src/app/models/message-status-document';

@Injectable({
  providedIn: 'root'
})
export class PouchDbService {

  private signalStoreDB: any;
  private chatRoomDB: any;
  private messageDB: any;
  //private msgStatusDB: any;

  signalStoreDBName: string;
  messageDBName: string;
  msgStatusDBName: string;
  chatRoomDBName: string;

  messageChanges: Subject<any> = new Subject<any>();
  msgStatusChanges: Subject<any> = new Subject<any>();
  lastMessageChanges: Subject<any> = new Subject<any>();
  dbInitializationCompleteSubscription: Subject<any> = new Subject<any>();

  constructor(
    private authService: AuthService
  ) {
    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(pouchdbUpsert);
    this.signalStoreDBName = 'mqtt_signalStore';
    this.messageDBName = 'mqtt_messages';
    //this.msgStatusDBName = 'mqtt_msgStatus';
    this.chatRoomDBName = 'mqtt_chatRoom';
  }

  async init() {
    console.log("Puchdb db initialization start")
    await this.createAllDbInstance();
    console.log("Puchdb db initialization complete");
    this.dbInitializationCompleteSubscription.next(true);
  }

  async createAllDbInstance() {
    await Promise.all([
      this.createSignalStoreDB(),
      this.createMessageDB(),
      //this.createMsgStatusDB(),
      this.createChatRoomDB(),
    ])
  }

  async getSignalStoreDbStatus() {
    if (!this.signalStoreDB) return false;
    try {
      const message = await this.signalStoreDB.info().then((info) => {
        return true;
      });
      return message;
    } catch (error) {
      return false;
    }
  }

  async createSignalStoreDB() {
    const isDbAvailable = await this.getSignalStoreDbStatus();
    if (!this.authService.isLoggedIn || isDbAvailable) return;
    try {
      this.signalStoreDB = new PouchDB(this.signalStoreDBName, {
        revs_limit: 1,
        auto_compaction: true,
      });
    } catch (err) {
      console.error(
        'PouchDbManagerService: error in creating signalStore db instance'
      );
    }
  }

  async saveSignalStoreData(
    key: string, value: any
  ) {
    const isDbAvailable = await this.getSignalStoreDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      try {
        const currentUserId = Utility.getCurrentUserId();
        return new Promise((resolve, reject) => {
          this.signalStoreDB
            .upsert(currentUserId, (doc) => {
              doc._id = currentUserId;
              doc[key] = value;
              console.log("Updated store doc", doc);
              return doc;
            })
            .then((res) => {
              console.log("Signal store data save done key", key, "response", res)
              resolve({
                success: true,
              });
            })
            .catch((err) => { reject(err) });
        });
      } catch (error) {
        console.error(
          'signal store-db-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('signal store data not saved in signal store db as db not available')
      );
    }
  }

  async removeSignalStoreData(
    key
  ) {
    const isDbAvailable = await this.getSignalStoreDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      try {
        const currentUserId = Utility.getCurrentUserId();
        return new Promise((resolve, reject) => {
          this.signalStoreDB
            .upsert(currentUserId, (doc) => {
              doc._id = currentUserId;
              delete doc[key];
              return doc;
            })
            .then(() => {
              resolve({
                success: true,
              });
            })
            .catch((err) => { reject(err) });
        });
      } catch (error) {
        console.error(
          'signal store-db-delete-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('signal store data not saved(delete) in signal store db as db not available')
      );
    }
  }

  async getSignalStoreData() {
    const isDbAvailable = await this.getSignalStoreDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const response = await this.signalStoreDB.find({
        selector: {
          _id: Utility.getCurrentUserId()
        },
      });
      return response.docs;
    }
  }

  // async getMsgStatusDbStatus() {
  //   if (!this.msgStatusDB) return false;
  //   try {
  //     const message = await this.msgStatusDB.info().then((info) => {
  //       return true;
  //     });
  //     return message;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // async createMsgStatusDB() {
  //   const isDbAvailable = await this.getMsgStatusDbStatus();
  //   if (!this.authService.isLoggedIn || isDbAvailable) return;
  //   try {
  //     this.msgStatusDB = new PouchDB(this.msgStatusDBName, {
  //       revs_limit: 1,
  //       auto_compaction: true,
  //     });
  //     this.changeInMsgStatusDB();
  //   } catch (err) {
  //     console.error(
  //       'PouchDbManagerService: error in creating message db instance'
  //     );
  //   }
  // }

  // async saveMsgStatusToMsgStatusDb(
  //   msgStatus: MessageStatusDocument,
  // ) {
  //   console.log(
  //     'save message status to msg status DB: ',
  //     msgStatus
  //   );
  //   const isDbAvailable = await this.getMsgStatusDbStatus();
  //   if (this.authService.isLoggedIn && isDbAvailable) {
  //     msgStatus._id = msgStatus.messageId;
  //     try {
  //       return new Promise((resolve, reject) => {
  //         this.msgStatusDB
  //           .upsert(msgStatus._id, (doc: MessageStatusDocument) => {
  //             doc = msgStatus;
  //             return doc;
  //           })
  //           .then(() => {
  //             resolve({
  //               success: true,
  //             });
  //           })
  //           .catch((err) => { reject(err) });
  //       });
  //     } catch (error) {
  //       console.error(
  //         'msg-status-db-upsert-error',
  //         error
  //       );
  //       return Promise.reject(error);
  //     }
  //   } else {
  //     return new Promise((resolve) =>
  //       resolve('Message status db is not available')
  //     );
  //   }
  // }

  // changeInMsgStatusDB() {
  //   if (!this.msgStatusDB) return;
  //   this.msgStatusDB
  //     .changes({
  //       since: 'now',
  //       live: true,
  //       include_docs: true,
  //     })
  //     .on('change', (change) => {
  //       if (change && change.doc) {
  //         this.msgStatusChanges.next(change);
  //       }
  //     })
  //     .on('complete', (info) => { })
  //     .on('error', (error) => {
  //       return null;
  //     });
  // }

  async createMessageDB() {
    const isDbAvailable = await this.getMessageDbStatus();
    if (!this.authService.isLoggedIn || isDbAvailable) return;
    try {
      this.messageDB = new PouchDB(this.messageDBName, {
        revs_limit: 1,
        auto_compaction: true,
      });
      this.changeInMessageDB();
    } catch (err) {
      console.error(
        'PouchDbManagerService: error in creating message db instance'
      );
    }
  }

  async getMessageDbStatus() {
    if (!this.messageDB) return false;
    try {
      const message = await this.messageDB.info().then((info) => {
        return true;
      });
      return message;
    } catch (error) {
      return false;
    }
  }

  resolveMessageStatus(doc) {
    let deliveredCounter = doc.deliveredUsers.size;
    let readCounter = doc.readUsers.size;

    if (readCounter == doc.roomMemberCount) {
      doc.messageStatus = MessageStatus.read;
    }
    else if (readCounter + deliveredCounter == doc.roomMemberCount) {
      doc.messageStatus = MessageStatus.delivered;
    }
    else if (deliveredCounter + readCounter > 0) {
      doc.messageStatus = MessageStatus.sent;
    }
  }

  async saveMessageStatusToMessageDb(
    messageStatus: any
  ) {
    console.log(
      'PouchDbService::save Message Status To MessageDb: ',
      messageStatus
    );
    const isDbAvailable = await this.getMessageDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      messageStatus._id = messageStatus.messageId;
      try {
        return new Promise((resolve, reject) => {
          this.messageDB
            .upsert(messageStatus._id, (doc) => {
              //common
              doc._id = messageStatus._id;
              doc.messageId = messageStatus.messageId;
              if (!doc.deliveredUsers) doc.deliveredUsers = new Set<string>();
              if (!doc.readUsers) doc.readUsers = new Set<string>();
              //common
              if (messageStatus.messageStatus == MessageStatus.delivered) {
                if (!doc.readUsers.has(messageStatus.from)) {
                  doc.deliveredUsers.add(messageStatus.from);
                  this.resolveMessageStatus(doc);
                }
              }
              else if (messageStatus.messageStatus == MessageStatus.read) {
                doc.deliveredUsers.delete(messageStatus.from);
                doc.readUsers.add(messageStatus.from);
                this.resolveMessageStatus(doc);
              }
              else if (messageStatus.messageStatus == MessageStatus.sent) {
                doc.messageStatus = MessageStatus.sent;
              }
              doc.messageChangesEmit = MessageChangesEmit.messageStatus;
              console.log("after updating message status doc",doc)
              return doc;
            })
            .then(() => {
              resolve({
                success: true,
              });
            })
            .catch((err) => { reject(err) });
        });
      } catch (error) {
        console.error(
          'Message status save to message-db-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('message status not saved in message db as db not available')
      );
    }
  }

  async saveMessageToMessageDb(
    message: any
  ) {
    console.log(
      'PouchDbService::saveMessageToMessageDb: ',
      message
    );
    const isDbAvailable = await this.getMessageDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      message._id = message.messageId;
      try {
        return new Promise((resolve, reject) => {
          this.messageDB
            .upsert(message._id, (doc) => {
              //doc priority is most
              if (doc.deliveredUsers) {
                message.deliveredUsers = doc.deliveredUsers;
              }
              else if (!message.deliveredUsers) {
                message.deliveredUsers = new Set<string>();
              }
              if (doc.readUsers) {
                message.readUsers = doc.readUsers;
              }
              else if (!message.readUsers) {
                message.readUsers = new Set<string>();
              }
              message.messageStatus = doc.messageStatus || message.messageStatus;
              doc = message;
              doc.messageChangesEmit = MessageChangesEmit.message;
              return doc;
            })
            .then(() => {
              console.log("after updating message doc",message)
              resolve({
                success: true,
              });
            })
            .catch((err) => { reject(err) });
        });
      } catch (error) {
        console.error(
          'PouchDbManagerService: message-db-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('message not saved in message db as db not available')
      );
    }
  }

  changeInMessageDB() {
    if (!this.messageDB) return;
    this.messageDB
      .changes({
        since: 'now',
        live: true,
        include_docs: true,
      })
      .on('change', (change) => {
        if (change && change.doc) {
          if (change.doc.messageChangesEmit == MessageChangesEmit.message) {
            this.messageChanges.next(change);
          }
          else if (change.doc.messageChangesEmit == MessageChangesEmit.messageStatus) {
            this.msgStatusChanges.next(change);
          }
        }
      })
      .on('complete', (info) => { })
      .on('error', (error) => {
        return null;
      });
  }

  async getCommunityRoomConversationByRoomId(roomId: string) {
    const isDbAvailable = await this.getMessageDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const response = await this.messageDB.find({
        selector: {
          $or: [
            { to: roomId },
          ]
        },
        //use_index: this.msgStatusIndex_msgId_status_docName,
      });
      return response.docs || [];
    }
    else {
      console.warn("messageDb is not available");
    }
  }

  async getRoomConversationByRoomId(roomId: string) {
    const isDbAvailable = await this.getMessageDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const response = await this.messageDB.find({
        selector: {
          $or: [
            {
              $and: [
                { to: Utility.getCurrentUserId() },
                { from: roomId }
              ]
            },
            {
              $and: [
                { to: roomId },
                { from: Utility.getCurrentUserId() }
              ]
            }
          ]
        },
        //use_index: this.msgStatusIndex_msgId_status_docName,
      });
      return response.docs || [];
    }
    else {
      console.warn("messageDb is not available");
    }
  }

  async getMessageByMsgIdAndStatus(msgId: string, messageStatus: number) {
    const isDbAvailable = await this.getMessageDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const response = await this.messageDB.find({
        selector: {
          messageId: msgId,
          messageStatus: messageStatus,
        },
        //use_index: this.msgStatusIndex_msgId_status_docName,
      });
      return response.docs;
    }
  }

  async createChatRoomDB() {
    const isDbAvailable = await this.getChatRoomDbStatus();
    if (!this.authService.isLoggedIn || isDbAvailable) return;
    try {
      this.chatRoomDB = new PouchDB(this.chatRoomDBName, {
        revs_limit: 1,
        auto_compaction: true,
      });
    } catch (err) {
      console.error(
        'PouchDbManagerService: error in creating chatRoom db instance'
      );
    }
  }

  async getChatRoomDbStatus() {
    if (!this.chatRoomDB) return false;
    try {
      const message = await this.chatRoomDB.info().then((info) => {
        return true;
      });
      return message;
    } catch (error) {
      return false;
    }
  }

  async saveRoomsDataToChatRoomDb(chatRooms: any[]) {
    const promises = [];
    chatRooms.forEach(room => {
      promises.push(this.saveRoomDataToChatRoomDb(room));
    });
    const res = Promise.all(promises)
      .catch(err => {
        console.error("Save rooms data to chatRoomDb error", err);
      })
    return res;
  }

  async saveRoomDataToChatRoomDb(
    roomData: any,
  ) {
    const isDbAvailable = await this.getChatRoomDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      try {
        roomData._id = roomData.id;
        return new Promise((resolve, reject) => {
          this.chatRoomDB
          .upsert(roomData._id, (doc) => {
              roomData.roomOrderId = roomData.roomOrderId || 0;
              doc = roomData;
              doc.chatRoomChangesEmit = chatRoomChangesEmit.roomData;
              return doc;
            })
            .then(() => {
              resolve({
                success: true,
              });
            })
            .catch((err) => reject(err));
        });
      } catch (error) {
        console.error(
          'PouchDbManagerService: chatRoom-db-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('roomData not saved in roomData db as db not available')
      );
    }
  }

  async saveChnagesForLastMessageToRoomDataInChatRoomDb(
    roomChnagesForLastMessage
  ) {
    const isDbAvailable = await this.getChatRoomDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      try {
        return new Promise((resolve, reject) => {
          this.chatRoomDB
            .upsert(roomChnagesForLastMessage._id, (doc) => {
              doc._id = doc.id = roomChnagesForLastMessage._id;
              doc.lastMessage = roomChnagesForLastMessage.lastMessage;
              doc.lastMessageTime = roomChnagesForLastMessage.time;
              doc.hasUnreadMessage = roomChnagesForLastMessage.hasUnreadMessage;
              doc.chatRoomChangesEmit = chatRoomChangesEmit.lastMessage;
              return doc;
            })
            .then(() => {
              resolve({
                success: true,
              });
            })
            .catch((err) => reject(err));
        });
      } catch (error) {
        console.error(
          'last messages chatRoom-db-upsert-error',
          error
        );
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve) =>
        resolve('roomData not saved in roomData db as db not available')
      );
    }
  }

  // changeInChatRoomDB() {
  //   if (!this.chatRoomDB) return;
  //   this.chatRoomDB
  //     .changes({
  //       since: 'now',
  //       live: true,
  //       include_docs: true,
  //     })
  //     .on('change', (change) => {
  //       if (change && change.doc) {
  //         if(change.doc.messageChangesEmit == chatRoomChangesEmit.lastMessage){
  //           this.lastMessageChanges.next(change);
  //         }
  //       }
  //     })
  //     .on('complete', (info) => { })
  //     .on('error', (error) => {
  //       return null;
  //     });
  // }

  async getChatRoomByRoomId(roomId) {
    const isDbAvailable = await this.getChatRoomDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const room = await this.chatRoomDB.find({
        selector: {
          id: roomId,
        },
      })
      .catch((err)=> {
        console.error("Get all chat room docs error", err);
      });
      return room.docs &&  room.docs[0];
    }
    else {
      console.warn("chatRoomDB is not available");
    }
  }

  async getAllChatRoom() {
    const isDbAvailable = await this.getChatRoomDbStatus();
    if (this.authService.isLoggedIn && isDbAvailable) {
      const response = await this.chatRoomDB.allDocs({
        include_docs: true
      })
        .catch(function (err) {
          console.error("Get all chat room docs error", err);
        });
      return response.rows || [];
    }
    else {
      console.warn("chatRoomDB is not available");
    }
  }

  async deleteAllPouchDB() {
    const dbKeys = await (window.indexedDB as any).databases().catch((err) => {
      return null;
    });
    if (dbKeys) {
      await Promise.all(
        dbKeys.map((db: any) => {
          if (db.name.includes('_pouch_mqtt_')) {
            return new Promise((resolve, reject) => {
              let request = indexedDB.deleteDatabase(db.name);
              request.onblocked = (e) => {
                console.log('onblocked', e);
              };
              request.onsuccess = (res) => {
                console.log('DB delete success for', db.name);
                resolve(request.result);
              };
              request.onerror = (err) => {
                console.log('DB delete error for', db.name, err);
                reject(request.error);
              };
            });
          }
          else return null;
        })
      );
    }
  }
}
