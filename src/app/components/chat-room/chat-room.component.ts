import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageData } from '../../interfaces/messageData';
import { MqttConnectorService } from '../../services/mqtt/mqtt-connector.service';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import { CommonService } from '../../services/common/common.service';
import { RoomService } from '../../services/room/room.service';
import { MqttUtility } from '../../utility/mqtt-utility/mqtt-utility';
import { MqttPerTopic } from '../../models/mqtt-persistent-topic-enum';
import { Utility } from '../../utility/utility';
import { PouchDbService } from '../../services/clientDB/pouch-db.service';
import { DataStateService } from '../../services/data-state.service';
import { RoomData } from '../../interfaces/roomData';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MatDialog } from '@angular/material/dialog';
import { MessageStatusModalComponent } from 'src/app/components/modals/message-status-modal/message-status-modal.component';


@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
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
  @Output() chatData: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public dialog: MatDialog,
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private pouchDbService: PouchDbService,
    private roomService: RoomService,
    private mqttConnectorService: MqttConnectorService,
    private commonService: CommonService,
    private dataStateService: DataStateService
  ) {}

  openMessageStatusModal(message): void {
    let enterAnimationDuration: string = '0ms',
      exitAnimationDuration: string = '0ms';
    const dialogRef = this.dialog.open(MessageStatusModalComponent, {
      width: '400px',
      height: '500px',
      data: { message: message },
      panelClass: 'custom-modalbox',
      enterAnimationDuration,
      exitAnimationDuration,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('ChatRoomComponent:: The dialog was closed');
    });
  }

  ngOnInit(): void {
    this.currentUser = Utility.getCurrentUser();
    this.routerSubscription();
    this.sendMessageSubscription();
    this.messageChangesSubscription();
    this.msgStatusChangesSubscription();
    this.dbInitializationCompleteSubscription();
  }

  routerSubscription() {
    this.routeSub = this.route.params.subscribe(async (params) => {
      this.roomId = params['id'];
      if (this.roomId) {
        this.isGroupRoom =
          Utility.getCurrentActiveRoomId() == Utility.getCommunitityId();
        Utility.setCurrentActiveRoomId(this.roomId);
        this.room = await this.roomService.getRoomDataByRoomID(this.roomId);
        this.roomService.roomeChange.next(this.roomId);
        this.roomService.activeRoomIdSubject.next(this.roomId);
        this.roomService.inputBoxVisibilitySub.next(true);
        if (
          this.dataStateService.getRoomsConversationState(this.roomId).length >
          0
        ) {
          this.activeRoomMessages =
            this.dataStateService.getRoomsConversationState(this.roomId);
          this.scrollToId(
            this.activeRoomMessages[this.activeRoomMessages.length - 1]
              .messageId
          );
          this.publishReadStatus();
        } else {
          this.loadMessageFormDbInitially();
          this.publishReadStatus();
        }
      } else {
        this.roomService.activeRoomIdSubject.next('');
        Utility.setCurrentActiveRoomId('');
        this.roomService.inputBoxVisibilitySub.next(false);
      }
    });
  }

  publishReadStatus() {
    this.activeRoomMessages.forEach((message) => {
      if (this.shouldPublishReadStatus(message)) {
        console.log('ChatRoomComponent:: message', message);
        const statusPayload = {
          messageId: message.messageId,
          messageStatus: MessageStatus.read,
          from: Utility.getCurrentUserId(),
        };
        console.log(
          'ChatRoomComponent:: Publishing read status',
          'msgId',
          message.messageId,
          'statusPayload',
          statusPayload
        );
        this.mqttConnectorService.publishToPersistentClient(
          MqttUtility.parseMqttTopic(
            MqttPerTopic.messageStatus,
            Utility.getCurrentActiveRoomId()
          ),
          statusPayload
        );
        if (!message.isGroupRoom) {
          this.mqttConnectorService.publishToPersistentClient(
            MqttUtility.parseMqttTopic(
              MqttPerTopic.messageStatus,
              Utility.getCurrentUserId()
            ),
            statusPayload
          );
        }
      }
    });
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
      };
      if (this.roomId == Utility.getCommunitityId()) {
        messageObj.isGroupRoom = true;
        messageObj.roomMemberCount = parseInt(Utility.getRoomCount());
      }
      const messageObjForReceiver = _.cloneDeep(messageObj);

      messageObj.deliveredUsers = new Set<string>();
      messageObj.readUsers = new Set([Utility.getCurrentUserId()]);

      this.pouchDbService.saveMessageToMessageDb(messageObj);
      this.dataStateService.addMessageToRoomConversationState(
        this.roomId,
        messageObj
      );
      this.commonService.roomListChangesForLastMessage$.next(messageObj);

      if (Utility.getCurrentActiveRoomId() != Utility.getCommunitityId()) {
        const encryptedMessage = await this.encryptMessage(message);
        messageObjForReceiver.message = encryptedMessage;
      }

      let publishTopic = MqttUtility.parseMqttTopic(
        MqttPerTopic.roomInbox,
        this.roomId
      );
      this.mqttConnectorService.publishToPersistentClient(
        publishTopic,
        messageObjForReceiver
      );

      this.scrollToId(messageObj.messageId);
    });
  }

  messageChangesSubscription() {
    this.messageChangesSub = this.pouchDbService.messageChanges.subscribe(
      (changes: any) => {
        const message = changes.doc;
        const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
        this.dataStateService.addMessageToRoomConversationState(
          msgRoomId,
          message
        );
        if (msgRoomId == this.roomId) {
          this.scrollToId(message.messageId);
          this.publishSingleMessageReadStatus(message);
        }
      }
    );
  }

  publishSingleMessageReadStatus(message) {
    if (this.shouldPublishReadStatus(message)) {
      const statusPayload = {
        messageId: message.messageId,
        messageStatus: MessageStatus.read,
        from: Utility.getCurrentUserId(),
      };
      console.log(
        'ChatRoomComponent:: Publishing read status',
        'msgId',
        message.messageId,
        'statusPayload',
        statusPayload
      );
      this.mqttConnectorService.publishToPersistentClient(
        MqttUtility.parseMqttTopic(
          MqttPerTopic.messageStatus,
          Utility.getCurrentActiveRoomId()
        ),
        statusPayload
      );
      if (!message.isGroupRoom) {
        this.mqttConnectorService.publishToPersistentClient(
          MqttUtility.parseMqttTopic(
            MqttPerTopic.messageStatus,
            Utility.getCurrentUserId()
          ),
          statusPayload
        );
      }
    }
  }

  msgStatusChangesSubscription() {
    this.msgStatusChangesSub = this.pouchDbService.msgStatusChanges.subscribe(
      (changes: any) => {
        const message = changes.doc;
        const msgRoomId = Utility.getMsgRoomId(message.to, message.from);
        this.dataStateService.addMessageToRoomConversationState(
          msgRoomId,
          message
        );
      }
    );
  }

  dbInitializationCompleteSubscription() {
    this.pouchDbService.dbInitializationCompleteSubscription.subscribe(
      (res) => {
        this.loadMessageFormDbInitially();
      }
    );
  }

  async loadMessageFormDbInitially() {
    let roomMessages: any[];
    if (this.roomId == Utility.getCommunitityId()) {
      roomMessages =
        await this.pouchDbService.getCommunityRoomConversationByRoomId(
          this.roomId
        );
    } else {
      roomMessages = await this.pouchDbService.getRoomConversationByRoomId(
        this.roomId
      );
    }
    console.log('ChatRoomComponent:: RoomId', this.roomId, 'Room messages', roomMessages);
    if (roomMessages) {
      roomMessages = roomMessages.sort((a, b) =>
        a.orderId > b.orderId ? 1 : -1
      );
      for (let roomMessage of roomMessages) {
        this.dataStateService.addMessageToRoomConversationState(
          this.roomId,
          roomMessage
        );
      }
      this.activeRoomMessages = this.dataStateService.getRoomsConversationState(
        this.roomId
      );
      console.log(
        'ChatRoomComponent:: RoomId',
        this.roomId,
        'activeRoomMessages messages',
        this.activeRoomMessages
      );
      if (roomMessages.length > 0) {
        this.scrollToId(roomMessages[roomMessages.length - 1].messageId);
      }
      this.publishReadStatus();
    }
  }

  async encryptMessage(message: string) {
    return message;
  }

  scrollToId(id) {
    setTimeout(() => {
      this.elementRef.nativeElement
        .querySelector('#s' + id)
        .scrollIntoView(true, {
          behaviour: 'smooth',
          block: 'end',
          inline: 'end',
        });
    }, 200);
  }

  shouldPublishReadStatus(message) {
    if (!message) {
      console.log('ChatRoomComponent:: message is empty, no need to publish');
      return false;
    }
    if (message.from == Utility.getCurrentUserId()) {
      console.log('ChatRoomComponent:: message from currentUserId, no need to publish');
      return false;
    }
    if (message.messageStatus == MessageStatus.read) {
      console.log('ChatRoomComponent:: message status is already read, no need to publish');
      return false;
    }
    if (message.readUsers.has(Utility.getCurrentUserId())) {
      console.log(
        'ChatRoomComponent:: currentuser id is present int message readUser set, no need to publish'
      );
      return false;
    }
    return true;
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.messageChangesSub.unsubscribe();
    this.msgStatusChangesSub.unsubscribe();
  }
}
