import { Injectable } from '@angular/core';
import { SignalServerStoreService } from './signal-server-store.service';
import { SignalProtocolStore } from './storage-type';
import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
  // PreKeyType,
  // SignedPublicPreKeyType,
  // MessageType
}
  from '@privacyresearch/libsignal-protocol-typescript'
import { PouchDbService } from '../clientDB/pouch-db.service';
//import { Utility } from 'src/app/utility/utility';
import { EventService } from '../event.service';

@Injectable({
  providedIn: 'root'
})
export class SignalManagerService {
  userId;
  private store: SignalProtocolStore;
  constructor(
    private signalServerStoreService: SignalServerStoreService,
    private pouchDbService: PouchDbService,
    private eventService : EventService
  ) {
   // this.store = new SignalProtocolStore(this.pouchDbService);
    this.store = new SignalProtocolStore(this.eventService);
  }

  init()
  {
    this.subscribeUpdateSignalClienDbData();
  }

  subscribeUpdateSignalClienDbData()
  {
    this.eventService.updateSignalClienDbData$.subscribe((data)=>{
      console.log("#hasan Update signal data subject data",data);
      if(data.op == "put")
      {
        this.pouchDbService.saveSignalStoreData(data.key, data.value);
      }
      else if(data.op == "remove")
      {
        this.pouchDbService.removeSignalStoreData(data.key);
      }
    })
  }

  removeSessionFromUser(mqttPayload)
  {
    const from = mqttPayload.from;
    this.store.removeSession(from);
    this.store.removeSessionCipher(from);
    if(mqttPayload.logout){
      this.store.removeIdentity(from);
    }
  }
  /**
     * Initialize the manager when the user logs on.
     */
  async initializeAsync(userId) {
    console.log("#hasan Signal initialization start userId", userId)
    this.userId = userId;
    await this._generateIdentityAsync();
    var preKeyBundle = await this._generatePreKeyBundleAsync();
    this.signalServerStoreService.registerNewPreKeyBundle(this.userId, preKeyBundle);
    console.log("#hasan Signal initialization Finish userId", userId,"preKeyBundle: ",preKeyBundle)

  }

  initaitePreviouslyCreatedSignalData(storedataFromDB)
  {
    Object.keys(storedataFromDB).forEach((key)=> {
        this.store.put(key, storedataFromDB[key], false);
    });
  }

  /**
     * Generates a new identity for the local user.
     */
  async _generateIdentityAsync() {
    var results = await Promise.all([
      KeyHelper.generateIdentityKeyPair(),
      KeyHelper.generateRegistrationId(),
    ]);

    this.store.put('identityKey', results[0]);
    this.store.put('registrationId', results[1]);
  }

  /**
     * Generates a new pre-key bundle for the local user.
     * 
     * @returns A pre-key bundle.
     */
  async _generatePreKeyBundleAsync() {
    var result = await Promise.all([
      this.store.getIdentityKeyPair(),
      this.store.getLocalRegistrationId()
    ]);

    let identity = result[0];
    let registrationId = result[1];

    // PLEASE NOTE: I am creating set of 4 pre-keys for demo purpose only.
    // The libsignal-javascript does not provide a counter to generate multiple keys, contrary to the case of JAVA (KeyHelper.java)
    // Therefore you need to set it manually (as per my research)
    const promises = [];
    for(var i = 1 ; i<= 100; i++)
    {
      promises.push(KeyHelper.generatePreKey(registrationId + i));
    }
    promises.push(KeyHelper.generateSignedPreKey(identity, registrationId + 1));
    // var keys = await Promise.all([
    //   KeyHelper.generatePreKey(registrationId + 1),
    //   KeyHelper.generatePreKey(registrationId + 2),
    //   KeyHelper.generatePreKey(registrationId + 3),
    //   KeyHelper.generatePreKey(registrationId + 4),
    //   KeyHelper.generatePreKey(registrationId + 5),
    //   KeyHelper.generatePreKey(registrationId + 6),
    //   KeyHelper.generatePreKey(registrationId + 7),
    //   KeyHelper.generatePreKey(registrationId + 8),
    //   KeyHelper.generatePreKey(registrationId + 9),
    //   KeyHelper.generatePreKey(registrationId + 10),
    //   KeyHelper.generatePreKey(registrationId + 11),
    //   KeyHelper.generateSignedPreKey(identity, registrationId + 1)
    // ]);
    var keys = await Promise.all(promises);

    let signedPreKey = keys.pop();
    let preKeys = keys

    preKeys.forEach(preKey => {
      this.store.storePreKey(preKey.keyId, preKey.keyPair);
    })
    this.store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);

    let publicPreKeys = preKeys.map(preKey => {
      return {
        keyId: preKey.keyId,
        publicKey: preKey.keyPair.pubKey
      }
    })
    return {
      identityKey: identity.pubKey,
      registrationId: registrationId,
      preKeys: publicPreKeys,
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.keyPair.pubKey,
        signature: signedPreKey.signature
      }
    };
  }

  /**
     * Encrypt a message for a given user.
     * 
     * @param remoteUserId The recipient user ID.
     * @param message The message to send.
     */
  async encryptMessageAsync(remoteUserId, message) {
    //return message;
    var sessionCipher: SessionCipher = this.store.loadSessionCipher(remoteUserId);

    if (sessionCipher == null) {
      console.log("#hasan sessionCipher not exists during encryption");
      var address = new SignalProtocolAddress(remoteUserId, 123);
      // Instantiate a SessionBuilder for a remote recipientId + deviceId tuple.
      var sessionBuilder = new SessionBuilder(this.store, address);

      var remoteUserPreKey = await this.signalServerStoreService.getPreKeyBundle(remoteUserId);
      console.log("#hasan remoteUserPreKey from remoteUserId",remoteUserPreKey);
      // Process a prekey fetched from the server. Returns a promise that resolves
      // once a session is created and saved in the store, or rejects if the
      // identityKey differs from a previously seen identity for this address.
      const session = await sessionBuilder.processPreKey(remoteUserPreKey);
      console.log("#hasan build session",session);


      sessionCipher = new SessionCipher(this.store, address);
      console.log("#hasan build session cipher",sessionCipher);
      this.store.storeSessionCipher(remoteUserId, sessionCipher);
    }
    else{
      console.log("#hasan sessionCipher exists during encryption");
    }

    let cipherText = await sessionCipher.encrypt(new TextEncoder().encode(message).buffer);
    return cipherText
  }


  /**
     * Decrypts a message from a given user.
     * 
     * @param remoteUserId The user ID of the message sender.
     * @param cipherText The encrypted message bundle. (This includes the encrypted message itself and accompanying metadata)
     * @returns The decrypted message string.
     */
  async decryptMessageAsync(remoteUserId, cipherText) {
    //return cipherText;
    var sessionCipher = this.store.loadSessionCipher(remoteUserId);

    if (sessionCipher == null) {
      console.log("#hasan sessioncipher not exists");
      var address = new SignalProtocolAddress(remoteUserId, 123);
      sessionCipher = new SessionCipher(this.store, address);
      console.log("#hasan sessionchipher created during decrypt",sessionCipher);
      this.store.storeSessionCipher(remoteUserId, sessionCipher);
    }
    else{
      console.log("#hasan sessioncipher exists");
    }

    var messageHasEmbeddedPreKeyBundle = cipherText.type == 3;
    // Decrypt a PreKeyWhisperMessage by first establishing a new session.
    // Returns a promise that resolves when the message is decrypted or
    // rejects if the identityKey differs from a previously seen identity for this address.
    if (messageHasEmbeddedPreKeyBundle) {
      console.log("#hasan decryptPreKeyWhisperMessage with sessioncipher",sessionCipher);
      var decryptedMessage = await sessionCipher.decryptPreKeyWhisperMessage(cipherText.body, 'binary');
      return new TextDecoder().decode(new Uint8Array(decryptedMessage));
      // return util.toString(decryptedMessage);
    } else {
      console.log("#hasan decryptWhisperMessage sessioncipher",sessionCipher);
      // Decrypt a normal message using an existing session
      var decryptedMessage = await sessionCipher.decryptWhisperMessage(cipherText.body, 'binary');
      return new TextDecoder().decode(new Uint8Array(decryptedMessage));
      //return util.toString(decryptedMessage);
    }
  }
}
