import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MqttNonPerCommonTopic, MqttNonPerTopic } from 'src/app/models/mqtt-non-persistent-topic-enum';
import { MqttPerCommonTopic, MqttPerTopic } from 'src/app/models/mqtt-persistent-topic-enum';
import { AcknowledgementType } from 'src/app/models/acknowledgement-type-enum';
import { Utility } from 'src/app/utility/utility';
import { PouchDbService } from '../clientDB/pouch-db.service';
import { MqttConnectorService } from '../mqtt/mqtt-connector.service';
import { SignalManagerService } from '../signal/signal-manager.service';
import { MqttUtility } from 'src/app/utility/mqtt-utility/mqtt-utility';
import { MessageStatusDocument } from 'src/app/models/message-status-document';
import { CommonService } from '../common/common.service';
import { EventService } from '../event.service';

@Injectable({
  providedIn: 'root'
})
export class PayloadProcessorService {
  private destroyed$ = new Subject();

  constructor(
    private mqttConnectorService: MqttConnectorService,
    private pouchDbService: PouchDbService,
    private signalManagerService: SignalManagerService,
    private commonService: CommonService,
    private eventService: EventService
  ) { }

  payloadProcessorServiceInit() {
    this.subscribeTomqttPayload$();
    this.init();
  }

  init() {

  }

  async decryptMessage(senderId, message: string) {
    let decryptedMessage = await this.signalManagerService.decryptMessageAsync(senderId, message)
      .catch(err => {
        console.error("#hasan error during decrypting", err);
        return message;
      })
    return decryptedMessage;
  }

  subscribeTomqttPayload$(): void {
    this.mqttConnectorService.mqttPayload$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async (mqttPayload: any) => {
        const { topic, payload } = mqttPayload;
        if (topic.endsWith(MqttPerCommonTopic.removeSignalProtocolSession)) {
          if (payload.from != Utility.getCurrentUserId()) {
            this.signalManagerService.removeSessionFromUser(payload);
          }
        }
        else if (topic.endsWith(MqttPerTopic.roomInbox)) {
          if (payload.from != Utility.getCurrentUserId()) { // For handling community room self message
            //initiate
            payload.deliveredUsers = new Set<string>();
            payload.readUsers = new Set([payload.from]);
            payload.messageStatus = MessageStatus.delivered;

            if (payload.from != Utility.getCommunitityId()) {
              console.log("#hasan Encrypted incomeing Message", payload.message);
              payload.message = await this.decryptMessage(payload.from, payload.message);
              console.log("#hasan After decrypte incomeing Message", payload.message);
            }

            console.log("#hasan message payload for room", payload)

            this.commonService.roomListChangesForLastMessage$.next(payload);
            this.pouchDbService.saveMessageToMessageDb(payload);
            this.publishMessageDeliveredStatus(payload);
          }
        }
        else if (topic.endsWith("/" + MqttPerTopic.messageStatus)) {
          console.log('payload received from', payload.from, 'with messageId', payload.messageId, 'in', topic, 'topic, payload:', payload);
          this.pouchDbService.saveMessageStatusToMessageDb(payload);
        }
        else if (topic.endsWith(MqttNonPerTopic.typing)) {
          if (payload.from != Utility.getCurrentUserId()) {
            console.log('MQTT typing', 'payload received with messageId', payload.messageId || '', 'in', topic, 'topic, payload:', payload);
            this.eventService.typingPayload$.next(payload);
          }
        }
        else if (topic.endsWith(MqttNonPerCommonTopic.userCreate)) {
          if (payload.id != Utility.getCurrentUserId()) {
            console.log('MQTT userCreate', 'payload received with userId', payload.id || '', 'in', topic, 'topic, payload:', payload);
            this.eventService.newUserInCommunity$.next(payload);
          }
        }
        else if (topic.endsWith(MqttNonPerTopic.activeStatus)) {
          console.log('Received mqtt user online status payload', payload);
          if (payload.from != Utility.getCurrentUserId()) {
            this.eventService.activeStatusPayload$.next(payload);
          }
        }
      });
  }


  publishMessageDeliveredStatus(payload: any) {
    if (payload.from == Utility.getCurrentUserId()) return;
    const statusPayload = {
      messageId: payload.messageId,
      messageStatus: MessageStatus.delivered,
      from: Utility.getCurrentUserId(),
    };
    const msgRoomId = Utility.getMsgRoomId(payload.to, payload.from);
    console.log('Publishing delivered status', 'msgId', payload.messageId, 'statusPayload', statusPayload);
    this.mqttConnectorService.publishToPersistentClient(MqttUtility.parseMqttTopic(MqttPerTopic.messageStatus, msgRoomId), statusPayload);
  }

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }
}
