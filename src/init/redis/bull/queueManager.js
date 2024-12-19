import Queue from 'bull';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';

const queueInstances = new Map();
const bullAdapters = new Map();

export const addQueue = (queueName, options) => {
  if (!queueInstances.has(queueName)) {
    const newQueue = new Queue(queueName, options);
    queueInstances.set(queueName, newQueue);
    bullAdapters.set(queueName, new BullAdapter(newQueue));
    // console.log(`Queue "${queueName}" added.`);
  } else {
    console.warn(`Queue "${queueName}" already exists.`);
  }
};
