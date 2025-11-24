/**
 * Formats a user for search results
 */
class UserSearchResponseDto {
  constructor(user) {
    this._id = user._id;
    this.uid = user.uid;
    this.username = user.username;
    this.displayName = user.displayName;
    this.profilePic = user.profilePic;
    this.isOnline = user.isOnline;
    this.lastLogin = user.lastLogin;
  }
}

/**
 * Formats a user's friend
 */
class FriendResponseDto {
  constructor(friend) {
    this.friendId = friend._id; // The User._id
    this.uid = friend.uid;
    this.username = friend.username;
    this.displayName = friend.displayName;
    this.profilePic = friend.profilePic;
    this.isOnline = friend.isOnline;
    this.lastLogin = friend.lastLogin;
  }
}

/**
 * Formats a friend request (for sent and pending lists)
 */
class FriendRequestResponseDto {
  constructor(request, perspective = 'sender') {
    this._id = request._id; 
    this.status = request.status;
    this.createdAt = request.createdAt;
    
    // Always include both users for clarity
    if (request.fromUserId) {
      this.fromUser = {
        _id: request.fromUserId._id,
        uid: request.fromUserId.uid,
        username: request.fromUserId.username,
        displayName: request.fromUserId.displayName,
        profilePic: request.fromUserId.profilePic,
        isOnline: request.fromUserId.isOnline
      };
    }
    
    if (request.toUserId) {
      this.toUser = {
        _id: request.toUserId._id,
        uid: request.toUserId.uid,
        username: request.toUserId.username,
        displayName: request.toUserId.displayName,
        profilePic: request.toUserId.profilePic,
        isOnline: request.toUserId.isOnline
      };
    }
    
    // ✅ Maintain backward compatibility
    if (perspective === 'sender' && request.toUserId) {
      this.recipient = this.toUser;
    } else if (perspective === 'recipient' && request.fromUserId) {
      this.sender = this.fromUser;
    }
  }
}

module.exports = {
  UserSearchResponseDto,
  FriendResponseDto,
  FriendRequestResponseDto
};