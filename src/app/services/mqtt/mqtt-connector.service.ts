import { Injectable } from '@angular/core';

import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MqttNonPerCommonTopic, MqttNonPerTopic } from '../../models/mqtt-non-persistent-topic-enum';
import { MqttPerTopic } from '../../models/mqtt-persistent-topic-enum';
import { MqttUtility } from '../../../app/utility/mqtt-utility/mqtt-utility';
import { Utility } from '../../../app/utility/utility';
import { PouchDbService } from '../clientDB/pouch-db.service';
import { MessageStatus } from 'src/app/models/message-status-enum';
import { MessageStatusDocument } from 'src/app/models/message-status-document';

@Injectable({
  providedIn: 'root'
})
export class MqttConnectorService{
  persistentClient: MqttClient;
  nonPersistentClient: MqttClient;
  persistentQos: any = {
    qos: 1,
  };
  nonPersistentQos: any = {
    qos: 0,
  };

  mqttPayload$: Subject<any> = new Subject<any>();
  // mqttMeesagePayload$: Subject<any> = new Subject<any>();
  commonTopicId  = "051c1e3e-b8e4-4e65-95cd-f763d2e91ba6";
  constructor( private pouchDbService : PouchDbService) { }

  ngOninit()
  {
    // this.mqttPayload$ = new Subject<any>();
    // this.mqttMeesagePayload$ = new Subject<any>();
  }

  mqttConnectorServiceInit() {
    this.connect();
  }

  connect(): void {
    console.log("mqttConnectorServiceInit connect call")
    this.persistentClient = mqtt.connect(
      `${environment.mqtt.protocol}://${environment.mqtt.host}${environment.mqtt.path}`,
      {
        clientId: Utility.getMqttPersistentClient(),
        clean: false,
        port: environment.mqtt.port,
        username: environment.mqtt.username,
        password: environment.mqtt.password,
      }
    );
    this.persistentClient.on('connect', this.persistentConnectCallBack);
    this.persistentClient.on('subAck', this.fun);
    this.persistentClient.on('error', this.connectErrorCallBack);
    this.persistentClient.on('message', this.mqttMessageCallBack);

    this.nonPersistentClient = mqtt.connect(
      `${environment.mqtt.protocol}://${environment.mqtt.host}${environment.mqtt.path}`,
      {
        clientId: Utility.getMqttNonPersistentClient(),
        clean: true,
        port: environment.mqtt.port,
        username: environment.mqtt.username,
        password: environment.mqtt.password,
      }
    );
    this.nonPersistentClient.on('connect', this.nonPersistentConnectCallBack);
    this.nonPersistentClient.on('error', this.nonPerConnectErrorCallBack);
    this.nonPersistentClient.on('message', this.mqttMessageCallBack);
  }
  fun= (response: any) => {
    console.log("suback", response);
  }

  persistentConnectCallBack = (response: any) => {
    console.log(
      'MqttConnectorService: persistent client connection successful',
      response
    );
    let topics = [];
    const communityId = Utility.getCommunitityId();
    for (const topic of Object.values(MqttPerTopic)) {
      topics.push(MqttUtility.parseMqttTopic(topic, Utility.getCurrentUserId()));
      topics.push(MqttUtility.parseMqttTopic(topic, communityId));
    }
    this.subscribeToPersistentClient(topics);
  };

  nonPersistentConnectCallBack = (response: any) => {
    console.log(
      'MqttConnectorService: non persistent client connection successful',
      response
    );
    let topics = [];
    const communityId = Utility.getCommunitityId();
    for (const topic of Object.values(MqttNonPerTopic)) {
      topics.push(MqttUtility.parseMqttTopic(topic, Utility.getCurrentUserId()));
      topics.push(MqttUtility.parseMqttTopic(topic, communityId));
    }
    for (const topic of Object.values(MqttNonPerCommonTopic)) {
      topics.push(MqttUtility.parseMqttTopic(topic, this.commonTopicId));
    }
    this.subscribeToNonPersistentClient(topics);
  };

  connectErrorCallBack = (error: any) => {
    console.error(
      'MqttConnectorService: persistent client connection failed',
      error
    );
  };

  nonPerConnectErrorCallBack = (error: any) => {
    console.error(
      'MqttConnectorService: non persistent client connection failed',
      error
    );
  };

  mqttMessageCallBack = (topic: string, message: any) => {
    if (message && message.toString() !== '') {
      try {
        const payload = JSON.parse(message.toString());
        this.mqttPayload$.next({ topic, payload });
      } catch (err) {
        console.error(
          'MqttConnectorService: unprocessable payload from mqtt',
          message.toString(),
          'in',
          topic
        );
      }
    }
  };

  subscribeToPersistentClient(topics: string[]) {
    if (topics.length > 0) {
      if (this.persistentClient) {
        this.persistentClient.subscribe(
          topics,
          this.persistentQos,
          (err, granted) => {
            console.log("granted",granted);
            if (err) {
              console.error(
                'MqttConnectorService: error during topic subscription for',
                topics,
                err
              );
              return;
            }
            if (!granted) return;
            for (let i = 0; i < granted.length; i++) {
              if (granted[i].qos === 128) {
                // todo: need to retry subscription for these topics
                console.error(
                  'MqttConnectorService: error in subscribing',
                  granted[i].topic,
                  'qos returned',
                  granted[i].qos
                );
              }
            }
          }
        );
      }
    } else {
      //no logic for now
    }
  }

  subscribeToNonPersistentClient(topics: string[]) {
    if (this.nonPersistentClient) {
      this.nonPersistentClient.subscribe(
        topics,
        this.nonPersistentQos,
        (err, granted) => {
          if (err) {
            console.error(
              'MqttConnectorService: error during topic subscription for',
              topics,
              err
            );
          }
          if (!granted) return;
          for (let i = 0; i < granted.length; i++) {
            if (granted[i].qos === 128) {
              // todo: need to retry subscription for these topics
              console.error(
                'MqttConnectorService: error in subscribing',
                granted[i].topic,
                'qos returned',
                granted[i].qos
              );
              this.subscribeToNonPersistentClient(topics);
            }
          }
        }
      );
    }
  }

  unsubscribe(): void {
    for (const topic in MqttPerTopic) {
      if (this.persistentClient) {
        this.persistentClient.unsubscribe(
          MqttUtility.parseMqttTopic(topic, Utility.getCurrentUserId()),
          this.persistentQos
        );
        console.log(
          `MqttConnectorService: unsubscribed to persistent topic : ${topic}`
        );
      }
    }

    for (const topic in MqttNonPerTopic) {
      if (this.nonPersistentClient) {
        this.nonPersistentClient.unsubscribe(
          MqttUtility.parseMqttTopic(topic, Utility.getCurrentUserId()),
          this.nonPersistentQos
        );
        console.log(
          `MqttConnectorService: unsubscribed to non-persistent topic : ${topic}`
        );
      }
    }
  }

  publishActiveStatus(status = true) {
    const currentUserId = Utility.getCurrentUserId();
    const currentClusterId = Utility.getClusterId();
    if (currentUserId && currentClusterId) {
      const statusPayload = {
        fromUser: currentUserId,
        status: {
          isOnline: status,
          lastSeen: Date.now(),
        },
      };
      console.log(
        'MqttConnectorService: publishing user status',
        statusPayload,
        'in',
        `chatRoom/${currentClusterId}/${currentUserId}/status`
      );
      this.publishToNonPersistentClient(
        `chatRoom/${currentClusterId}/${currentUserId}/status`,
        statusPayload,
        true
      );
    }
  }

  publishRemoveSignalProtocolSession(logout=false)
  {
    const currentUserId = Utility.getCurrentUserId();
    const currentClusterId = Utility.getClusterId();
    if (currentUserId && currentClusterId) {
      let signalProtocolPayload = {
        fromUserId : Utility.getCurrentUserId(),
        logout:logout
      }
      console.log(
        'MqttConnectorService: publishing remove signal session',
        signalProtocolPayload,
        'in',
        MqttUtility.parseMqttTopic(MqttNonPerCommonTopic.removeSignalProtocolSession,this.commonTopicId)
      );
      this.publishToNonPersistentClient(
        MqttUtility.parseMqttTopic(MqttNonPerCommonTopic.removeSignalProtocolSession,this.commonTopicId),
        signalProtocolPayload,
        false
      );
    }
  }

  async publishToPersistentClient(topic: string, payload: any) {
    if (this.persistentClient) {

      console.log(
        'MqttConnectorService: publishing in',
        topic,
        payload
      );
      this.persistentClient.publish(
        topic,
        JSON.stringify(payload),
        this.persistentQos,
        (err,res) => {
          if (res) {
            console.log(
              'MqttConnectorService: Published message successfully',
              'in',
              topic,
              payload,
              res
            );
            if('message' in payload && payload.from == Utility.getCurrentUserId())
            {
              const statusPayload = {
                messageId: payload.messageId,
                messageStatus: MessageStatus.sent,
                from: payload.from
              };
              this.pouchDbService.saveMessageStatusToMessageDb(statusPayload);
            }
          }
          if (err) {
            console.error(
              'MqttConnectorService: error during publishing message',
              'in',
              topic,
              payload,
              err
            );
          }
        }
      );
    } else {
      console.log(
        'MqttConnectorService: No persistent client available',
        topic,
        payload
      );
    }
  }
  publishToNonPersistentClient(topic: string, payload: any, retain = false) {
    if (this.nonPersistentClient) {
      this.nonPersistentClient.publish(
        topic,
        JSON.stringify(payload),
        {
          qos: 0,
          retain: retain,
        },
        (err) => {
          if (err) {
            console.error(
              'MqttConnectorService: error during publishing in',
              topic
            );
          }
        }
      );
    }
  }

  destroy(): void {
    console.log(
      'MqttConnectorService: destroying mqtt connection'
    );
    this.publishRemoveSignalProtocolSession();
    this.unsubscribe();
    if (this.persistentClient) this.persistentClient.end();
    if (this.nonPersistentClient) this.nonPersistentClient.end();
    this.persistentClient = null;
    this.nonPersistentClient = null;
  }
}
