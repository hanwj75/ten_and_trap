import Queue from 'bull';
import dotenv from 'dotenv';
import { dbConfig } from '../../../config/dbconfig.js';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';

dotenv.config();
const env = dbConfig.redis;

let addQueueMethod;
let removeQueueMethod;

export const queueOptions = {
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

export const queuesSessions = [];

export const initBull = async () => {
  const queuesList = [];

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = queuesList.map((qs) => new Queue(qs, queueOptions)).map((q) => new BullAdapter(q));
  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues,
    serverAdapter: serverAdapter,
  });

  addQueueMethod = addQueue;
  removeQueueMethod = removeQueue;

  const app = express();

  app.use('/admin/queues', serverAdapter.getRouter());

  const PORT = 4000;

  app.listen(PORT, () => {
    console.info(`bull-board Running on localhost:${PORT}`);
    console.info(`For the UI, open http://localhost:${PORT}/admin/queues`);
    console.info(`Make sure Redis is running on port ${queueOptions.redis.port} by default`);
  });
};

export const getAddQueue = () => {
  if (!addQueueMethod) {
    throw new Error('initBull must be called before using getAddQueue');
  }
  return addQueueMethod;
};

export const getRemoveQueue = () => {
  if (!removeQueueMethod) {
    throw new Error('initBull must be called before using getRemoveQueue');
  }
  return removeQueueMethod;
};
