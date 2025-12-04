import type { ConfirmChannel } from 'amqplib';

export async function publishJSON<T>(
  confirmChannel: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T
): Promise<void> {
  let parsedMessage = JSON.stringify(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(parsedMessage);
  const buffer = Buffer.from(bytes);
  confirmChannel.publish(exchange, routingKey, buffer, {
    contentType: 'application/json',
  });
}
