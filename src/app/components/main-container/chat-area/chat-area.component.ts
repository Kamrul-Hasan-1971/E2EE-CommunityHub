import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, Subject, Subscription, takeUntil, tap } from 'rxjs';
//import { PayloadProcessorService } from 'src/app/services/payloadProcessor/payload-processor.service';
import { SignalManagerService } from 'src/app/services/signal/signal-manager.service';
import { Utility } from 'src/app/utility/utility';
import { RoomService } from '../../../services/room/room.service';
import * as uuid from 'uuid';
import { MqttUtility } from 'src/app/utility/mqtt-utility/mqtt-utility';
import { MqttNonPerTopic } from 'src/app/models/mqtt-non-persistent-topic-enum';
import { MqttConnectorService } from 'src/app/services/mqtt/mqtt-connector.service';
import { EventService } from 'src/app/services/event.service';
import { DataStateService } from 'src/app/services/data-state.service';


@Component({
  selector: 'app-chat-area',
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss']
})
export class ChatAreaComponent implements OnInit, OnDestroy, AfterViewInit {
  subs: Subscription;
  paramValue: string;
  roomName: string = "";
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


  // lastActiveTime = "";
  // destroyMainStatus = new Subject<any>();
  // mainStatusPayload:any;
  // statusTTL = 35000;
  // isOnline: boolean = false;
  // lastSeen: any;



  constructor(
    private roomService: RoomService,
    private cdRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private mqttConnectorService: MqttConnectorService,
    //private payloadProcessorService: PayloadProcessorService,
    private eventService: EventService,
    private dataStateService: DataStateService,
  ) {
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  ngOnInit(): void {
    this.roomNameSubscription();
    this.inputBoxVisibilitySubscription();
    this.initSenMessageForm();
    this.onTypingMessageAction();
    //this.activeStatusSubscription();
    this.subscribeToTypingPayload();
  }

  subscribeToTypingPayload() {
    this.destroyTyping = new Subject<any>();
    this.eventService.typingPayload$
      .pipe(takeUntil(this.destroyTyping))
      .subscribe(async (payload: any) => {
        console.log('ChatThread: Typing-payload', payload);
        const typingPayload = { ...payload };
        if (typingPayload.roomId == Utility.getCurrentActiveRoomId()) {
          this.isGroupRoom = Utility.getCurrentActiveRoomId() == Utility.getCommunitityId();
          this.typingName = this.dataStateService.getRoomNameFromRoomState(typingPayload.from);
          this.typing.next(true);
          //this.changeDetectorRef.detectChanges();
          this.startTypingTimer();
        }
      });
  }

  startTypingTimer() {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.typingName = '';
      this.typing.next(false);
      // this.changeDetectorRef.detectChanges();
    }, 2500);
  }

  // activeStatusSubscription()
  // {
  //     this.destroyMainStatus = new Subject<any>();
  //     this.payloadProcessorService.activeStatusPayload$
  //       .pipe(takeUntil(this.destroyMainStatus))
  //       .subscribe((statusPayload: any) => {
  //         statusPayload = {
  //           fromUser: Utility.getCurrentActiveRoomId(),
  //           status: {
  //             isOnline: true,
  //             lastSeen: Date.now(),
  //           },
  //         };
  //         const payload = { ...statusPayload };
  //         console.log('user-online-status-payload',payload);
  //         if (payload  && payload.fromUser === Utility.getCurrentActiveRoomId()) {
  //           console.log('!!!main-status-payload inside if',payload);
  //           this.mainStatusPayload = payload;
  //           this.handleUserOnlineStatus(payload);
  //           console.log('ChatThread: ----last-seen-time----',this.lastSeen);
  //           console.log('ChatThread: cd calling detectchanges from lastseen status update!');
  //         }
  //       });
  // }

  // handleUserOnlineStatus(onlineStatusPayload: any) {
  //   if (
  //     onlineStatusPayload &&
  //     onlineStatusPayload.status &&
  //     onlineStatusPayload.status.isOnline &&
  //     this.mainStatusValidator(onlineStatusPayload.status.lastSeen)
  //   ) {
  //     this.isOnline = true;
  //   } else {
  //     this.isOnline = false;
  //   }
  //   if (onlineStatusPayload && onlineStatusPayload.status) {
  //     this.lastSeen = {
  //       ...this.getProcessedDate(onlineStatusPayload.status.lastSeen),
  //     };
  //   } else {
  //     this.lastSeen = undefined;
  //   }
  // }

  // mainStatusValidator(lastSeen: number) {
  //   const now = new Date().getTime();
  //   console.log('ChatThread: #&&#-now', now);
  //   console.log('ChatThread: #&&#-lastSeen', lastSeen);
  //   const difference = now - lastSeen;
  //   console.log('ChatThread: #&&#-difference', difference);
  //   return difference <= this.statusTTL;
  // }

  // getProcessedDate(time: any) {
  //   let fulldays = [
  //     'Sunday',
  //     'Monday',
  //     'Tuesday',
  //     'Wednesday',
  //     'Thursday',
  //     'Friday',
  //     'Saturday',
  //   ];
  //   let months = [
  //     'Jan',
  //     'Feb',
  //     'Mar',
  //     'Apr',
  //     'May',
  //     'Jun',
  //     'Jul',
  //     'Aug',
  //     'Sep',
  //     'Oct',
  //     'Nov',
  //     'Dec',
  //   ];

  //   var dt = (dt = new Date(time)),
  //     date = dt.getDate(),
  //     month = months[dt.getMonth()],
  //     timeDiff = time - Date.now(),
  //     diffDays = new Date().getDate() - date,
  //     diffMonth = new Date().getMonth() - dt.getMonth(),
  //     diffYears = new Date().getFullYear() - dt.getFullYear();
  //   if (diffYears === 0 && diffMonth === 0 && diffDays === 0) {
  //     return { day: 'Today', time: time };
  //   } else if (diffYears === 0 && diffMonth === 0 && diffDays === 1) {
  //     return { day: 'Yesterday', time: time };
  //   } else if (
  //     diffYears === 0 &&
  //     diffMonth === 0 &&
  //     diffDays < 7 &&
  //     diffDays >= 0
  //   ) {
  //     let dayName = fulldays[dt.getDay()];
  //     return { day: dayName, time: time };
  //   } else {
  //     return { day: `${month} ${date}`, time: time };
  //   }
  // }

  inputBoxVisibilitySubscription() {
    this.roomService.inputBoxVisibilitySub.subscribe((inputBoxVisibility: boolean) => {
      this.inputBoxVisibility = inputBoxVisibility;
    })
  }

  roomNameSubscription() {
    this.roomService.roomeName.subscribe((roomName) => {
      this.roomName = roomName;
      this.sendMessageForm.reset();
    })
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
          debugger
          console.log('ChatThread: messageControl.valueChanges');
          const now = new Date().getTime();
          if (now - this.lastTypingStatusSendTime > 5000) {
            if (this.sendMessageForm.value.sendMessage && this.sendMessageForm.value.sendMessage.length > 0) {
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
      roomId: (Utility.getCurrentActiveRoomId() == Utility.getCommunitityId()) ? Utility.getCommunitityId() : Utility.getCurrentUserId(),
      type: 'typing',
      from: Utility.getCurrentUserId(),
    };
    console.log(
      'publishing typing for group',
      typingPayload,
      'in',
      MqttUtility.parseMqttTopic(MqttNonPerTopic.typing, Utility.getCurrentActiveRoomId())
    );
    this.mqttConnectorService.publishToNonPersistentClient(
      MqttUtility.parseMqttTopic(MqttNonPerTopic.typing, Utility.getCurrentActiveRoomId()), typingPayload);
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
    console.log("5");
  }
}
