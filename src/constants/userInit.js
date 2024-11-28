export const userInit = {
  handCards: JSON.stringify([
    { type: 1, count: 1 },
    { type: 2, count: 1 },
    { type: 3, count: 1 },
    { type: 4, count: 1 },
  ]),
  handCardsCount: 4,
  joinRoom: null,
  stateInfo: JSON.stringify({ state: 0, nextStage: 0, nextStageAt: 0, stateTargetUserId: 0 }),
};

export const updataData = {
  joinRoom: null,
  characterPosition: { x: 0, y: 0 },
  character: {
    stateInfo: { state: 0, nextStage: 0, nextStageAt: 0, stateTargetUserId: 0 },
    handCards: [
      { type: 1, count: 1 },
      { type: 2, count: 1 },
      { type: 3, count: 1 },
      { type: 4, count: 1 },
    ],
    handCardsCount: 4,
  },
};
