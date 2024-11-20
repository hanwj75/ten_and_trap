class User {
  constructor(socket, userId, nickName, character) {
    this.socket = socket;
    this.userId = userId;
    this.nickName = nickName;
    this.character = character;
  }
}

export default User;
