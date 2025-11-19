const CardRepository = require('../repositories/Card.repository');
const InventoryRepository = require('../repositories/inventory.repository');
const UserRepository = require('../repositories/user.repository');

/**
 * Gacha Service
 * Handles card pulls with pity system
 */
class GachaService {
  constructor() {
    this.cardRepository = new CardRepository();
    this.inventoryRepository = new InventoryRepository();
    this.userRepository = new UserRepository();

    // Gacha rates (percentages)
    this.rates = {
      legendary: 0.5,    // 0.5%
      epic: 5.0,         // 5%
      rare: 20.0,        // 20%
      common: 74.5       // 74.5%
    };

    // Pity system
    this.pity = {
      epicGuarantee: 10,      // Guaranteed epic every 10 pulls
      legendaryGuarantee: 180 // Guaranteed legendary every 180 pulls
    };

    // Cost per pull
    this.pullCost = {
      single: 1,
      multi: 10
    };
  }

  /**
   * Pull single card
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Pull result
   */
  async pullSingle(userId) {
    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has enough coins
    if (user.coins < this.pullCost.single) {
      throw new Error('Not enough coins');
    }

    // Deduct coins
    await this.userRepository.updateById(userId, {
      coins: user.coins - this.pullCost.single
    });

    // Perform pull
    const result = await this._performPull(user);

    // Add card to inventory
    await this.inventoryRepository.addCard(user.inventory, result.card._id);

    return {
      card: result.card,
      rarity: result.rarity,
      isPity: result.isPity,
      coinsRemaining: user.coins - this.pullCost.single,
      pityCounters: result.pityCounters
    };
  }

  /**
   * Pull 10 cards
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Pull results
   */
  async pullMulti(userId) {
    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has enough coins
    if (user.coins < this.pullCost.multi) {
      throw new Error('Not enough coins');
    }

    // Deduct coins
    await this.userRepository.updateById(userId, {
      coins: user.coins - this.pullCost.multi
    });

    // Perform 10 pulls
    const results = [];
    let userState = user;

    for (let i = 0; i < 10; i++) {
      const result = await this._performPull(userState);
      results.push(result);

      // Update user state for next pull
      userState.gachaPity = result.pityCounters;

      // Add card to inventory
      await this.inventoryRepository.addCard(user.inventory, result.card._id);
    }

    return {
      cards: results.map(r => ({
        card: r.card,
        rarity: r.rarity,
        isPity: r.isPity
      })),
      coinsRemaining: user.coins - this.pullCost.multi,
      pityCounters: results[results.length - 1].pityCounters,
      summary: this._generatePullSummary(results)
    };
  }

  /**
   * Perform a single pull with pity logic
   * @private
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Pull result
   */
  async _performPull(user) {
    const pity = user.gachaPity || {
      totalPulls: 0,
      pullsSinceLastEpic: 0,
      pullsSinceLastLegendary: 0
    };

    let rarity;
    let isPity = false;

    // Check legendary pity (180 pulls)
    if (pity.pullsSinceLastLegendary >= this.pity.legendaryGuarantee - 1) {
      rarity = 'legendary';
      isPity = true;
      pity.pullsSinceLastLegendary = 0;
      pity.pullsSinceLastEpic = 0; // Reset epic pity too
    }
    // Check epic pity (10 pulls)
    else if (pity.pullsSinceLastEpic >= this.pity.epicGuarantee - 1) {
      rarity = 'epic';
      isPity = true;
      pity.pullsSinceLastEpic = 0;
    }
    // Normal random pull
    else {
      rarity = this._determineRarity();

      // Reset counters if we got rare+ naturally
      if (rarity === 'legendary') {
        pity.pullsSinceLastLegendary = 0;
        pity.pullsSinceLastEpic = 0;
      } else if (rarity === 'epic') {
        pity.pullsSinceLastEpic = 0;
      }
    }

    // Increment counters
    pity.totalPulls++;
    if (rarity !== 'legendary') {
      pity.pullsSinceLastLegendary++;
    }
    if (rarity !== 'epic' && rarity !== 'legendary') {
      pity.pullsSinceLastEpic++;
    }

    // Update user pity counters in database
    await this.userRepository.updateById(user._id, {
      gachaPity: pity
    });

    // Get random card of determined rarity
    const cards = await this.cardRepository.findByRarity(rarity);
    
    if (!cards || cards.length === 0) {
      throw new Error(`No cards available for rarity: ${rarity}`);
    }

    const randomCard = cards[Math.floor(Math.random() * cards.length)];

    return {
      card: randomCard,
      rarity,
      isPity,
      pityCounters: pity
    };
  }

  /**
   * Determine rarity based on rates
   * @private
   * @returns {string} - Rarity
   */
  _determineRarity() {
    const roll = Math.random() * 100;

    if (roll < this.rates.legendary) {
      return 'legendary';
    } else if (roll < this.rates.legendary + this.rates.epic) {
      return 'epic';
    } else if (roll < this.rates.legendary + this.rates.epic + this.rates.rare) {
      return 'rare';
    } else {
      return 'common';
    }
  }

  /**
   * Generate summary of multi-pull
   * @private
   */
  _generatePullSummary(results) {
    const summary = {
      legendary: 0,
      epic: 0,
      rare: 0,
      common: 0,
      pityPulls: 0
    };

    results.forEach(result => {
      summary[result.rarity]++;
      if (result.isPity) {
        summary.pityPulls++;
      }
    });

    return summary;
  }

  /**
   * Get user gacha info
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Gacha info
   */
  async getUserGachaInfo(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const pity = user.gachaPity || {
      totalPulls: 0,
      pullsSinceLastEpic: 0,
      pullsSinceLastLegendary: 0
    };

    return {
      coins: user.coins,
      pityCounters: pity,
      nextGuaranteed: {
        epic: this.pity.epicGuarantee - pity.pullsSinceLastEpic,
        legendary: this.pity.legendaryGuarantee - pity.pullsSinceLastLegendary
      },
      pullCosts: this.pullCost,
      rates: this.rates
    };
  }

  /**
   * Award coins to user (called after game ends)
   * @param {string} userId - User ID
   * @param {number} amount - Coins to award
   */
  async awardCoins(userId, amount) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.updateById(userId, {
      coins: user.coins + amount
    });

    return {
      coinsEarned: amount,
      totalCoins: user.coins + amount
    };
  }
}

module.exports = GachaService;