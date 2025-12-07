const FriendRequest = require('../models/FriendRequest.model');

class FriendRequestRepository {
  /**
   * Create a new friend request
   * @param {string} fromUserId - Sender's ID
   * @param {string} toUserId - Recipient's ID
   * @returns {Promise<Object>}
   */
  async create(fromUserId, toUserId) {
    const request = new FriendRequest({ fromUserId, toUserId, status: 'pending' });
    const saved = await request.save();
    
    // ✅ Populate both users before returning
    return await FriendRequest.findById(saved._id)
      .populate('fromUserId', '_id username displayName profilePic isOnline')
      .populate('toUserId', '_id username displayName profilePic isOnline');
  }

  /**
   * Find a request by its ID
   * @param {string} requestId - The ID of the request
   * @returns {Promise<Object|null>}
   */
  async findById(requestId) {
    return await FriendRequest.findById(requestId)
      .populate('fromUserId', '_id username displayName profilePic isOnline')
      .populate('toUserId', '_id username displayName profilePic isOnline');
  }

  /**
   * Find a pending request between two users
   * @param {string} user1Id 
   * @param {string} user2Id 
   * @returns {Promise<Object|null>}
   */
  async findPendingRequest(user1Id, user2Id) {
    return await FriendRequest.findOne({
      status: 'pending',
      $or: [
        { fromUserId: user1Id, toUserId: user2Id },
        { fromUserId: user2Id, toUserId: user1Id }
      ]
    })
    .populate('fromUserId', '_id username displayName profilePic isOnline')
    .populate('toUserId', '_id username displayName profilePic isOnline');
  }

  /**
   * Get all requests sent *by* a user
   * @param {string} userId - The sender's ID
   * @returns {Promise<Array>}
   */
  async findSentRequests(userId) {
    return await FriendRequest.find({ fromUserId: userId, status: 'pending' })
      .populate('fromUserId', '_id username displayName profilePic isOnline')
      .populate('toUserId', '_id username displayName profilePic isOnline');
  }

  /**
   * Get all pending requests *for* a user
   * @param {string} userId - The recipient's ID
   * @returns {Promise<Array>}
   */
  async findPendingRequests(userId) {
    return await FriendRequest.find({ toUserId: userId, status: 'pending' })
      .populate('fromUserId', '_id username displayName profilePic isOnline')
      .populate('toUserId', '_id username displayName profilePic isOnline');
  }

  /**
   * Delete a request by its ID
   * @param {string} requestId - The ID of the request
   * @returns {Promise<Object|null>}
   */
  async removeById(requestId) {
    return await FriendRequest.findByIdAndDelete(requestId);
  }
}

module.exports = FriendRequestRepository;