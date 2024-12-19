class User {
  constructor(id, socket, userId, joinRoom, nickName) {
    this.id = id;
    this.socket = socket;
    this.userId = userId;
    this.joinRoom = joinRoom;
    this.nickName = nickName;
  }
}

export default User;
