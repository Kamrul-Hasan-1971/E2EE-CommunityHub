import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  convoState:any;
  constructor() { 
    this.convoState = JSON.parse(localStorage.getItem('convoState'));
  }
}
