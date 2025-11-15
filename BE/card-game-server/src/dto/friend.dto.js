/**
 * Formats a user for search results
 */
class UserSearchResponseDto {
  constructor(user) {
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
    this.requestId = request._id;
    this.status = request.status;
    this.createdAt = request.createdAt;

    // Depending on if we are viewing sent or pending, populate the other user
    if (perspective === 'sender' && request.toUserId) {
      this.recipient = new UserSearchResponseDto(request.toUserId);
    } else if (perspective === 'recipient' && request.fromUserId) {
      this.sender = new UserSearchResponseDto(request.fromUserId);
    }
  }
}

module.exports = {
  UserSearchResponseDto,
  FriendResponseDto,
  FriendRequestResponseDto
};