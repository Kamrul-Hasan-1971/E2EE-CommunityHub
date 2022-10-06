import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MqttNonPerCommonTopic, MqttNonPerTopic } from 'src/app/models/mqtt-non-persistent-topic-enum';
import { MqttPerTopic } from 'src/app/models/mqtt-persistent-topic-enum';
import { AcknowledgementType } from 'src/app/models/acknowledgement-type-enum';
import { Utility } from 'src/app/utility/utility';
import { PouchDbService } from '../clientDB/pouch-db.service';
import { MqttConnectorService } from '../mqtt/mqtt-connector.service';
import { SignalManagerService } from '../signal/signal-manager.service';
import { MqttUtility } from 'src/app/utility/mqtt-utility/mqtt-utility';
import { MessageStatusDocument } from 'src/app/models/message-status-document';
import { CommonService } from '../common/common.service';

@Injectable({
  providedIn: 'root'
})
export class PayloadProcessorService {
  private destroyed$ = new Subject();
  public activeStatusPayload$ = new Subject();
  typingPayload$: Subject<any>;

  constructor(
    private mqttConnectorService: MqttConnectorService,
    private pouchDbService: PouchDbService,
    private signalManagerService: SignalManagerService,
    private commonService : CommonService
  ) { }

  payloadProcessorServiceInit() {
    this.subscribeTomqttPayload$();
    this.init();
  }

  init()
  {
    this.typingPayload$ = new Subject<any>();
  }

  async decryptMessage(senderId, message: string) {
    let decryptedMessage = await this.signalManagerService.decryptMessageAsync(senderId, message)
      .catch(err => {
        console.error(err);
        return message;
      })
    return decryptedMessage;
  }

  subscribeTomqttPayload$(): void {
    this.mqttConnectorService.mqttPayload$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async (mqttPayload: any) => {
        const { topic, payload } = mqttPayload;
        if(topic.endsWith(MqttNonPerCommonTopic.removeSignalProtocolSession))
        {
          this.signalManagerService.removeSessionFromUser(payload);
        }
        else if(topic.endsWith(MqttPerTopic.roomInbox))
        {
          payload.messageStatus = MessageStatus.delivered;
          console.log("Encrypted incomeing Message",payload.message);
          payload.message = await this.decryptMessage(payload.from, payload.message);
          console.log("After decrypte incomeing Message",payload.message);
          this.commonService.roomListChangesForLastMessage$.next(payload);
          this.pouchDbService.saveMessageToMessageDb(payload);
          this.publishMessageDeliveredStatus(payload);
        }
        else if (topic.endsWith("/"+MqttPerTopic.messageStatus)) {
          console.log('payload received from', payload.from,'with messageId', payload.messageId,'in', topic,'topic, payload:',payload);
          this.pouchDbService.saveMessageStatusToMessageDb(payload);
        }
        else if (topic.endsWith('/typing')) {
          console.log(
            'MQTT typing',
            'payload received with messageId',
            payload.messageId || '',
            'in',
            topic,
            'topic, payload:',
            payload
          );
          this.typingPayload$.next(payload);
        } 
        // else if (topic.endsWith(MqttNonPerTopic.activeStatus)) {
        //   console.log(
        //     'PayloadProcessorService: Received mqtt user online status payload',
        //     payload
        //   );
        //   this.activeStatusPayload$.next(payload);
        // }
      });
  }

 
  publishMessageDeliveredStatus(payload: any) {
    if(payload.from == Utility.getCurrentUserId()) return;
      const statusPayload = {
        messageId: payload.messageId,
        messageStatus: MessageStatus.delivered,
        from: Utility.getCurrentUserId(),
      };
      const msgRoomId = Utility.getMsgRoomId(payload.to, payload.from);
      console.log('Publishing delivered status','msgId',payload.messageId,'statusPayload',statusPayload);
      this.mqttConnectorService.publishToPersistentClient(MqttUtility.parseMqttTopic(MqttPerTopic.messageStatus,msgRoomId),statusPayload);
  }

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }
}
