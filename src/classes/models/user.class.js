class User {
  constructor(id, socket, userId, joinRoom, nickName, characterPosition) {
    this.id = id;
    this.socket = socket;
    this.userId = userId;
    this.joinRoom = joinRoom;
    this.nickName = nickName;
    this.characterPosition = characterPosition;
  }
}

export default User;
