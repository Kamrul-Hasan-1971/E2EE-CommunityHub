import { Component, OnDestroy, OnInit } from '@angular/core';
import { MqttConnectorService } from '../../services/mqtt/mqtt-connector.service';
import { UserService } from '../../services/users/user.service';
@Component({
  selector: 'app-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.scss']
})
export class MainContainerComponent implements OnInit,OnDestroy {
  seedValue: string;

  constructor(
    private mqttConnectorService: MqttConnectorService,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {

    //const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    //console.log(loggedInUser);
    //localStorage.setItem('user', JSON.stringify(loggedInUser));
    //this.mqttConnectorService.connect(loggedInUser);
  }

  ngOnDestroy() {
    console.log("2");
  }

}
