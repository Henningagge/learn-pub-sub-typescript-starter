import amqp, { type ConfirmChannel } from 'amqplib';
import process from 'node:process';
import { publishJSON } from '../internal/pubsub/publishJson.js';
import { ExchangePerilDirect } from '../internal/routing/routing.js';
import { PauseKey } from '../internal/routing/routing.js';
import type { PlayingState } from '../internal/gamelogic/gamestate.js';
async function main() {
  console.log('Starting Peril server...');
  const conection: string = 'amqp://guest:guest@localhost:5672/';
  try {
    let conn = await amqp.connect(conection, {
      clientProperties: { connection_name: 'Rabit1' },
    });
    console.log('Connection was succesfullssssss1345');
    let confirmChannel: ConfirmChannel = await conn.createConfirmChannel();
    let playstate: PlayingState = { isPaused: true };
    await publishJSON(confirmChannel, ExchangePerilDirect, PauseKey, playstate);
  } catch (err) {
    throw new Error('There been an error:' + err);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shuting down123');
  process.exit(0);
});
