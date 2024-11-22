class User {
  constructor(id, socket, userId, nickName, character) {
    this.id = id;
    this.socket = socket;
    this.userId = userId;
    this.nickName = nickName;
    this.character = character;
  }
}

export default User;
