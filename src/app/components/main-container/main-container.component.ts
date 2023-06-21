import { Component, OnInit } from '@angular/core';
import { Utility } from 'src/app/utility/utility';
import { MqttConnectorService } from '../../services/mqtt/mqtt-connector.service';
import { UserService } from '../../services/users/user.service';
@Component({
  selector: 'app-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.scss']
})
export class MainContainerComponent implements OnInit {
  seedValue: string;

  ngOnInit(): void {
    Utility.setCurrentActiveRoomId("");
  }
}
