import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import envFiles from './constants/env.js';
import config from './config/config.js';
import { redis } from './init/redis/redis.js';
import { findUserById, updateUserLogin } from './db/user/user.db.js';
import JoiUtils from './utils/joi.util.js';
import Character from './classes/models/character.class.js';

const app = express();
const loginServerInfo = config.loginServer;

// JSON 파싱 미들웨어
app.use(express.json());

// **1. 로그인 요청 처리**
app.post('/login', async (req, res) => {
  try {
    const { email, password } = await JoiUtils.validateSignIn(req.body.loginData);

    // 아이디 존재 검증
    const checkExistId = await findUserById(email);

    if (!checkExistId) {
      return res.status(401).json({ massage: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    // 비밀번호 존재 검증
    const checkPassword = await bcrypt.compare(password, checkExistId.password);
    if (!checkPassword) {
      return res.status(401).json({ massage: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    const isExistUser = await redis.getAllFieldsFromHash(`user:${Number(checkExistId.id)}`);

    if (isExistUser.id) {
      return res.status(401).json({ massage: '이미 접속중인 계정입니다.' });
    }

    await redis.addRedisToHash(`loginData${email}`, checkExistId);

    const stateInfo = { state: 0, nextState: 0, nextStateAt: 0, stateTargetUserId: 0 };

    const loginCharacter = new Character(1, 3, 5, 0, stateInfo, [], [], [], 1, 2);

    await updateUserLogin(email);

    // JWT 발급
    const accessToken = jwt.sign(
      {
        userId: checkExistId.userId,
      },
      envFiles.jwt.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '1h' },
    );
    const userInfoToResponse = {
      id: checkExistId.id,
      nickname: checkExistId.nickName,
      character: JSON.stringify(loginCharacter), //JSON.stringify({ characterType: 1 }),
    };
    // 레디스에 jwt 저장

    await redis.setRedis(email, accessToken, 5);
    await redis.addRedisToHash(`user:${email}`, userInfoToResponse);
    const userInfoToRedis = {
      id: checkExistId.id,
      nickName: checkExistId.nickName,
      joinRoom: null,
      characterType: loginCharacter.characterType,
      roleType: loginCharacter.roleType,
      hp: loginCharacter.hp,
      weapon: loginCharacter.weapon,
      stateInfo: JSON.stringify(loginCharacter.stateInfo),
      equips: JSON.stringify(loginCharacter.equips), // 배열을 JSON 문자열로 변환
      debuffs: JSON.stringify(loginCharacter.debuffs), // 배열을 JSON 문자열로 변환
      handCards: JSON.stringify(loginCharacter.handCards), // 배열을 JSON 문자열로 변환
      bbangCount: loginCharacter.bbangCount,
      handCardsCount: loginCharacter.handCardsCount,
    };

    await redis.addRedisToHash(`user:${checkExistId.id}`, userInfoToRedis);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
  }
});

// 서버 시작
app.listen(loginServerInfo.PORT, () => {
  console.log(`Login server running on port ${loginServerInfo.PORT}`);
});
