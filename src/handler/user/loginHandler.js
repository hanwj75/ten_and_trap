import jwt from 'jsonwebtoken';
import JoiUtils from '../../utils/joi.util.js';
import { packetType } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import bcrypt from 'bcrypt';
import { updateUserLogin, findUserById } from '../../db/user/user.db.js';
import envFiles from '../../constants/env.js';
import { addUser, findUser } from '../../sessions/user.session.js';
import User from '../../classes/models/user.class.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import Character from '../../classes/models/character.class.js';
/**
 *
 * @desc 로그인
 * @author 박건순
 *
 */
export const loginHandler = async (socket, payload) => {
  try {
    console.log(`login:${payload.loginRequest}`);
    const { email, password } = await JoiUtils.validateSignIn(payload.loginRequest);

    // 아이디 존재 검증
    const checkExistId = await findUserById(email);

    if (!checkExistId) {
      return makeResponse(
        socket,
        false,
        '아이디 또는 비밀번호가 잘못되었습니다.',
        '',
        '',
        GlobalFailCode.values.AUTHENTICATION_FAILED,
      );
    }

    // 비밀번호 존재 검증
    const checkPassword = await bcrypt.compare(password, checkExistId.password);
    if (!checkPassword) {
      return makeResponse(
        socket,
        false,
        '아이디 또는 비밀번호가 잘못되었습니다.',
        '',
        '',
        GlobalFailCode.values.AUTHENTICATION_FAILED,
      );
    }

    // 중복 로그인 방지
    const isExistUser = await findUser(checkExistId.nickName);

    if (isExistUser) {
      return makeResponse(
        socket,
        false,
        '이미 접속중인 아이디',
        '',
        '',
        GlobalFailCode.values.AUTHENTICATION_FAILED,
      );
    }

    // 캐릭터 클래스 생성 (캐릭터 종류, 역할, 체력, 무기, 상태, 장비, 디버프, handCards, 뱅카운터, handCardsCount)
    const loginCharacter = new Character(0, 0, 5, 0, {}, 0, 0, {}, 0, 0);
    // 유저 클래스 생성
    const loginUser = new User(
      checkExistId.id,
      socket,
      email,
      checkExistId.nickName,
      loginCharacter,
    );
    await addUser(loginUser);
    await updateUserLogin(email);

    // 토큰 생성
    const accessToken = jwt.sign(
      {
        userId: checkExistId.userId,
      },
      envFiles.jwt.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '1h' },
    );

    const totalToken = `Bearer ${accessToken}`;
    const userInfo = {
      id: checkExistId.id,
      nickname: checkExistId.nickName,
      character: JSON.stringify({ characterType: 1 }),
    };
    await redis.addRoomRedis(email, userInfo);
    return makeResponse(
      socket,
      true,
      'Login Success',
      totalToken,
      userInfo,
      GlobalFailCode.values.NONE_FAILCODE,
    );
  } catch (err) {
    console.error(err);
  }
};

const makeResponse = (socket, success, message, token, userInfo, failCode) => {
  const LoginResponse = {
    loginResponse: {
      success: success,
      message: message,
      token: token,
      myInfo: userInfo,
      failCode: failCode,
    },
  };

  const loginResponse = createResponse(LoginResponse, packetType.LOGIN_RESPONSE, 0);
  socket.write(loginResponse);

  return;
};
