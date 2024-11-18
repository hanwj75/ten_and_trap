import joi from 'joi';

export default class JoiUtils {
  /**
   * 회원가입 데이터 검증
   * @param {*} body
   * @returns
   */
  static async validateSignUp(body) {
    const emailRegExp = /^[0-9a-z]*@[0-9a-z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

    const joiSchema = joi.object({
      email: joi.string().regex(emailRegExp).required().messages({
        'string.base': 'Email은 문자열이어야 합니다.',
        'any.required': 'Email을 입력해주세요.',
        'string.pattern.base': 'Email이 형식에 맞지 않습니다.[영어 소문자 + 숫자 조합]',
      }),
      nickname: joi.string().max(12).required().messages({
        'string.base': '닉네임은 문자열이어야 합니다.',
        'string.max': `닉네임의 길이는 최대 {#limit}자 이하입니다.`,
        'any.required': '닉네임을 입력해주세요.',
      }),
      password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(4).required().messages({
        'string.base': '비밀번호는 문자열이어야 합니다.',
        'string.min': `비밀번호의 길이는 최소 {#limit}자 이상입니다.`,
        'any.required': '비밀번호를 입력해주세요.',
      }),
    });

    const validation = await joiSchema.validateAsync(body);

    return validation;
  }

  /**
   * 로그인 데이터 검증
   * @param {*} body
   * @returns
   */
  static async validateSignIn(body) {
    const emailRegExp = /^[0-9a-z]*@[0-9a-z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

    const joiSchema = joi.object({
      email: joi.string().regex(emailRegExp).required().messages({
        'string.base': 'Email은 문자열이어야 합니다.',
        'any.required': 'Email을 입력해주세요.',
        'string.pattern.base': 'Email이 형식에 맞지 않습니다.[영어 소문자 + 숫자 조합]',
      }),
      password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(4).required().messages({
        'string.base': '비밀번호는 문자열이어야 합니다.',
        'string.min': `비밀번호의 길이는 최소 {#limit}자 이상입니다.`,
        'any.required': '비밀번호를 입력해주세요.',
      }),
    });

    const validation = await joiSchema.validateAsync(body);

    return validation;
  }
}
