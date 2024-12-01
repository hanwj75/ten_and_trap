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
import { characterInitData } from '../../init/initData.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handleError } from '../../utils/error/errorHandler.js';
/**
 *
 * @desc 로그인
 * @author 박건순
 *
 */
export const loginHandler = async (socket, payload) => {
  try {
    const failCode = GlobalFailCode.values;
    const { email, password } = await JoiUtils.validateSignIn(payload.loginRequest);

    // 아이디 존재 검증
    const checkExistId = await findUserById(email);

    if (!checkExistId) {
      makeResponse(socket, false, '아이디 또는 비밀번호가 잘못되었습니다.', '', '', failCode.AUTHENTICATION_FAILED);
      throw new CustomError(ErrorCodes.AUTHENTICATION_FAILED, `아이디 또는 비밀번호가 잘못되었습니다.`);
    }

    // 비밀번호 존재 검증
    const checkPassword = await bcrypt.compare(password, checkExistId.password);
    if (!checkPassword) {
      makeResponse(socket, false, '아이디 또는 비밀번호가 잘못되었습니다.', '', '', failCode.AUTHENTICATION_FAILED);
      throw new CustomError(ErrorCodes.AUTHENTICATION_FAILED, `아이디 또는 비밀번호가 잘못되었습니다.`);
    }

    // 중복 로그인 방지
    const isExistUser = await findUser(checkExistId.nickName);

    if (isExistUser) {
      makeResponse(socket, false, '이미 접속중인 아이디', '', '', failCode.AUTHENTICATION_FAILED);
      throw new CustomError(ErrorCodes.AUTHENTICATION_FAILED, `이미 접속중인 아이디`);
    }

    // 유저 클래스 생성
    const loginUser = new User(checkExistId.id, socket, email, null, checkExistId.nickName, { x: 0, y: 0 });

    await addUser(loginUser);
    await updateUserLogin(email);

    // 토큰 생성
    const tokenKey = envFiles.jwt.ACCESS_TOKEN_SECRET_KEY;
    const accessToken = jwt.sign({ userId: checkExistId.userId }, tokenKey, { expiresIn: '1h' });

    const totalToken = `Bearer ${accessToken}`;
    // Response용
    const loginPayload = { id: checkExistId.id, nickname: checkExistId.nickName, character: characterInitData };

    // Redis용
    const userInfoToRedis = {
      id: checkExistId.id,
      nickName: checkExistId.nickName,
      joinRoom: null,
      characterType: characterInitData.characterType,
      roleType: characterInitData.roleType,
      hp: characterInitData.hp,
      weapon: characterInitData.weapon,
      stateInfo: JSON.stringify(characterInitData.stateInfo),
      equips: JSON.stringify(characterInitData.equips), // 배열을 JSON 문자열로 변환
      debuffs: JSON.stringify(characterInitData.debuffs), // 배열을 JSON 문자열로 변환
      handCards: JSON.stringify(characterInitData.handCards), // 배열을 JSON 문자열로 변환
      bbangCount: characterInitData.bbangCount,
      handCardsCount: characterInitData.handCardsCount,
    };

    await redis.addRedisToHash(`user:${checkExistId.id}`, userInfoToRedis);
    return makeResponse(socket, true, 'Login Success', totalToken, loginPayload, failCode.NONE_FAILCODE);
  } catch (err) {
    handleError(socket, err);
  }
};

const makeResponse = (socket, success, message, token, userInfo, failCode) => {
  const loginPayload = {
    loginResponse: { success, message, token, myInfo: userInfo, failCode },
  };

  const loginResponse = createResponse(loginPayload, packetType.LOGIN_RESPONSE, 0);
  socket.write(loginResponse);

  return;
};
