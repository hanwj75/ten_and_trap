import Queue from 'bull';
import dotenv from 'dotenv';
import { dbConfig } from '../../../config/dbconfig.js';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import { phaseUpdateHandler } from '../../../handler/game/phaseUpdateHandler.js';

dotenv.config();
const env = dbConfig.redis;

const queueOptions = {
  redis: {
    host: env.host,
    port: env.port,
    password: env.password,
  },
  // limit: {
  //   max: 1,
  //   duration: 1000,
  // },
};

export const phaseQueue = new Queue('phase-update-queue', queueOptions);

export const initBull = async () => {
  phaseQueue.process(async (job, done) => {
    try {
      const { socket, room, nextState } = job.data;
      console.log(`Processing job for room:${room.id}, phase:${room.phase}`);
      job.log(`Processing job for room:${room.id}, phase:${room.phase}`);
      await phaseUpdateHandler(socket, room, nextState);
      done();
    } catch (err) {
      console.error(`Error processing job: `, err);
      throw err;
    }
  });

  phaseQueue.on('completed', (job) => {
    console.log(`room ${job.data.room.id} ${job.id} phase update completed!`);
  });

  phaseQueue.on('failed', (job) => {
    console.log(`${job.id} failed!`);
  });

  const queuesList = ['phase-update-queue'];

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = queuesList.map((qs) => new Queue(qs, queueOptions)).map((q) => new BullAdapter(q));
  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues,
    serverAdapter: serverAdapter,
  });
  const app = express();

  app.use('/admin/queues', serverAdapter.getRouter());

  const PORT = 4000;

  app.listen(PORT, () => {
    console.info(`Running on ${PORT}`);
    console.info(`For the UI, open http://localhost:${PORT}/admin/queues`);
    console.info(`Make sure Redis is running on port ${queueOptions.redis.port} by default`);
  });
};
