import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { map, take } from 'rxjs';
import { Utility } from '../../../app/utility/utility';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  allUsers: User[] = [];
  currentUser: any;

  //db
  usersRef: AngularFirestoreCollection<User>;

  constructor(private db: AngularFirestore) {
    this.usersRef = db.collection('users');
    //this.currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
  }

  // getLoggedInUser(userId){
  //   return new Promise((resolve, reject) =>{
  //     this.usersRef.doc(userId).snapshotChanges().pipe(map(changes =>
  //       changes.map(c =>
  //         ({ id: c.payload.doc.id, ...c.payload.doc.data() })
  //       )
  //     )).subscribe({
  //       next: user => {
  //         const x = user.data();
  //         this.loggedInUser = user;
  //         resolve(user)
  //       },
  //       error: err => reject(err),
  //       complete: () => console.log('GetAllUsers request complete')
  //     })
  //   })
  // }

  getCurrentUser(userId) {
    return new Promise((resolve, reject) => {
      const docRef = this.db.collection('users').doc(userId);
      docRef.get().subscribe({
        next: user => {
          if (user.exists) {
            this.currentUser = user.data();
            Utility.setCurrentUser(this.currentUser);
            Utility.setCurrentUserId(this.currentUser.id);
          }
          resolve(user.data())
        },
        error: err => reject(err),
        complete: () => console.log('Get current user request complete')
      })
    });
  }

  getUserById(userId) {
    return new Promise((resolve, reject) => {
      const docRef = this.db.collection('users').doc(userId);
      docRef.get().subscribe({
        next: user => {
          if (user.exists) {
            resolve(user.data());
          }
        },
        error: err => reject(err),
        complete: () => console.log('Get user by id request complete')
      })
    });

  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.collection('/users', ref => ref.where('emailVerified', '==', true))
      .snapshotChanges().pipe(map(changes =>
        changes.map((c:any) =>
          ({ id: c.payload.doc.id, ...c.payload.doc.data() })
        )
      )).subscribe({
        next: users => {
          this.allUsers = users;
          resolve(users)
        },
        error: err => reject(err),
        complete: () => console.log('GetAllUsers request complete')
      });
    });
  }

  addUser(userPost: User): Promise<any> {
    //const user = userPost.ma((obj) => { return Object.assign({}, obj) });
    return this.usersRef.doc(userPost.id).set(Object.assign({}, userPost))
      //return this.usersRef.add({ ...userPost, })
      .then((res) => {
        return res;
      })
      .catch(error => {
        return Promise.reject(error);
      })
  }

  updateUser(userPost: User): Promise<any> {
    return this.usersRef.doc(userPost.id).update(userPost)
      .then(res => {
        return res;
      })
      .catch(err => {
        return Promise.reject(err);
      })
  }

  deleteUser(userId): Promise<any> {
    let x = this.db.doc(`users/${userId}`);
    return x.delete()
      .then(res => {
        return res;
      })
      .catch(err => {
        return Promise.reject(err);
      })
  }
}
