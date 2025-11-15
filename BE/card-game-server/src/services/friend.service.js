const UserRepository = require('../repositories/user.repository');
const FriendRequestRepository = require('../repositories/friendRequest.repository');
const { FriendResponseDto, FriendRequestResponseDto } = require('../dto/friend.dto');

class FriendService {
  constructor() {
    this.userRepository = new UserRepository();
    this.friendRequestRepository = new FriendRequestRepository();
  }

  /**
   * Get a user's friend list
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>}
   */
  async getFriends(userId) {
    const friends = await this.userRepository.getFriends(userId);
    return friends.map(friend => new FriendResponseDto(friend));
  }

  /**
   * Send a friend request
   * @param {string} fromUserId - Sender's ID
   * @param {string} toUserId - Recipient's ID
   * @returns {Promise<Object>}
   */
  async sendRequest(fromUserId, toUserId) {
    if (fromUserId === toUserId) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    // Check if they are already friends
    const fromUser = await this.userRepository.findById(fromUserId);
    if (fromUser.friends.includes(toUserId)) {
      throw new Error('You are already friends with this user.');
    }

    // Check if a pending request already exists
    const existingRequest = await this.friendRequestRepository.findPendingRequest(fromUserId, toUserId);
    if (existingRequest) {
      throw new Error('A pending friend request already exists.');
    }

    // Create and return the new request
    const newRequest = await this.friendRequestRepository.create(fromUserId, toUserId);
    return newRequest;
  }

  /**
   * Get requests sent by the user
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>}
   */
  async getSentRequests(userId) {
    const requests = await this.friendRequestRepository.findSentRequests(userId);
    return requests.map(req => new FriendRequestResponseDto(req, 'sender'));
  }

  /**
   * Get requests pending for the user
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>}
   */
  async getPendingRequests(userId) {
    const requests = await this.friendRequestRepository.findPendingRequests(userId);
    return requests.map(req => new FriendRequestResponseDto(req, 'recipient'));
  }

  /**
   * Accept a friend request
   * @param {string} requestId - The request ID
   * @param {string} currentUserId - The user accepting (must be the recipient)
   * @returns {Promise<boolean>}
   */
  async acceptRequest(requestId, currentUserId) {
    const request = await this.friendRequestRepository.findById(requestId);

    if (!request) {
      throw new Error('Request not found.');
    }
    if (request.status !== 'pending') {
      throw new Error('This request is no longer pending.');
    }
    if (request.toUserId.toString() !== currentUserId) {
      throw new Error('You do not have permission to accept this request.');
    }

    // Add each user to the other's friend list
    await this.userRepository.addFriend(request.fromUserId, request.toUserId);
    await this.userRepository.addFriend(request.toUserId, request.fromUserId);

    // As requested, remove the request after handling
    await this.friendRequestRepository.removeById(requestId);
    return true;
  }

  /**
   * Decline a friend request
   * @param {string} requestId - The request ID
   * @param {string} currentUserId - The user declining (must be the recipient)
   * @returns {Promise<boolean>}
   */
  async declineRequest(requestId, currentUserId) {
    const request = await this.friendRequestRepository.findById(requestId);

    if (!request) {
      throw new Error('Request not found.');
    }
    if (request.status !== 'pending') {
      throw new Error('This request is no longer pending.');
    }
    if (request.toUserId.toString() !== currentUserId) {
      throw new Error('You do not have permission to decline this request.');
    }

    // As requested, remove the request after handling
    await this.friendRequestRepository.removeById(requestId);
    return true;
  }

  /**
   * Remove a friend
   * @param {string} currentUserId - The user initiating the removal
   * @param {string} friendIdToRemove - The friend to be removed
   * @returns {Promise<boolean>}
   */
  async removeFriend(currentUserId, friendIdToRemove) {
    // Remove friend from current user's list
    const userUpdate = await this.userRepository.removeFriend(currentUserId, friendIdToRemove);
    // Remove current user from friend's list
    const friendUpdate = await this.userRepository.removeFriend(friendIdToRemove, currentUserId);

    if (!userUpdate || !friendUpdate) {
      throw new Error('Could not find user or friend to remove.');
    }
    return true;
  }
}

module.exports = FriendService;