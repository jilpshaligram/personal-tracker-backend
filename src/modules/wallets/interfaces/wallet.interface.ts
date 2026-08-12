export interface IWallet {
  /** The unique identifier of the wallet */
  readonly id: string;

  /** The user who owns this wallet */
  readonly userId: string;

  /**
   * The total balance in the wallet (including blocked funds).
   * Note: This is stored as a string or number depending on Sequelize return,
   * but typically Decimal translates to string in Sequelize to avoid precision loss.
   */
  readonly currentBalance: string | number;

  /**
   * The amount blocked/reserved for saving goals.
   */
  readonly blockedAmount: string | number;

  /**
   * The currency code, e.g., 'INR'
   */
  readonly currency: string;

  /** Record creation timestamp */
  readonly createdAt: Date;

  /** Record last update timestamp */
  readonly updatedAt: Date;

  /** Soft-delete timestamp */
  readonly deletedAt: Date | null;
}
