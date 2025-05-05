import mongoose, { Document, Schema, Model } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.utils';

/**
 * Interface for Proxy document
 */
export interface IProxy extends Document {
  host: string;
  port: number;
  username?: string;
  encryptedPassword?: string;
  protocol?: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
  lastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  setPassword(password: string): void;
  getPassword(): string | null;
  getProxyString(): string;
}

/**
 * Interface for Proxy model with static methods
 */
export interface IProxyModel extends Model<IProxy> {
  findAvailable(): Promise<IProxy[]>;
  incrementUsage(proxyId: mongoose.Types.ObjectId): Promise<void>;
}

/**
 * Schema for Proxy model
 */
const ProxySchema = new Schema({
  host: {
    type: String,
    required: [true, 'Host is required'],
    trim: true
  },
  port: {
    type: Number,
    required: [true, 'Port is required'],
    min: [1, 'Port must be greater than 0'],
    max: [65535, 'Port must be less than or equal to 65535']
  },
  username: {
    type: String,
    trim: true
  },
  encryptedPassword: {
    type: String
  },
  protocol: {
    type: String,
    enum: ['http', 'https', 'socks4', 'socks5'],
    default: 'http'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create a unique compound index on host and port
ProxySchema.index({ host: 1, port: 1 }, { unique: true });

// Method to set encrypted password
ProxySchema.methods.setPassword = function(password: string): void {
  this.encryptedPassword = encrypt(password);
};

// Method to get decrypted password
ProxySchema.methods.getPassword = function(): string | null {
  return this.encryptedPassword ? decrypt(this.encryptedPassword) : null;
};

// Method to get proxy connection string
ProxySchema.methods.getProxyString = function(): string {
  let proxyString = `${this.protocol}://${this.host}:${this.port}`;

  if (this.username && this.encryptedPassword) {
    const password = this.getPassword();
    proxyString = `${this.protocol}://${this.username}:${password}@${this.host}:${this.port}`;
  }

  return proxyString;
};

// Static method to find available proxies
ProxySchema.statics.findAvailable = async function(): Promise<IProxy[]> {
  return this.find({ isActive: true })
    .sort({ usageCount: 1, lastUsed: 1 })
    .limit(10);
};

// Static method to increment usage count for a proxy
ProxySchema.statics.incrementUsage = async function(
  proxyId: mongoose.Types.ObjectId
): Promise<void> {
  await this.findByIdAndUpdate(
    proxyId,
    {
      $inc: { usageCount: 1 },
      lastUsed: new Date(),
    },
    { new: true }
  );
};

// Pre-save hook to check for duplicate proxies
ProxySchema.pre('save', async function(next) {
  if (this.isNew) {
    const ProxyModel = mongoose.model<IProxy, IProxyModel>('Proxy', ProxySchema);
    ProxyModel.findOne({
      host: this.host,
      port: this.port,
      protocol: this.protocol,
      _id: { $ne: this._id }
    })
    .then((existingProxy: IProxy | null) => {
      if (existingProxy) {
        return next(new Error('Proxy with this host, port, and protocol already exists'));
      }
      next();
    })
    .catch((err: Error) => next(err));
  } else {
    next();
  }
});

// Create and export the model
const Proxy = mongoose.model<IProxy, IProxyModel>('Proxy', ProxySchema);
export default Proxy;
