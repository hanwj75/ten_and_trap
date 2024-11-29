// 초기값

// class Character {
//   constructor(
//     characterType,
//     roleType,
//     hp,
//     weapon,
//     stateInfo,
//     equips,
//     debuffs,
//     handCards,
//     bbangCount,
//     handCardsCount,
//   )
// Redis
export const redisInit = {
  characterType: 0,
  roleType: 0,
  hp: 5,
  weapon: 0,
  debuffs: JSON.stringify([]),
  equips: JSON.stringify([]),
  bbangCount: 0,
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

export const sessionInit = {
  joinRoom: null,
  characterPosition: { x: 0, y: 0 },
};

export const sessionJoinRoom = {
  joinRoom: null,
};

export const sessionCharacterPosition = {
  characterPosition: {
    x: 0,
    y: 0,
  },
};
//게임이 시작할때 세팅을해줘야하는 초기값
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
