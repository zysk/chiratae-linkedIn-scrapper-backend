import mongoose, { Document, Schema, Model } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.utils';

// Interface representing a Proxy document
export interface IProxy extends Document {
  host: string;
  port: number;
  username?: string;
  encryptedPassword?: string;
  protocol: string;
  description?: string;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  setPassword: (password: string) => void;
  getPassword: () => string | null;
  getProxyString: () => string;
}

// Interface for the Proxy model with static methods
export interface IProxyModel extends Model<IProxy> {
  findAvailable(): Promise<IProxy[]>;
  incrementUsage(proxyId: mongoose.Types.ObjectId): Promise<void>;
}

// Schema definition
const proxySchema = new Schema<IProxy>(
  {
    host: {
      type: String,
      required: [true, 'Host is required'],
      trim: true,
    },
    port: {
      type: Number,
      required: [true, 'Port is required'],
      min: [1, 'Port must be greater than 0'],
      max: [65535, 'Port cannot exceed 65535'],
    },
    username: {
      type: String,
      trim: true,
    },
    encryptedPassword: {
      type: String,
    },
    protocol: {
      type: String,
      required: [true, 'Protocol is required'],
      enum: {
        values: ['http', 'https', 'socks4', 'socks5'],
        message: 'Protocol must be http, https, socks4, or socks5',
      },
      default: 'http',
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Method to set encrypted password
proxySchema.methods.setPassword = function (password: string): void {
  this.encryptedPassword = encrypt(password);
};

// Method to get decrypted password
proxySchema.methods.getPassword = function (): string | null {
  return this.encryptedPassword ? decrypt(this.encryptedPassword) : null;
};

// Method to get proxy connection string
proxySchema.methods.getProxyString = function (): string {
  let proxyString = `${this.protocol}://${this.host}:${this.port}`;

  if (this.username && this.encryptedPassword) {
    const password = this.getPassword();
    proxyString = `${this.protocol}://${this.username}:${password}@${this.host}:${this.port}`;
  }

  return proxyString;
};

// Static method to find available proxies
proxySchema.statics.findAvailable = async function (): Promise<IProxy[]> {
  return this.find({ isActive: true })
    .sort({ usageCount: 1, lastUsed: 1 })
    .limit(10);
};

// Static method to increment usage count for a proxy
proxySchema.statics.incrementUsage = async function (
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
proxySchema.pre('save', async function(next) {
  if (this.isNew) {
    const Proxy = mongoose.model<IProxy, IProxyModel>('Proxy', proxySchema);
    Proxy.findOne({
      host: this.host,
      port: this.port,
      protocol: this.protocol,
      _id: { $ne: this._id }
    })
    .then((existingProxy) => {
      if (existingProxy) {
        return next(new Error('Proxy with this host, port, and protocol already exists'));
      }
      next();
    })
    .catch((err) => next(err));
  } else {
    next();
  }
});

// Create and export the model
const Proxy = mongoose.model<IProxy, IProxyModel>('Proxy', proxySchema);
export default Proxy;
