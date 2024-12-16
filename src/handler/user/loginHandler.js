import jwt from 'jsonwebtoken';
import JoiUtils from '../../utils/joi.util.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';
import bcrypt from 'bcrypt';
import { updateUserLogin, findUserById } from '../../db/user/user.db.js';
import envFiles from '../../constants/env.js';
import { addUser, findUser, getAllUser } from '../../sessions/user.session.js';
import User from '../../classes/models/user.class.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { redis } from '../../init/redis/redis.js';
import Character from '../../classes/models/character.class.js';
import axios from 'axios';
import { access } from 'fs';
/**
 *
 * @desc 로그인
 * @author 박건순
 *
 */
export const loginHandler = async (socket, payload) => {
  try {
    const testurl = 'http://127.0.0.1:3336';
    const testdata = payload.loginRequest;
    await axios.post(`${testurl}/login`, { testdata, socket });

    //여기서 서버 기능을 불러와서 일을하고
    const { email, password } = await JoiUtils.validateSignIn(payload.loginRequest);

    const checkExistId = await redis.getAllFieldsFromHash(`aaa${email}`);

    // 유저 클래스 생성
    const loginUser = new User(Number(checkExistId.id), socket, email, null, checkExistId.nickName, { x: 0, y: 0 });
    await addUser(loginUser);

    // 이쪽서버 세션에 추가가 필요
    const totalToken = `Bearer ${redis.getRedis(email)}`;
    const userInfoToResponse = await redis.getAllFieldsFromHash(`user:${email}`);
    await redis.delRedisByKey(`aaa${email}`);
    await redis.delRedisByKey(`user:${email}`);
    return makeResponse(socket, true, 'Login Success', totalToken, userInfoToResponse, GlobalFailCode.values.NONE_FAILCODE);
  } catch (err) {
    handleError(socket, err);
  }
};

const makeResponse = (socket, success, message, token, userInfo, failCode) => {
  const loginPayload = {
    loginResponse: { success, message, token, myInfo: userInfo, failCode },
  };

  const loginResponse = createResponse(loginPayload, PACKET_TYPE.LOGIN_RESPONSE, 0);
  socket.write(loginResponse);

  return;
};
