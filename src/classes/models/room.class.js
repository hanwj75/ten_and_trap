class Room {
  constructor(id, ownerId, name, maxUserNum, state, users, tagger) {
    this.id = id;
    this.ownerId = ownerId; //방장인듯
    this.name = name; //방제목
    this.maxUserNum = maxUserNum < 4 ? 4 : maxUserNum;
    this.state = state; //대기=0 , 준비 =1 , 시작 = 2인듯
    this.users = users; //방에 들어온 유저 정보인듯
    this.isPushed = true;
    this.phase = 1;
    this.tagger = tagger; // 술래
  }
}

export default Room;
