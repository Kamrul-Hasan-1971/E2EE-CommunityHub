/* eslint-disable @typescript-eslint/no-explicit-any */
import { StorageType, Direction, SessionRecordType, SignalProtocolAddress, PreKeyPairType, SignedPreKeyPairType, SessionCipher } from '@privacyresearch/libsignal-protocol-typescript'
import { PouchDbService } from '../clientDB/pouch-db.service'

export class SignalProtocolStore implements StorageType {
    private _store: Record<string, StoreValue>
    Direction: {
        SENDING: 1,
        RECEIVING: 2,
    }
    constructor(private pouchDbService : PouchDbService) {
        this._store = {}
    }
    async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
        const kp = this.get('identityKey', undefined)
        if (isKeyPairType(kp) || typeof kp === 'undefined') {
            return kp
        }
        throw new Error('Item stored as identity key of unknown type.')
    }
    async getLocalRegistrationId(): Promise<number | undefined> {
        const rid = this.get('registrationId', undefined)
        if (typeof rid === 'number' || typeof rid === 'undefined') {
            return rid
        }
        throw new Error('Stored Registration ID is not a number')
    }
    put(key: string, value: StoreValue): void {
        if (key === undefined || value === undefined || key === null || value === null)
            throw new Error('Tried to store undefined/null')
        this._store[key] = value;
        const shouldUpdateInPouchDB = this.shouldUpdateInPouchDb(key);
        if(shouldUpdateInPouchDB){
            this.pouchDbService.saveSignalStoreData(key,value);
        }
    }
    get(key: string, defaultValue: StoreValue): StoreValue {
        if (key === null || key === undefined) throw new Error('Tried to get value for undefined/null key')
        if (key in this._store) {
            return this._store[key]
        } else {
            return defaultValue
        }
    }
    remove(key: string): void {
        if (key === null || key === undefined) throw new Error('Tried to remove value for undefined/null key')
        delete this._store[key];
        const shouldUpdateInPouchDB = this.shouldUpdateInPouchDb(key);
        if(shouldUpdateInPouchDB){
        this.pouchDbService.removeSignalStoreData(key);
        }
    }
    isTrustedIdentity(identifier: string, identityKey: ArrayBuffer,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _direction: Direction
    ): Promise<boolean> {
        if (identifier === null || identifier === undefined) {
            throw new Error('tried to check identity key for undefined/null key')
        }
        const trusted = this.get('identityKey' + identifier, undefined)

        // TODO: Is this right? If the ID is NOT in our store we trust it?
        if (trusted === undefined) {
            return Promise.resolve(true)
        }
        return Promise.resolve(
            arrayBufferToString(identityKey) === arrayBufferToString(trusted as ArrayBuffer)
        )
    }
    async loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined> {
        if (identifier === null || identifier === undefined) {
            throw new Error('Tried to get identity key for undefined/null key')
        }

        const key = this.get('identityKey' + identifier, undefined)
        if (isArrayBuffer(key)) {
            return key as ArrayBuffer
        } else if (typeof key === 'undefined') {
            return key
        }
        throw new Error(`Identity key has wrong type`)
    }
    removeIdentity(identifier: string)
    {
        this.remove('identityKey' + identifier);
    }
    async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
        if (identifier === null || identifier === undefined)
            throw new Error('Tried to put identity key for undefined/null key')

        const address = SignalProtocolAddress.fromString(identifier)

        const existing = this.get('identityKey' + address.getName(), undefined)
        this.put('identityKey' + address.getName(), identityKey);
        if (existing && !isArrayBuffer(existing)) {
            throw new Error('Identity Key is incorrect type')
        }

        if (existing && arrayBufferToString(identityKey) !== arrayBufferToString(existing as ArrayBuffer)) {
            return true
        } else {
            return false
        }
    }
    async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
        let res = this.get('25519KeypreKey' + keyId, undefined)
        if (isKeyPairType(res)) {
            res = { pubKey: res.pubKey, privKey: res.privKey }
            return res
        } else if (typeof res === 'undefined') {
            return res
        }
        throw new Error(`stored key has wrong type`)
    }
    async storePreKey(keyId: number | string, keyPair: KeyPairType): Promise<void> {
        return this.put('25519KeypreKey' + keyId, keyPair)
    }
    async removePreKey(keyId: number | string): Promise<void> {
        this.remove('25519KeypreKey' + keyId)
    }
    async loadSignedPreKey(keyId: number | string): Promise<KeyPairType | undefined> {
        const res = this.get('25519KeysignedKey' + keyId, undefined)
        if (isKeyPairType(res)) {
            return { pubKey: res.pubKey, privKey: res.privKey }
        } else if (typeof res === 'undefined') {
            return res
        }
        throw new Error(`stored key has wrong type`)
    }
    async storeSignedPreKey(keyId: number | string, keyPair: KeyPairType): Promise<void> {
        return this.put('25519KeysignedKey' + keyId, keyPair)
    }
    async removeSignedPreKey(keyId: number | string): Promise<void> {
        return this.remove('25519KeysignedKey' + keyId)
    }
    async loadSession(identifier: string): Promise<SessionRecordType | undefined> {
        const rec = this.get('session' + identifier, undefined)
        if (typeof rec === 'string') {
            return rec as string
        } else if (typeof rec === 'undefined') {
            return rec
        }
        throw new Error(`session record is not an ArrayBuffer`)
    }
    async storeSession(identifier: string, record: SessionRecordType): Promise<void> {
        return this.put('session' + identifier, record)
    }
    async removeSession(identifier: string): Promise<void> {
        return this.remove('session' + identifier)
    }
    async removeAllSessions(identifier: string): Promise<void> {
        for (const id in this._store) {
            if (id.startsWith('session' + identifier)) {
                delete this._store[id]
            }
        }
    }
    /* Stores and loads a session cipher */
    storeSessionCipher(identifier:string, cipher:SessionCipher) {
        this.put('cipher' + identifier, cipher);
    }
    removeSessionCipher(identifier:string) {
        this.remove('cipher' + identifier);
    }
    loadSessionCipher(identifier:string) : SessionCipher {
        var cipher:SessionCipher = this.get('cipher' + identifier, undefined) as SessionCipher;
        if (cipher == undefined) {
            return null;
        } else {
            return cipher;
        }
    }

    shouldUpdateInPouchDb(key)
    {
       // return true;
        //if(key.includes('cipher')) return false;
        if(key.includes('session')) return false;
        return true;
    }
}

type StoreValue = KeyPairType | string | number | KeyPairType | PreKeyType | SignedPreKeyType | ArrayBuffer | undefined| SessionCipher

interface KeyPairType {
    pubKey: ArrayBuffer
    privKey: ArrayBuffer
}
interface PreKeyType {
    keyId: number
    keyPair: KeyPairType
}
interface SignedPreKeyType extends PreKeyType {
    signature: ArrayBuffer
}

// Type guards
export function isKeyPairType(kp: any): kp is KeyPairType {
    return !!(kp?.privKey && kp?.pubKey)
}
export function isPreKeyType(pk: any): pk is PreKeyPairType {
    return typeof pk?.keyId === 'number' && isKeyPairType(pk?.keyPair)
}
export function isSignedPreKeyType(spk: any): spk is SignedPreKeyPairType {
    return spk?.signature && isPreKeyType(spk)
}
export function isArrayBuffer(thing: StoreValue): boolean {
    const t = typeof thing
    return !!thing && t !== 'string' && t !== 'number' && 'byteLength' in (thing as any)
}
export function arrayBufferToString(b: ArrayBuffer): string {
    return uint8ArrayToString(new Uint8Array(b))
}
export function uint8ArrayToString(arr: Uint8Array): string {
    const end = arr.length
    let begin = 0
    if (begin === end) return ''
    let chars: number[] = []
    const parts: string[] = []
    while (begin < end) {
        chars.push(arr[begin++])
        if (chars.length >= 1024) {
            parts.push(String.fromCharCode(...chars))
            chars = []
        }
    }
    return parts.join('') + String.fromCharCode(...chars)
}
