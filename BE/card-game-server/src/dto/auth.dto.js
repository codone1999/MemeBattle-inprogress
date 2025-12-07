/**
 * Register Request DTO
 */
class RegisterRequestDto {
  constructor({ email, username, password, displayName }) {
    this.email = email?.trim().toLowerCase();
    this.username = username?.trim().toLowerCase();
    this.password = password;
    this.displayName = displayName?.trim();
  }
}

/**
 * Login Request DTO
 */
class LoginRequestDto {
  constructor({ email, username, password }) {
    this.email = email?.trim().toLowerCase();
    this.username = username?.trim().toLowerCase();
    this.password = password;
  }
}

/**
 * User Response DTO (excludes sensitive data)
 */
class UserResponseDto {
  constructor(user) {
    this._id = user._id;
    this.username = user.username;
    this.email = user.email;
    this.displayName = user.displayName;
    this.profilePic = user.profilePic;
    this.isEmailVerified = user.isEmailVerified || false;
    this.isOnline = user.isOnline || false;
    this.stats = user.stats || {
      winRate: 0,
      totalGames: 0,
      wins: 0,
      losses: 0
    };
    this.createdAt = user.createdAt;
  }
}

/**
 * Auth Response DTO (includes tokens and user data)
 */
class AuthResponseDto {
  constructor(user, tokens) {
    this.user = new UserResponseDto(user);
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }
}

/**
 * Email Verification Request DTO
 */
class EmailVerificationRequestDto {
  constructor({ token }) {
    this.token = token?.trim();
  }
}

/**
 * Refresh Token Request DTO
 */
class RefreshTokenRequestDto {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}

module.exports = {
  RegisterRequestDto,
  LoginRequestDto,
  UserResponseDto,
  AuthResponseDto,
  EmailVerificationRequestDto,
  RefreshTokenRequestDto
};