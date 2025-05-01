import mongoose, { Document, Model, Schema } from 'mongoose';
import { IProxy } from '../interfaces/Proxy.interface';

// Interface for Proxy Document
export interface IProxyDocument extends IProxy, Document {}

// Interface for Proxy Model
export interface IProxyModel extends Model<IProxyDocument> {}

// Proxy Schema
const ProxySchema = new Schema<IProxyDocument, IProxyModel>(
  {
    value: {
      type: String,
      required: [true, 'Proxy value (address) is required'],
      unique: true,
      trim: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
ProxySchema.index({ value: 1 });
ProxySchema.index({ isValid: 1 });

// Proxy Model
const Proxy = mongoose.model<IProxyDocument, IProxyModel>('Proxy', ProxySchema);

export default Proxy;