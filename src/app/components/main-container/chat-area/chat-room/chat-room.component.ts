import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, Subscription, takeUntil } from 'rxjs';
import { MessageService } from '../../../../services/message/message.service';
import { MessageData } from '../../../../interfaces/messageData';
import { MqttConnectorService } from '../../../../services/mqtt/mqtt-connector.service';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import { CommonService } from '../../../../services/common/common.service';
import { RoomService } from '../../../../services/room/room.service';
import { MqttUtility } from '../../../../../app/utility/mqtt-utility/mqtt-utility';
import { MqttPerTopic } from '../../../../models/mqtt-persistent-topic-enum';
import { Utility } from '../../../../../app/utility/utility';
import { PouchDbService } from '../../../../services/clientDB/pouch-db.service';
import { DataStateService } from '../../../../services/data-state.service';
import { UserService } from '../../../../services/users/user.service';
import { RoomData } from '../../../../interfaces/roomData';
import { SignalManagerService } from 'src/app/services/signal/signal-manager.service';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MessageStatusDocument } from 'src/app/models/message-status-document';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MessageStatusModalComponent } from 'src/app/components/modals/message-status-modal/message-status-modal.component';
import { PayloadProcessorService } from 'src/app/services/payloadProcessor/payload-processor.service';
import { EventService } from 'src/app/services/event.service';
//import {AngularFirestore} from '@angular/fire/firestore';
//import {User} from 'firebase';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  //@ViewChild('content') content: ElementRef;
  subs: Subscription[] = [];
  currentUser: any;
  item;
  roomId: string;
  room: RoomData;
  routeSub: Subscription;
  messageChangesSub: Subscription;
  msgStatusChangesSub: Subscription;
  messageStatusEnum = MessageStatus;
  activeRoomMessages: any[] = [];
  isGroupRoom: boolean = false;
  // destroyTyping = new Subject<any>();
  // typingName = '';
  // typingTimer: any;
  // typing = new BehaviorSubject<boolean>(false);
  // typing$ = this.typing.asObservable();
  // isGroupRoom: boolean = false;

  //@ViewChild('list') list?: ElementRef<HTMLDivElement>;
  @Output() chatData: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public dialog: MatDialog,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private pouchDbService: PouchDbService,
    private messageService: MessageService,
    private roomService: RoomService,
    private mqttConnectorService: MqttConnectorService,
    private commonService: CommonService,
    private dataStateService: DataStateService,
    private userService: UserService,
    private signalManagerService: SignalManagerService,
    private changeDetectorRef: ChangeDetectorRef,
    private payloadProcessorService: PayloadProcessorService,
    private eventService: EventService
  ) {
  }

  // subscribeToTypingPayload() {
  //   this.destroyTyping = new Subject<any>();
  //   this.eventService.typingPayload$
  //     .pipe(takeUntil(this.destroyTyping))
  //     .subscribe(async (payload: any) => {
  //       console.log('ChatThread: Typing-payload', payload);
  //       const typingPayload = { ...payload };
  //       if (typingPayload.roomId == this.roomId) {
  //         this.typingName = this.dataStateService.getRoomNameFromRoomState(typingPayload.from);
  //         this.typing.next(true);
  //         this.changeDetectorRef.detectChanges();
  //         this.startTypingTimer();
  //       }
  //     });
  // }

  // startTypingTimer() {
  //   clearTimeout(this.typingTimer);
  //   this.typingTimer = setTimeout(() => {
  //     this.typingName = '';
  //     this.typing.next(false);
  //     this.changeDetectorRef.detectChanges();
  //   }, 2500);
  // }
  openMessageStatusModal(message): void {
    let enterAnimationDuration: string = "0ms", exitAnimationDuration: string = "0ms";
    const dialogRef = this.dialog.open(MessageStatusModalComponent, {
      width: '400px',
      height: '500px',
      data: { message: message },
      panelClass: 'custom-modalbox',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });

  }

  ngOnInit(): void {
    this.currentUser = Utility.getCurrentUser();
    // if (this.roomId == Utility.getCommunitityId()) {
    //   this.isGroupRoom = true;
    // }
    // else {
    //   this.isGroupRoom = false;
    // }
    this.routerSubscription();
    this.sendMessageSubscription();
    this.messageChangesSubscription();
    this.msgStatusChangesSubscription();
    //this.loadMessageFormDbInitially();
    this.dbInitializationCompleteSubscription();
    //this.subscribeToTypingPayload();
  }

  routerSubscription() {
    this.routeSub = this.route.params.subscribe(async (params) => {
      this.roomId = params['id'];
      if (this.roomId) {
        this.isGroupRoom = (Utility.getCurrentActiveRoomId() == Utility.getCommunitityId());
        Utility.setCurrentActiveRoomId(this.roomId);
        this.room = await this.roomService.getRoomDataByRoomID(this.roomId);
        this.roomService.roomeChange.next(this.roomId);
        this.roomService.activeRoomIdSubject.next(this.roomId);

        // if (this.roomId == Utility.getCommunitityId()) {
        //   this.isGroupRoom = true;
        // }
        // else {
        //   this.isGroupRoom = false;
        // }
        this.roomService.inputBoxVisibilitySub.next(true);
        if (this.dataStateService.getRoomsConversationState(this.roomId).length > 0) {
          this.activeRoomMessages = this.dataStateService.getRoomsConversationState(this.roomId);
          this.scrollToId(this.activeRoomMessages[this.activeRoomMessages.length - 1].messageId);
          this.publishReadStatus();
        }
        else {
          this.loadMessageFormDbInitially();
          this.publishReadStatus();
        }
        // this.roomService.setActiveRoomId(this.roomId);

        // if (this.roomId == Utility.getCommunitityId()) {
        //   this.roomService.setActiveRoomData(this.dataStateService.communityRoom);
        //}
        // else {
        //   const room: RoomData = await this.userService.getUserById(this.roomId) as RoomData;
        //   this.roomService.setActiveRoomData(room);
        //   this.roomService.roomeChange.next(this.roomId);
        // }
      }
      else {
        this.roomService.activeRoomIdSubject.next("");
        Utility.setCurrentActiveRoomId("");
        this.roomService.inputBoxVisibilitySub.next(false);
      }
    });
  }

  publishReadStatus() {
    this.activeRoomMessages.forEach(message => {
      if (this.shouldPublishReadStatus(message)) {
        console.log("#hasan", message)
        const statusPayload = {
          messageId: message.messageId,
          messageStatus: MessageStatus.read,
          from: Utility.getCurrentUserId(),
        };
        const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
        console.log('Publishing read status', 'msgId', message.messageId, 'statusPayload', statusPayload);
        this.mqttConnectorService.publishToPersistentClient(MqttUtility.parseMqttTopic(MqttPerTopic.messageStatus, msgRoomId), statusPayload);
      }
    })
  }

  async sendMessageSubscription() {
    this.roomService.sendMessage.subscribe(async (message) => {
      let messageObj: MessageData = {
        messageId: uuid.v4(),
        from: Utility.getCurrentUserId(),
        to: this.roomId,
        time: new Date(),
        orderId: new Date().getTime(),
        name: Utility.getCurrentUser().name,
        message: message,
        isGroupRoom: false,
        roomMemberCount: 2,
        messageStatus: MessageStatus.pending,
      }
      if (this.roomId == Utility.getCommunitityId()) {
        messageObj.isGroupRoom = true;
        messageObj.roomMemberCount = parseInt(Utility.getRoomCount());
      }
      const messageObjForReceiver = _.cloneDeep(messageObj);

      messageObj.deliveredUsers = new Set<string>();
      messageObj.readUsers = new Set([Utility.getCurrentUserId()]);

      this.pouchDbService.saveMessageToMessageDb(messageObj);
      this.dataStateService.addMessageToRoomConversationState(this.roomId, messageObj);
      this.commonService.roomListChangesForLastMessage$.next(messageObj);

      const encryptedMessage = await this.encryptMessage(message);
      messageObjForReceiver.message = encryptedMessage;

      let publishTopic = MqttUtility.parseMqttTopic(MqttPerTopic.roomInbox, this.roomId);
      this.mqttConnectorService.publishToPersistentClient(publishTopic, messageObjForReceiver);

      this.scrollToId(messageObj.messageId);
    })
  }

  messageChangesSubscription() {
    this.messageChangesSub = this.pouchDbService.messageChanges.subscribe((changes: any) => {
      const message = changes.doc;
      const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
      this.dataStateService.addMessageToRoomConversationState(msgRoomId, message);
      if (msgRoomId == this.roomId) {
        this.scrollToId(message.messageId);
        this.publishSingleMessageReadStatus(message);
      }
    })
  }

  publishSingleMessageReadStatus(message) {
    if (this.shouldPublishReadStatus(message)) {
      const statusPayload = {
        messageId: message.messageId,
        messageStatus: MessageStatus.read,
        from: Utility.getCurrentUserId(),
      };
      const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
      console.log('Publishing read status', 'msgId', message.messageId, 'statusPayload', statusPayload);
      this.mqttConnectorService.publishToPersistentClient(MqttUtility.parseMqttTopic(MqttPerTopic.messageStatus, msgRoomId), statusPayload);
    }
  }

  msgStatusChangesSubscription() {
    this.msgStatusChangesSub = this.pouchDbService.msgStatusChanges.subscribe((changes: any) => {
      const message = changes.doc;
      const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
      this.dataStateService.addMessageToRoomConversationState(msgRoomId, message);
    })
  }

  dbInitializationCompleteSubscription() {
    this.pouchDbService.dbInitializationCompleteSubscription.subscribe(res => {
      this.loadMessageFormDbInitially();
    })
  }

  async loadMessageFormDbInitially() {
    let roomMessages: any[];
    if (this.roomId == Utility.getCommunitityId()) {
      roomMessages = await this.pouchDbService.getCommunityRoomConversationByRoomId(this.roomId);
    }
    else {
      roomMessages = await this.pouchDbService.getRoomConversationByRoomId(this.roomId);
    }
    console.log("RoomId", this.roomId, "Room messages", roomMessages);
    if (roomMessages) {
      roomMessages = roomMessages.sort((a, b) => a.orderId > b.orderId ? 1 : -1);
      for (let roomMessage of roomMessages) {
        this.dataStateService.addMessageToRoomConversationState(this.roomId, roomMessage);
      }
      this.activeRoomMessages = this.dataStateService.getRoomsConversationState(this.roomId);
      console.log("RoomId", this.roomId, "activeRoomMessages messages", this.activeRoomMessages);
      if (roomMessages.length > 0) {
        this.scrollToId(roomMessages[roomMessages.length - 1].messageId);
      }
      this.publishReadStatus();
    }
  }

  async encryptMessage(message: string) {
    console.log("Ongoing PlainText Message", message);
    let encryptedMessage = await this.signalManagerService.encryptMessageAsync(Utility.getCurrentActiveRoomId(), message)
      .catch(err => {
        console.error(err);
        return message;
      })
    console.log("Ongoing encryptedMessage", encryptedMessage)
    return encryptedMessage;
  }

  scrollToId(id) {
    setTimeout(() => {
      this.elementRef.nativeElement.querySelector("#s" + id).scrollIntoView(true, { behaviour: 'smooth', block: "end", inline: 'end' });
    }, 200)
  }

  shouldPublishReadStatus(message) {
    if (!message) return false;
    if (message.from == Utility.getCurrentUserId()) return false;
    if (message.messageStatus == MessageStatus.read) return false;
    if (message.readUsers.has(Utility.getCurrentUserId())) return false;
    return true;
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.messageChangesSub.unsubscribe();
    this.msgStatusChangesSub.unsubscribe();
    // this.destroyTyping.next(false);
    // this.destroyTyping.complete();
  }

}
