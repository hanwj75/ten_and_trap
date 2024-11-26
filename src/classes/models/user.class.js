class User {
  constructor(id, socket, userId, nickName, joinRoom, character, characterPosition) {
    this.id = id;
    this.socket = socket;
    this.userId = userId;
    this.nickName = nickName;
    this.joinRoom = joinRoom;
    this.character = character;
    this.characterPosition = characterPosition;
  }
}

export default User;
