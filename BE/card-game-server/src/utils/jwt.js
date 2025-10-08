import jwt from 'jsonwebtoken';

export function generateAccessToken(payload){
  return jwt.sign(payload,process.env.JWT_SECRET,{
    expiresIn:'15m'
  })
}

export function generateRefreshToken(payload){
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET,{
      expiresIn: '7d'
    }
  )
}
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    throw new Error('Invalid refresh token');
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}