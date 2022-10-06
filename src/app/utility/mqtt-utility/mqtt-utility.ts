import { Utility } from '../utility';

export class MqttUtility {
  static parseMqttTopic(topic: string, id: string): string {
    return `chatRoom/${Utility.getClusterId()}/${id}/${topic}`;
  }
}
