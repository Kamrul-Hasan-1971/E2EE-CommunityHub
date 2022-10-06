import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  collectionTablesName: any;
  userPosts$: Observable<User[]>;

  constructor(private db: AngularFirestore) {
    
  }



  // ovserveUserChange() {
  //   this.angularFirestore.collection<User>('users').valueChanges({ idField: 'id' }).subscribe(changes => {
  //   })
  // }

}


