import { lobbyService } from '../services/lobbyService.js';

export const lobbyController = {
  async createLobby(req, res, next) {
    try {
      const { lobbyName, isPrivate, password, gameMode } = req.body;
      
      const lobby = await lobbyService.createLobby({
        hostUid: req.user.uid,
        lobbyName,
        isPrivate,
        password,
        gameMode
      });

      res.status(201).json({
        success: true,
        message: 'Lobby created',
        data: { lobby }
      });
    } catch (error) {
      next(error);
    }
  },

  async getLobbies(req, res, next) {
    try {
      const lobbies = await lobbyService.getLobbies(req.user.uid);

      res.json({
        success: true,
        data: { lobbies }
      });
    } catch (error) {
      next(error);
    }
  },

  async joinLobby(req, res, next) {
    try {
      const { lobbyId, password } = req.body;

      await lobbyService.joinLobby({
        lobbyId,
        userId: req.user.uid,
        password
      });

      res.json({
        success: true,
        message: 'Joined lobby'
      });
    } catch (error) {
      next(error);
    }
  },
async leaveLobby(req, res, next) {
  try {
    const { lobbyId } = req.params;
    
    await lobbyService.leaveLobby({
      lobbyId: lobbyId, 
      userId: req.user.uid
    });

    res.json({
      success: true,
      message: 'Left lobby'
    });
  } catch (error) {
    next(error);
  }
},

  async sendInvite(req, res, next) {
    try {
      const { lobbyId, toUserId } = req.body;

      await lobbyService.sendLobbyInvite({
        lobbyId,
        fromUserId: req.user.uid,
        toUserId
      });

      res.json({
        success: true,
        message: 'Invite sent'
      });
    } catch (error) {
      next(error);
    }
  },

  async getPendingInvites(req, res, next) {
    try {
      const invites = await lobbyService.getPendingInvites(req.user.uid);

      res.json({
        success: true,
        data: { invites }
      });
    } catch (error) {
      next(error);
    }
  },

  async acceptInvite(req, res, next) {
    try {
      const { inviteId } = req.params;

      const result = await lobbyService.acceptInvite({
        inviteId: parseInt(inviteId),
        userId: req.user.uid
      });

      res.json({
        success: true,
        message: 'Invite accepted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async declineInvite(req, res, next) {
    try {
      const { inviteId } = req.params;

      await lobbyService.declineInvite({
        inviteId: parseInt(inviteId),
        userId: req.user.uid
      });

      res.json({
        success: true,
        message: 'Invite declined'
      });
    } catch (error) {
      next(error);
    }
  },
  async getLobby(req, res, next) {
  try {
    const { lobbyId } = req.params;
    const lobby = await lobbyService.getLobby(lobbyId);

    res.json({
      success: true,
      data: { lobby }
    });
  } catch (error) {
    next(error);
  }
},

async updateSelection(req, res, next) {
  try {
    const { lobbyId, deckId, characterId } = req.body;
    
    const lobby = await lobbyService.updateSelection({
      lobbyId,
      userId: req.user.uid,
      deckId,
      characterId
    });

    res.json({
      success: true,
      data: { lobby }
    });
  } catch (error) {
    next(error);
  }
},

async updateMap(req, res, next) {
  try {
    const { lobbyId, mapId } = req.body;
    
    const lobby = await lobbyService.updateMap({
      lobbyId,
      mapId
    });

    res.json({
      success: true,
      data: { lobby }
    });
  } catch (error) {
    next(error);
  }
},

async startGame(req, res, next) {
  try {
    const { lobbyId } = req.params;
    
    await lobbyService.startGame(lobbyId);

    res.json({
      success: true,
      message: 'Game started'
    });
  } catch (error) {
    next(error);
  }
}
};