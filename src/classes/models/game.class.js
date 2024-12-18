class Game {
  constructor(roomId, curInterval, currentIndex, userPositions, positionUpdateSwitch) {
    this.roomId = roomId;
    this.curInterval = curInterval;
    this.currentIndex = currentIndex;
    this.userPositions = userPositions;
    this.positionUpdateSwitch = positionUpdateSwitch;
  }
}

export default Game;
