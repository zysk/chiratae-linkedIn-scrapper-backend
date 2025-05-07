import { Request, Response, NextFunction } from 'express';
import Lead from '../models/lead.model';
import Campaign from '../models/campaign.model';
import User from '../models/user.model';
import LeadComment from '../models/leadComment.model';
import logger from '../utils/logger';
import { leadStatuses } from '../utils/constants';
import mongoose from 'mongoose';
import { JwtPayload } from '../utils/auth.utils';

// Extend Express Request type with the authenticated user
interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Lead controller for handling lead-related operations
 */
class LeadController {
  /**
   * Get all leads with optional filtering, pagination, and sorting
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public getLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { campaignId, status, leadAssignedToId, page = 1, limit = 10, sort } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};

      if (campaignId) {
        query.campaignId = campaignId;
      }

      if (status) {
        query.status = status;
      }

      if (leadAssignedToId) {
        query.leadAssignedToId = leadAssignedToId;
      }

      // Build sort options
      const sortOptions: any = {};
      if (sort) {
        const sortFields = String(sort).split(',');
        for (const field of sortFields) {
          if (field.startsWith('-')) {
            sortOptions[field.substring(1)] = -1;
          } else {
            sortOptions[field] = 1;
          }
        }
      } else {
        // Default sorting by createdAt in descending order
        sortOptions.createdAt = -1;
      }

      // Count total matching leads
      const total = await Lead.countDocuments(query);

      // Get leads with pagination and sorting
      const leads = await Lead.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('campaignId', 'name searchQuery')
        .populate('leadAssignedToId', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Leads retrieved successfully',
        data: {
          leads,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error(`Get leads error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving leads',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get a specific lead by ID
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public getLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID format'
        });
      }

      // Get lead
      const lead = await Lead.findById(id)
        .populate('campaignId', 'name searchQuery')
        .populate('leadAssignedToId', 'name email');

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lead retrieved successfully',
        data: lead
      });
    } catch (error) {
      logger.error(`Get lead by ID error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving the lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Update a lead by ID
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public updateLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, rating, leadAssignedToId } = req.body;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID format'
        });
      }

      // Validate status if provided
      if (status && !Object.values(leadStatuses).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
          validStatuses: Object.values(leadStatuses)
        });
      }

      // Validate assignee if provided
      if (leadAssignedToId && !mongoose.Types.ObjectId.isValid(leadAssignedToId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned user ID format'
        });
      }

      // Check if lead exists
      const existingLead = await Lead.findById(id);
      if (!existingLead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Update fields
      const updateData: any = {};
      if (status) updateData.status = status;
      if (rating !== undefined) updateData.rating = rating;
      if (leadAssignedToId) updateData.leadAssignedToId = leadAssignedToId;

      // Update lead
      const updatedLead = await Lead.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate('campaignId', 'name searchQuery')
        .populate('leadAssignedToId', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Lead updated successfully',
        data: updatedLead
      });
    } catch (error) {
      logger.error(`Update lead error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Delete a lead by ID
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public deleteLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID format'
        });
      }

      // Delete lead
      const result = await Lead.findByIdAndDelete(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Also delete any associated comments
      await LeadComment.deleteMany({ leadId: id });

      return res.status(200).json({
        success: true,
        message: 'Lead and associated comments deleted successfully'
      });
    } catch (error) {
      logger.error(`Delete lead error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the lead',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get comments for a lead
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public getLeadComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { leadId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Validate lead ID
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID format'
        });
      }

      // Check if lead exists
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Count total comments
      const total = await LeadComment.countDocuments({ leadId });

      // Get comments with pagination
      const comments = await LeadComment.find({ leadId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Lead comments retrieved successfully',
        data: {
          comments,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error(`Get lead comments error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving lead comments',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Add a comment to a lead
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public addLeadComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { leadId } = req.params;
      const { comment } = req.body;

      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.userId;

      // Validate lead ID
      if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid lead ID format'
        });
      }

      // Validate comment
      if (!comment || comment.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Comment text is required'
        });
      }

      // Check if lead exists
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Create new comment
      const newComment = await LeadComment.create({
        leadId,
        userId,
        comment: comment.trim()
      });

      // Populate user info
      await newComment.populate('userId', 'name email');

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: newComment
      });
    } catch (error) {
      logger.error(`Add lead comment error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while adding the comment',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Update a lead comment
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public updateLeadComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const { comment } = req.body;

      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID format'
        });
      }

      // Validate comment text
      if (!comment || comment.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Comment text is required'
        });
      }

      // Find the comment
      const existingComment = await LeadComment.findById(commentId);
      if (!existingComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the author
      if (existingComment.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this comment'
        });
      }

      // Update the comment
      const updatedComment = await LeadComment.findByIdAndUpdate(
        commentId,
        { comment: comment.trim() },
        { new: true }
      ).populate('userId', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedComment
      });
    } catch (error) {
      logger.error(`Update lead comment error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the comment',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Delete a lead comment
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public deleteLeadComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;

      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID format'
        });
      }

      // Find the comment
      const comment = await LeadComment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the author or an admin
      if (comment.userId.toString() !== userId.toString() &&
          (!req.user.role || req.user.role !== 'ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this comment'
        });
      }

      // Delete the comment
      await LeadComment.findByIdAndDelete(commentId);

      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      logger.error(`Delete lead comment error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the comment',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

export default new LeadController();
