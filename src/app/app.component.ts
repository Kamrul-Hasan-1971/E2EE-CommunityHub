import { Component, OnDestroy, OnInit } from '@angular/core';
//import { MessageData } from '../interfaces/messageData';
//import { CommonService } from '../services/common/common.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit,OnDestroy{
  title = 'mqtt';
 // clientId: number = 0;
  // onKey(event) {
  //   this.commonService.clinetId = event.target.value as number;
  // }

  // onKey2(event) {
  //   this.commonService.senderId = event.target.value as number;
  //   this.start();
  // }

  // start() {
  //   let user = this.commonService.user[this.commonService.clinetId];
  //   localStorage.setItem('user', JSON.stringify(user))
  //   this.mqttConnectorService.init();
  // }
  constructor(
    //private router: Router,
    //private mqttConnectorService: MqttConnectorService,
    //private commonService: CommonService
  ) {
  }

  // demoInit() {
  //   let users = [
  //     {
  //       email: "icthasan36@gmail.com",
  //       id: "87fdb823-0ce6-4506-a374-590135d2acc9",
  //       name: "Md. Kamrul Hasan",
  //       password: "123456"
  //     },
  //     {
  //       email: "icthasan37@gmail.com",
  //       id: "67928dd4-bc19-449a-8930-b1a75c697e77",
  //       name: "Md. Raihan Uddin",
  //       password: "123456"
  //     },
  //     {
  //       email: "icthasan38@gmail.com",
  //       id: "bc7dd2ff-ae45-48dd-ae0f-0eb849022a32",
  //       name: "Md. Mehedi Hasan",
  //       password: "123456"
  //     },
  //     {
  //       email: "icthasan39@gmail.com",
  //       id: "12c1dcd7-c540-43ed-ab78-a3774a2ba973",
  //       name: "Md. Helal Uddin",
  //       password: "123456"
  //     }
  //   ]
  //   localStorage.setItem('users',JSON.stringify(users));
  // }

  ngOnInit() {
    //this.demoInit();
    // const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    // if (loggedInUser) {
    //   this.router.navigate(['/']);
    // }
    // else {
    //   this.router.navigate(['/sign-in']);
    //   return;
    // }
  }

  ngOnDestroy() {
    console.log("1");
  }
  
}
