import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from 'rxjs';
import { Utility } from 'src/app/utility/utility';
import { RoomService } from '../../services/room/room.service';
import { MqttUtility } from 'src/app/utility/mqtt-utility/mqtt-utility';
import { MqttNonPerTopic } from 'src/app/models/mqtt-non-persistent-topic-enum';
import { MqttConnectorService } from 'src/app/services/mqtt/mqtt-connector.service';
import { EventService } from 'src/app/services/event.service';
import { DataStateService } from 'src/app/services/data-state.service';
import { RoomData } from 'src/app/interfaces/roomData';

@Component({
  selector: 'app-chat-area',
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss'],
})
export class ChatAreaComponent implements OnInit, OnDestroy, AfterViewInit {
  subs: Subscription;
  paramValue: string;
  inputBoxVisibility: boolean = false;
  sendMessageForm: FormGroup;
  destroyAllGlobalSubscriptionSubject = new Subject<any>();
  lastTypingStatusSendTime = 0;
  destroyTyping = new Subject<any>();
  typingName = '';
  typingTimer: any;
  typing = new BehaviorSubject<boolean>(false);
  typing$ = this.typing.asObservable();
  isGroupRoom: boolean = false;
  room: RoomData;

  lastActiveTime = '';
  destroyMainStatus = new Subject<any>();
  statusTTL = 60000;
  isOnline: boolean = false;
  lastSeen: any;

  constructor(
    private roomService: RoomService,
    private cdRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private mqttConnectorService: MqttConnectorService,
    private eventService: EventService,
    private dataStateService: DataStateService
 ) {}

  activeStatusSubscription() {
    this.destroyMainStatus = new Subject<any>();
    this.eventService.activeStatusPayload$
      .pipe(takeUntil(this.destroyMainStatus))
      .subscribe((statusPayload: any) => {
        if (statusPayload) {
          console.log('app-chat-area:: user-online-status-payload', statusPayload);
          this.setRoomActiveStatusToRoomData(
            statusPayload.from,
            statusPayload.status.lastSeen
          );
          if (statusPayload.from == Utility.getCurrentActiveRoomId()) {
            this.handleUserOnlineStatus(
              statusPayload.status.lastSeen,
              statusPayload.status.isOnline
            );
          }
        }
      });
  }

  async setRoomActiveStatusToRoomData(roomId: string, lastSeen) {
    let room = await this.roomService.getRoomDataByRoomID(roomId);
    if (room) {
      room.lastSeen = lastSeen;
    }
  }

  handleUserOnlineStatus(lastSeen, isOnline) {
    if (this.isActive(lastSeen) && isOnline) {
      this.isOnline = true;
    } else {
      this.isOnline = false;
    }
    this.lastSeen = Utility.getProcessedDate(lastSeen);
  }

  isActive(lastSeen: number) {
    const now = new Date().getTime();
    const difference = now - lastSeen;
    console.log('app-chat-area:: Onlinestatus now',now,'lastseen',lastSeen,'difference',difference);
    return difference <= this.statusTTL;
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {
    this.roomChangeSubscription();
    this.inputBoxVisibilitySubscription();
    this.initSenMessageForm();
    this.onTypingMessageAction();
    this.subscribeToTypingPayload();
    this.activeStatusSubscription();
  }

  subscribeToTypingPayload() {
    this.destroyTyping = new Subject<any>();
    this.eventService.typingPayload$
      .pipe(takeUntil(this.destroyTyping))
      .subscribe(async (payload: any) => {
        console.log('app-chat-area:: Typing-payload', payload);
        const typingPayload = { ...payload };
        if (typingPayload.roomId == Utility.getCurrentActiveRoomId()) {
          this.isGroupRoom =
            Utility.getCurrentActiveRoomId() == Utility.getCommunitityId();
          this.typingName = this.dataStateService.getRoomNameFromRoomState(
            typingPayload.from
          );
          this.typing.next(true);
          this.startTypingTimer();
        }
      });
  }

  startTypingTimer() {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.typingName = '';
      this.typing.next(false);
    }, 2500);
  }

  inputBoxVisibilitySubscription() {
    this.roomService.inputBoxVisibilitySub.subscribe(
      (inputBoxVisibility: boolean) => {
        this.inputBoxVisibility = inputBoxVisibility;
      }
    );
  }

  roomChangeSubscription() {
    this.roomService.roomeChange.subscribe(async (roomId) => {
      if (this.room && this.room.id != Utility.getCommunitityId()) {
        const previousRoomTopic = MqttUtility.parseMqttTopic(
          MqttNonPerTopic.activeStatus,
          this.room.id
        );
        this.mqttConnectorService.unsubscribeSigleNonPersistentTopic(
          previousRoomTopic
        );
      }
      if (roomId != Utility.getCommunitityId()) {
        const roomTopic = MqttUtility.parseMqttTopic(
          MqttNonPerTopic.activeStatus,
          roomId
        );
        this.mqttConnectorService.subscribeToNonPersistentClient([roomTopic]);
      }

      this.sendMessageForm.reset();
      this.isGroupRoom =
        Utility.getCurrentActiveRoomId() == Utility.getCommunitityId();
      this.room = await this.roomService.getRoomDataByRoomID(roomId);

      this.lastSeen = null;
      this.isOnline = false;
    });
  }

  initSenMessageForm() {
    this.sendMessageForm = this.formBuilder.group({
      sendMessage: [''],
    });
  }

  onTypingMessageAction() {
    this.sendMessageForm.controls['sendMessage'].valueChanges
      .pipe(
        takeUntil(this.destroyAllGlobalSubscriptionSubject),
        debounceTime(300),
        tap(() => {
          console.log('app-chat-area:: messageControl.valueChanges');
          const now = new Date().getTime();
          if (now - this.lastTypingStatusSendTime > 5000) {
            if (
              this.sendMessageForm.value.sendMessage &&
              this.sendMessageForm.value.sendMessage.length > 0
            ) {
              this.lastTypingStatusSendTime = now;
              this.publishTypingStatus();
            }
          }
        })
      )
      .subscribe();
  }

  publishTypingStatus() {
    const typingPayload = {
      roomId:
        Utility.getCurrentActiveRoomId() == Utility.getCommunitityId()
          ? Utility.getCommunitityId()
          : Utility.getCurrentUserId(),
      type: 'typing',
      from: Utility.getCurrentUserId(),
    };
    console.log('app-chat-area:: publishing typing for group',typingPayload,'in',MqttUtility.parseMqttTopic(MqttNonPerTopic.typing,Utility.getCurrentActiveRoomId()));
    this.mqttConnectorService.publishToNonPersistentClient(
      MqttUtility.parseMqttTopic(
        MqttNonPerTopic.typing,
        Utility.getCurrentActiveRoomId()
      ),
      typingPayload
    );
  }

  async formSubmit() {
    if (this.sendMessageForm.invalid) {
      return;
    }
    const message = this.sendMessageForm.value.sendMessage;
    this.sendMessageForm.reset();
    if (message) this.roomService.sendMessage.next(message);
  }

  ngOnDestroy() {
    this.destroyAllGlobalSubscriptionSubject.next(null);
    this.destroyAllGlobalSubscriptionSubject.complete();
  }
}
