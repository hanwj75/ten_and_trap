class User {
  constructor(socket, userId, nickName) {
    this.socket = socket;
    this.userId = userId;
    this.nickName = nickName;
  }
}

export default User;
