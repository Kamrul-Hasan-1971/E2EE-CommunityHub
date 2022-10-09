import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { RoomData } from '../../../interfaces/roomData';
import { UserService } from '../../../services/users/user.service';
import { CommonService } from '../../../services/common/common.service';
import { AuthService } from '../../../services/auth/auth.service';
import { MqttConnectorService } from '../../../services/mqtt/mqtt-connector.service';
import { Utility } from '../../../../app/utility/utility';
import { PayloadProcessorService } from '../../../services/payloadProcessor/payload-processor.service';
import { PouchDbService } from '../../../services/clientDB/pouch-db.service';
import { DataStateService } from '../../../services/data-state.service';
import { RoomService } from '../../../services/room/room.service';
import { LoaderService } from 'src/app/services/loader/loader.service';
import { SignalManagerService } from 'src/app/services/signal/signal-manager.service';
import { SignalServerStoreService } from 'src/app/services/signal/signal-server-store.service';
import { EventService } from 'src/app/services/event.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  roomData: RoomData[] = [];
  searchfilteredRoomData: RoomData[] = [];
  lastMessage: string;
  searchForm: FormGroup;
  subs: Subscription[] = [];
  currentUser: any;
  communityRoom: RoomData;
  destroyNewUserInCommunity = new Subject<any>();
  activeStatusTimer: any;

  constructor(
    private commonService: CommonService,
    public authService: AuthService,
    private userService: UserService,
    private mqttConnectorService: MqttConnectorService,
    private formBuilder: FormBuilder,
    private payloadProcessorService: PayloadProcessorService,
    private pouchDbService: PouchDbService,
    private dataStateService: DataStateService,
    private roomService: RoomService,
    private loaderService: LoaderService,
    private signalManagerService: SignalManagerService,
    private signalServerStoreService: SignalServerStoreService,
    private eventService: EventService,
    //private cdRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.communityRoom = this.dataStateService.communityRoom;
    Utility.setCommunitityId(this.communityRoom.id);
    this.loaderService.setLoading(true);
    this.currentUser = Utility.getCurrentUser();
    this.signalManagerService.init();
    this.init();
    this.getRoomData();
    this.initSearchForm();
    this.subscribeSearchBoxForm();
    this.subscribechangesRoomListForLastMessage();
    this.subscribeToNewUserInCommunityPayload();
    this.mqttConnectorService.publishActiveStatus();
    this.activeStatusTimer = setInterval(() => {
      this.mqttConnectorService.publishActiveStatus();
    }, 60000);
  }



  subscribechangesRoomListForLastMessage() {
    this.subs.push(this.commonService.roomListChangesForLastMessage$.subscribe(async (lastMessageObj) => {
      let messageRoomId = lastMessageObj.from;
      if (lastMessageObj.from == Utility.getCurrentUserId() || lastMessageObj.to == this.communityRoom.id) {
        messageRoomId = lastMessageObj.to;
      }
      let chatRoom = await this.roomService.getRoomDataByRoomID(messageRoomId);
      chatRoom.lastMessage = Utility.sliceString(lastMessageObj.message);
      chatRoom.roomOrderId = lastMessageObj.orderId;
      chatRoom.hasUnreadMessage = (Utility.getCurrentActiveRoomId() != messageRoomId);
      this.roomService.addUnreadClass.next(messageRoomId);

      if (messageRoomId != this.communityRoom.id) {
        this.roomData.sort(this.compare);
      }

      let changes = {
        _id: messageRoomId,
        lastMessage: Utility.sliceString(lastMessageObj.message),
        time: lastMessageObj.time,
        hasUnreadMessage: chatRoom.hasUnreadMessage
      }
      this.pouchDbService.saveChnagesForLastMessageToRoomDataInChatRoomDb(changes);
    }))
  }

  // setRoomLastMessageObject(roomId: string, lastMessage: string) {
  //   let roomState = this.dataStateService.getRoomState(roomId);
  //   if (roomState) {
  //     roomState.lastMessage = Utility.sliceString(lastMessage);
  //   }
  // }

  // setRoomOrderId(roomId, roomOrderId) {
  //   let roomState = this.dataStateService.getRoomState(roomId);
  //   if (roomState) {
  //     roomState.roomOrderId = roomOrderId;
  //   }
  // }

  initSearchForm() {
    this.searchForm = this.formBuilder.group({
      searchBox: [''],
    });
  }

  compare(a, b) {
    if (a.roomOrderId > b.roomOrderId) {
      return -1;
    }
    else if (a.roomOrderId < b.roomOrderId) {
      return 1;
    }
    if (a.name.toLowerCase() <= b.name.toLowerCase()) {
      return -1;
    }
    return 0;
  }

  // async preInit() {
  //   await this.pouchDbService.init();
  // }

  async init() {
    if (!this.userService.redirectFromLoggedIn) {
      this.userService.redirectFromLoggedIn = false;
      await this.pouchDbService.init();
      this.payloadProcessorService.payloadProcessorServiceInit();
      this.mqttConnectorService.mqttConnectorServiceInit();
    }
    //this.mqttConnectorService.publishRemoveSignalProtocolSession(false);
    let previouslyCreatedSignalData = await this.pouchDbService.getSignalStoreData()
    //   .catch(async (err) => {
    //     console.log("Error when fetching store data from db", err);
    //     //await this.signalManagerService.initializeAsync(Utility.getCurrentUserId());
    //     //this.mqttConnectorService.publishRemoveSignalProtocolSession();
    //     //console.log("Newly signal data generate done");
    //   })
    if (previouslyCreatedSignalData && previouslyCreatedSignalData[0]) {
      this.signalManagerService.initaitePreviouslyCreatedSignalData(previouslyCreatedSignalData[0]);
      console.log("previouslyCreatedSignalData", previouslyCreatedSignalData[0]);
    }
  }

  subscribeToNewUserInCommunityPayload() {
    this.destroyNewUserInCommunity = new Subject<any>();
    this.eventService.newUserInCommunity$
      .pipe(takeUntil(this.destroyNewUserInCommunity))
      .subscribe(async (payload: any) => {
        console.log('New user payload', payload);
        const alreadyInRoomData = this.roomData.includes(payload.id);
        if (!alreadyInRoomData) {
          this.roomData.push(payload);
          this.pouchDbService.saveRoomsDataToChatRoomDb([payload]);
        }
      });
  }


  async getRoomData() {
    const currentUserId = Utility.getCurrentUserId();
    this.roomData = await this.userService.getAllUsers() as RoomData[];
    this.roomData = this.roomData.filter(room => room.id != currentUserId);
    this.roomData.forEach(room => {
      this.dataStateService.setRoomState(room.id, room);
    });
    this.dataStateService.setRoomState(this.communityRoom.id, this.communityRoom);

    const roomDataFromChatRoomDB: any[] = await this.pouchDbService.getAllChatRoom();
    console.log("roomDataFromChatRoomDB", roomDataFromChatRoomDB);

    roomDataFromChatRoomDB.forEach(async (roomFromDb) => {
      let roomState = await this.roomService.getRoomDataByRoomID(roomFromDb.doc.id);
      if (roomState) {
        roomState.hasUnreadMessage = roomFromDb.doc.hasUnreadMessage;
        delete roomState['lastSeen']
        //roomState.lastSeen = roomFromDb.doc.lastSeen;
        roomState.lastMessage = Utility.sliceString(roomFromDb.doc.lastMessage || "");
        roomState.roomOrderId = roomFromDb.doc.roomOrderId;
      }
    });
    this.roomData.sort(this.compare);
    Utility.setRoomCount(this.roomData.length + 1);
    this.pouchDbService.saveRoomsDataToChatRoomDb(this.roomData);
    this.pouchDbService.saveRoomDataToChatRoomDb(this.communityRoom);
    //this.roomData = this.roomData.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    this.searchfilteredRoomData = this.roomData;
    this.loaderService.setLoading(false);
    //console.log("Fetched roomData: ",this.roomData);
  }

  subscribeSearchBoxForm() {
    this.subs.push(this.searchForm.controls['searchBox'].valueChanges.subscribe(
      (searchText) => {
        if (searchText) {
          this.searchfilteredRoomData = this.roomData.filter(room => room.name.toLowerCase().indexOf(searchText.toLowerCase()) >= 0);
        }
        else {
          this.searchfilteredRoomData = this.roomData;
        }
      }
    ));
  }

  async logout() {
    this.loaderService.setLoading(true);
    this.mqttConnectorService.publishRemoveSignalProtocolSession(true);
    await this.pouchDbService.deleteAllPouchDB();
    await this.authService.SignOut();
    this.mqttConnectorService.publishActiveStatus(false);
    await this.signalServerStoreService.deletePreKeyBundle(Utility.getCurrentUserId());
    this.loaderService.setLoading(false);
  }

  ngOnDestroy(): void {
    if (this.activeStatusTimer) clearInterval(this.activeStatusTimer);
    console.log("3");
    this.subs.map(s => s.unsubscribe());
  }

}
