import amqp, { type ConfirmChannel } from 'amqplib';
import process from 'node:process';
import { publishJSON } from '../internal/pubsub/publishJson.js';
import {
  ExchangePerilDirect,
  ExchangePerilDLX,
  ExchangePerilTopic,
  routingKey,
} from '../internal/routing/routing.js';
import { PauseKey } from '../internal/routing/routing.js';
import {
  GameState,
  type PlayingState,
} from '../internal/gamelogic/gamestate.js';
import {
  clientWelcome,
  getInput,
  commandStatus,
  printClientHelp,
} from '../internal/gamelogic/gamelogic.js';
import { declareAndBind } from '../internal/pubsub/binding.js';
import { commandSpawn } from '../internal/gamelogic/spawn.js';
import {
  commandMove,
  handleMove,
  MoveOutcome,
} from '../internal/gamelogic/move.js';
import { subscribeJSON } from '../internal/pubsub/subscribe.js';
import { handlePause } from '../internal/gamelogic/pause.js';
import type { ArmyMove } from '../internal/gamelogic/gamedata.js';
import { SimpleQueueType } from '../internal/pubsub/binding.js';
import { AckType } from '../internal/pubsub/subscribe.js';
async function main() {
  console.log('Starting Peril client...');

  const conection: string = 'amqp://guest:guest@localhost:5672/';
  try {
    let conn = await amqp.connect(conection, {
      clientProperties: { connection_name: 'Rabit1' },
    });
    console.log('Connection was succesfullssssss1345');
    let username = await clientWelcome();
    const SimpleQueue = { queueType: 'transient' };
    const queueName = PauseKey + '.' + username;
    declareAndBind(
      conn,
      ExchangePerilDirect,
      queueName,
      routingKey,
      SimpleQueueType.Durable
    );
    declareAndBind(
      conn,
      ExchangePerilDLX,
      queueName,
      routingKey,
      SimpleQueueType.Durable
    );

    const gamestate = new GameState(username);

    await subscribeJSON(
      conn,
      ExchangePerilDirect,
      queueName,
      PauseKey,
      SimpleQueue,
      handlerPause(gamestate)
    );
    await subscribeJSON(
      conn,
      ExchangePerilTopic,
      `army_moves.${username}`,
      'army_moves.*',
      SimpleQueue,
      handlerMove(gamestate)
    );
    process.stdout.write('> ');
    while (1 == 1) {
      let input = await getInput();
      if (input.length == 0) {
        continue;
      }
      let continent: string | undefined = '';
      let unit: string | undefined = '';
      if (input[0] == 'spawn') {
        continent = input[1];
        unit = input[2];
        let command = ['spawn', continent ? continent : '', unit ? unit : ''];
        let soldier = commandSpawn(gamestate, command);
        console.log(soldier);
      } else if (input[0] == 'move') {
        try {
          let confirmChannel: ConfirmChannel =
            await conn.createConfirmChannel();
          let move = commandMove(gamestate, input);
          console.log('move was succesfull');
          publishJSON(
            confirmChannel,
            ExchangePerilTopic,
            `army_moves.${username}`,
            move
          );
          console.log('published sucessfully');
        } catch (err) {
          console.log('move failed');
        }
      } else if (input[0] == 'status') {
        commandStatus(gamestate);
      } else if (input[0] == 'help') {
        printClientHelp();
      } else if (input[0] == 'spam') {
        console.log('Spamming not allowed yet!');
      } else if (input[0] == 'quit') {
        console.log('quiting the game');
        break;
      } else {
        console.log('That not a valid command');
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

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    process.stdout.write('> ');
    return AckType.Ack;
  };
}
export function handlerMove(gs: GameState): (move: ArmyMove) => AckType {
  return (move: ArmyMove) => {
    try {
      const Move = handleMove(gs, move);
      if (Move == MoveOutcome.MakeWar || Move == MoveOutcome.Safe) {
        return AckType.Ack;
      } else {
        return AckType.NackDiscard;
      }
    } finally {
      process.stdout.write('> ');
    }
  };
}
