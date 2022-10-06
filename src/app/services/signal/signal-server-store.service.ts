import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { HelpersService } from './helpers.service';

@Injectable({
  providedIn: 'root'
})
export class SignalServerStoreService {
  signalPreKeyBundleRef: AngularFirestoreCollection<any>;

  constructor(
    private helpersService: HelpersService,
    private db: AngularFirestore
  ) {
    this.signalPreKeyBundleRef = db.collection('signalPreKeyBundle');
  }
  /*
  * When a user logs on they should generate their keys and then register them with the server.
  */
  // registerNewPreKeyBundle(userId, preKeyBundle) {
  //   let storageBundle = { ...preKeyBundle }
  //   storageBundle.identityKey = this.helpersService.arrayBufferToBase64(storageBundle.identityKey)
  //   storageBundle.preKeys = storageBundle.preKeys.map(preKey => {
  //     return {
  //       ...preKey,
  //       publicKey: this.helpersService.arrayBufferToBase64(preKey.publicKey)
  //     }
  //   })
  //   storageBundle.signedPreKey.publicKey = this.helpersService.arrayBufferToBase64(storageBundle.signedPreKey.publicKey)
  //   storageBundle.signedPreKey.signature = this.helpersService.arrayBufferToBase64(storageBundle.signedPreKey.signature)
  //   localStorage.setItem(userId, JSON.stringify(storageBundle))
  // }

  async registerNewPreKeyBundle(userId, preKeyBundle): Promise<any> {
    let storageBundle = { ...preKeyBundle }
    storageBundle.identityKey = this.helpersService.arrayBufferToBase64(storageBundle.identityKey)
    storageBundle.preKeys = storageBundle.preKeys.map(preKey => {
      return {
        ...preKey,
        publicKey: this.helpersService.arrayBufferToBase64(preKey.publicKey)
      }
    })
    storageBundle.signedPreKey.publicKey = this.helpersService.arrayBufferToBase64(storageBundle.signedPreKey.publicKey)
    storageBundle.signedPreKey.signature = this.helpersService.arrayBufferToBase64(storageBundle.signedPreKey.signature)
    //let str = JSON.stringify(preKeyBundle);
    return this.signalPreKeyBundleRef.doc(userId).set(storageBundle)
      .then((res) => {
        return res;
      })
      .catch(error => {
        return Promise.reject(error);
      })
  }

  updatePreKeyBundle(userId, preKeyBundle) {
    return this.signalPreKeyBundleRef.doc(userId).set(preKeyBundle)
      .then((res) => {
        return res;
      })
      .catch(error => {
        return Promise.reject(error);
      })
    // localStorage.setItem(userId, JSON.stringify(preKeyBundle))
  }

  /*
  * Gets the pre-key bundle for the given user ID.
  * If you want to start a conversation with a user, you need to fetch their pre-key bundle first.
  */
  getPreKeyBundleFromDb(userId) {
    return new Promise((resolve, reject) => {
      const docRef = this.db.collection('signalPreKeyBundle').doc(userId);
      docRef.get().subscribe({
        next: user => {
          if (user.exists) {
            let preKeyBundleObj:any = user.data();
            // let preKeyBundle = preKeyBundleObj.preKeyBundle;
            // preKeyBundle = JSON.parse(preKeyBundle);
            resolve(preKeyBundleObj);
          }
          else {
            resolve(null);
            // Need to handle
          }
        },
        error: err => reject(err),
        complete: () => console.log('complete getPreKeyBundle request for userId ', userId)
      })
    });
  }

  async getPreKeyBundle(userId) {
    //let preKeyBundle = JSON.parse(localStorage.getItem(userId))
    let preKeyBundle: any = await this.getPreKeyBundleFromDb(userId);
    let preKey = preKeyBundle.preKeys.splice(-1)
    preKey[0].publicKey = this.helpersService.base64ToArrayBuffer(preKey[0].publicKey)
    this.updatePreKeyBundle(userId, preKeyBundle)
    return {
      identityKey: this.helpersService.base64ToArrayBuffer(preKeyBundle.identityKey),
      registrationId: preKeyBundle.registrationId,
      signedPreKey: {
        keyId: preKeyBundle.signedPreKey.keyId,
        publicKey: this.helpersService.base64ToArrayBuffer(preKeyBundle.signedPreKey.publicKey),
        signature: this.helpersService.base64ToArrayBuffer(preKeyBundle.signedPreKey.signature),
      },
      preKey: preKey[0]
    }
  }

  deletePreKeyBundle(userId): Promise<any> {
    let x = this.db.doc(`signalPreKeyBundle/${userId}`);
    return x.delete()
      .then(res => {
        return res;
      })
      .catch(err => {
        return Promise.reject(err);
      })
  }
}
