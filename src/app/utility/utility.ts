import { RoomData } from "../interfaces/roomData";

export class Utility {
  static setMqttPersistentClient(val) {
    localStorage.setItem('mv_p_c', val);
  }
  static getMqttPersistentClient() {
    return "persistent" + this.getCurrentUserId();
    return localStorage.getItem('mv_p_c');
  }
  static setMqttNonPersistentClient(val) {
    localStorage.setItem('mv_n_p_c', val);
  }
  static getMqttNonPersistentClient() {
    return "nonPersistent" + this.getCurrentUserId();
    return localStorage.getItem('mv_n_p_c');
  }
  static setMqttUserName(val) {
    localStorage.setItem('mv_u', val);
  }
  static getMqttUserName() {
    return localStorage.getItem('mv_u');
  }
  static setMqttPassword(val) {
    localStorage.setItem('mv_c', val);
  }
  static getMqttPassword() {
    return localStorage.getItem('mv_c');
  }
  static setMqttClusterId(val) {
    localStorage.setItem('mv_cl', val);
  }
  static getMqttClusterId() {
    return localStorage.getItem('mv_cl');
  }
  static setDeviceId(deviceId: any) {
    localStorage.setItem('user_device_id', deviceId);
  }
  static getDeviceId() {
    return localStorage.getItem('user_device_id');
  }
  static setDeviceName(deviceName: any) {
    localStorage.setItem('user_device_name', deviceName);
  }
  static getDeviceName() {
    return localStorage.getItem('user_device_name');
  }
  static setCurrentUserId(userId) {
    localStorage.setItem('currentUser_id', userId);
  }
  static getCurrentUserId() {
    return localStorage.getItem('currentUser_id');
  }
  static setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  static getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
  }
  static setAuthToken(accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  static getAuthToken(): string {
    return localStorage.getItem('access_token');
  }
  static setRefreshToken(refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  static getRefreshToken(): string {
    return localStorage.getItem('refresh_token');
  }
  static setClusterId(clusterId) {
    return localStorage.setItem('mv_cl', clusterId);
  }
  static getClusterId() {
    return "1";
    return localStorage.getItem('mv_cl');
  }
  static getCurrentActiveRoomId() {
    return localStorage.getItem('current_active_roomId');
  }
  static setCurrentActiveRoomId(CurrentActiveRoomId) {
    localStorage.setItem(
      'current_active_roomId',
      CurrentActiveRoomId
    );
  }

  static isArrayLengthEqual(a: any, b: any) {
    return a && b && a.length === b.length;
  }

  static isCurrentUser(id: string): boolean {
    return this.getCurrentUserId() === id;
  }

  static oldObjectUpdateByNewObjectKey(oldObj, newObj) {
    let anyKeyUpdate = false;
    Object.keys(newObj).forEach((key) => {
      if (oldObj[key] != newObj[key]) {
        oldObj[key] = newObj[key];
        anyKeyUpdate = true;
      }
    });
    return anyKeyUpdate;
  }

  static sliceString(str) {
    if (str.length <= 13) return str;
    return str.substring(0, 13) + '...';
  }

  static setCommunitityId(communityId) {
    localStorage.setItem("communityId", communityId);
  }

  static getCommunitityId() {
    return localStorage.getItem("communityId");
  }

  static setRoomCount(roomCount) {
    localStorage.setItem('roomCount', roomCount);
  }

  static getRoomCount() {
    return localStorage.getItem('roomCount');
  }

  static getMsgRoomId(messageTo, messageFrom) {
    if (messageTo == Utility.getCommunitityId()) return Utility.getCommunitityId();
    if (messageFrom == Utility.getCurrentUserId()) return messageTo;
    return messageFrom;
  }

  static getCommonTopicId() {
    return "051c1e3e-b8e4-4e65-95cd-f763d2e91ba6";
  }
}
