import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataStateService } from 'src/app/services/data-state.service';
import { Utility } from 'src/app/utility/utility';

@Component({
  selector: 'app-message-status-modal',
  templateUrl: './message-status-modal.component.html',
  styleUrls: ['./message-status-modal.component.scss']
})
export class MessageStatusModalComponent implements OnInit {

  message ;

  constructor(
    public dataStateService : DataStateService,
    public dialogRef: MatDialogRef<MessageStatusModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    }

  ngOnInit(): void {
    console.log("MessageStatusModalComponent:: ",this.data.message);
    this.message = this.data.message;
  }

}
