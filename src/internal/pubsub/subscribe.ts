import amqp from 'amqplib';
import { SimpleQueueType } from './binding.js';
import { declareAndBind } from './binding.js';
export enum AckType {
  Ack,
  NackDiscard,
  NackRequeue,
}
export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType, // an enum to represent "durable" or "transient"
  handler: (data: T) => AckType
): Promise<void> {
  let [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType
  );

  await ch.consume(queue.queue, function (msg: amqp.ConsumeMessage | null) {
    if (!msg) {
      return;
    }
    let data: T;

    try {
      data = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error('Cloud not process error:' + err);
      return;
    }
    try {
      let aktype = handler(data);
      if ((aktype = AckType.Ack)) {
        console.log('Ack');
        ch.ack(msg);
      } else if ((aktype = AckType.NackDiscard)) {
        console.log('NackDiscard');
        ch.nack(msg, false, false);
      } else if ((aktype = AckType.NackRequeue)) {
        console.log('NackRequeue');
        ch.nack(msg, false, true);
      }
    } catch (err) {
      console.error('somthig when wron heare');
      ch.nack(msg, false, false);
      return;
    }
  });
}
