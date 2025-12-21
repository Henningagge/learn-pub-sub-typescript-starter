import amqp, { type ConfirmChannel } from 'amqplib';
import process from 'node:process';
import { publishJSON } from '../internal/pubsub/publishJson.js';
import { SimpleQueueType } from '../internal/pubsub/binding.js';
import {
  ExchangePerilDirect,
  ExchangePerilTopic,
  GameLogSlug,
} from '../internal/routing/routing.js';
import { PauseKey } from '../internal/routing/routing.js';
import { type PlayingState } from '../internal/gamelogic/gamestate.js';
import { printServerHelp, getInput } from '../internal/gamelogic/gamelogic.js';
import { declareAndBind } from '../internal/pubsub/binding.js';
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
    printServerHelp();
    const SimpleQueue = { queueType: 'durable' };
    declareAndBind(
      conn,
      ExchangePerilTopic,
      GameLogSlug,
      GameLogSlug + '.*',
      SimpleQueueType.Durable
    );
    while (1 == 1) {
      let input = await getInput();
      if (input.length == 0) {
        continue;
      }
      let firstWord = input[0];
      if (firstWord == 'pause') {
        console.log('Sending pause Message');
        await publishJSON(
          confirmChannel,
          ExchangePerilDirect,
          PauseKey,
          playstate
        );
      } else if (firstWord == 'resume') {
        console.log('resuming the game');
        playstate = { isPaused: false };
        await publishJSON(
          confirmChannel,
          ExchangePerilDirect,
          PauseKey,
          playstate
        );
      } else if (firstWord == 'quit') {
        console.log('quiting the game');
        break;
      } else {
        console.log("I can't understand you pleas help me?????");
      }
    }
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
