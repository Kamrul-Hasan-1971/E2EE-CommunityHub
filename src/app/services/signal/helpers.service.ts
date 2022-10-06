import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelpersService {

  constructor() { }
  arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  isArrayBuffer(thing: any): boolean {
    const t = typeof thing
    return !!thing && t !== 'string' && t !== 'number' && 'byteLength' in (thing as any)
  }

  arrayBufferToString(b: ArrayBuffer): string {
    return this.uint8ArrayToString(new Uint8Array(b))
  }

  uint8ArrayToString(arr: Uint8Array): string {
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

}
