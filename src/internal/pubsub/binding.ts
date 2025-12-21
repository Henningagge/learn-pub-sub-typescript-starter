import amqp, { type ConfirmChannel } from 'amqplib';
import type { Channel } from 'amqplib';

import { ExchangePerilDLX } from '../routing/routing.js';
import { channel } from 'diagnostics_channel';
export enum SimpleQueueType {
  Durable,
  Transient,
}
export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  try {
    let newChannel = await conn.createChannel();

    const queue = await newChannel.assertQueue(queueName, {
      durable: queueType === SimpleQueueType.Durable,
      exclusive: queueType !== SimpleQueueType.Durable,
      autoDelete: queueType !== SimpleQueueType.Durable,
      arguments: {
        'x-dead-letter-exchange': 'peril_dlx',
      },
    });
    await newChannel.bindQueue(queue.queue, exchange, key);

    return [newChannel, queue];
  } catch (e) {
    throw new Error('fuck you error');
  }
}
