import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { Subscription } from 'rxjs';
import { PouchDbService } from '../../services/clientDB/pouch-db.service';
import { RoomService } from '../../services/room/room.service';

import { RoomData } from '../../interfaces/roomData';
import { Utility } from 'src/app/utility/utility';

@Component({
  selector: 'app-sidebar-content',
  templateUrl: './sidebar-content.component.html',
  styleUrls: ['./sidebar-content.component.scss'],
})
export class SidebarContentComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterContentChecked
{
  @Input() roomData: RoomData;
  subs: Subscription[] = [];
  active: boolean = false;
  unreadClassActive: boolean = false;

  constructor(
    private roomService: RoomService,
    private pouchDbService: PouchDbService,
    private cdRef: ChangeDetectorRef
  ) {
    this.subscribeToActiveRoom();
    this.subscribeToAddUnreadClass();
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  subscribeToAddUnreadClass() {
    this.subs.push(
      this.roomService.addUnreadClass.subscribe((roomId) => {
        if (
          this.roomData.id === roomId &&
          Utility.getCurrentActiveRoomId() !== roomId
        ) {
          this.unreadClassActive = true;
        }
      })
    );
  }

  subscribeToActiveRoom() {
    this.subs.push(
      this.roomService.activeRoomIdSubject.subscribe((roomId) => {
        this.active = this.roomData.id === roomId;
      })
    );
  }

  ngOnInit(): void {
    this.active = this.roomData.id === Utility.getCurrentActiveRoomId();
    if (this.roomData.hasUnreadMessage) {
      this.unreadClassActive = true;
    }
  }

  onClick(): void {
    if (this.active) return;
    if (this.roomData.hasUnreadMessage) {
      this.roomData.hasUnreadMessage = false;
      this.pouchDbService.saveRoomDataToChatRoomDb(this.roomData);
      this.unreadClassActive = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.map((s) => s.unsubscribe());
  }
}
