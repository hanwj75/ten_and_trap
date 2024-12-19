class Character {
  constructor(characterType, roleType, hp, weapon, stateInfo, equips, debuffs, handCards, bbangCount, handCardsCount) {
    this.characterType = characterType;
    this.roleType = roleType;
    this.hp = hp;
    this.weapon = weapon;
    this.stateInfo = stateInfo;
    this.equips = equips;
    this.debuffs = debuffs;
    this.handCards = handCards;
    this.bbangCount = bbangCount;
    this.handCardsCount = handCardsCount;
  }
}

export default Character;
