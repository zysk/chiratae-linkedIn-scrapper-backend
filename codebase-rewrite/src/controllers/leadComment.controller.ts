import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import LeadComment from '../models/LeadComment.model';
import Lead from '../models/Lead.model'; // To verify lead ownership
import { badRequest, notFound, serverError, forbidden } from '../helpers/ErrorHandler';
import { successResponse, dataResponse, paginatedResponse } from '../interfaces/ApiResponse';
import { ErrorMessages, SuccessMessages } from '../helpers/Constants';

// Helper to check if user can access the lead (via campaign ownership)
const canAccessLead = async (userId: string, leadId: string): Promise<boolean> => {
    const lead = await Lead.findById(leadId).populate('campaignId', 'createdBy');
    if (!lead || !lead.campaignId) return false;
    return (lead.campaignId as any).createdBy?.toString() === userId;
};

/**
 * Add a comment to a lead.
 */
export const addLeadComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { leadId, comment } = req.body;
    const userId = req.user?.id;

    if (!leadId || !comment || !userId) {
        return next(badRequest('Lead ID, comment, and user ID are required'));
    }
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
        return next(badRequest('Invalid Lead ID format'));
    }

    try {
        // Check if user can access this lead
        if (!await canAccessLead(userId, leadId)) {
             return next(notFound(ErrorMessages.LEAD_NOT_FOUND)); // Treat as not found
        }

        const newComment = new LeadComment({
            leadId,
            comment,
            userId, // Logged-in user adding the comment
            createdBy: userId
        });

        await newComment.save();
        // Populate user details for the response
        await newComment.populate('userId', 'firstName lastName email');

        res.status(201).json(dataResponse(SuccessMessages.COMMENT_ADDED, newComment));

        // TODO: Optionally create a LeadLog entry for comment added?

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return next(badRequest(error.message));
        }
        next(serverError(error.message));
    }
};

/**
 * Get comments for a specific lead (paginated).
 */
export const getLeadComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { leadId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

     if (!leadId || !userId || !mongoose.Types.ObjectId.isValid(leadId)) {
        return next(badRequest('Valid Lead ID is required'));
    }

    try {
         // Check if user can access this lead
        if (!await canAccessLead(userId, leadId)) {
             return next(notFound(ErrorMessages.LEAD_NOT_FOUND));
        }

        const query = { leadId: leadId };
        const comments = await LeadComment.find(query)
            .sort({ createdAt: -1 }) // Show newest first
            .skip(skip)
            .limit(limit)
            .populate('userId', 'firstName lastName email'); // Show who commented

        const total = await LeadComment.countDocuments(query);

        res.status(200).json(paginatedResponse('Comments retrieved', comments, {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        }));

    } catch (error: any) {
         next(serverError(error.message));
    }
};

/**
 * Get a single comment by its ID.
 */
export const getCommentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id || !userId || !mongoose.Types.ObjectId.isValid(id)) {
        return next(badRequest('Valid Comment ID is required'));
    }

    try {
        const comment = await LeadComment.findById(id).populate('userId', 'firstName lastName email');
        if (!comment) {
             return next(notFound(ErrorMessages.COMMENT_NOT_FOUND));
        }

         // Check if user can access the lead this comment belongs to
        if (!await canAccessLead(userId, comment.leadId.toString())) {
             return next(notFound(ErrorMessages.COMMENT_NOT_FOUND)); // Treat as not found
        }

        res.status(200).json(dataResponse('Comment found', comment));
    } catch (error: any) {
         next(serverError(error.message));
    }
};

/**
 * Update a comment.
 */
export const updateLeadComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
     const { id } = req.params;
     const { comment: newCommentText } = req.body;
     const userId = req.user?.id;

    if (!id || !newCommentText || !userId || !mongoose.Types.ObjectId.isValid(id)) {
        return next(badRequest('Valid Comment ID and new comment text are required'));
    }

    try {
         const comment = await LeadComment.findById(id);
         if (!comment) {
            return next(notFound(ErrorMessages.COMMENT_NOT_FOUND));
         }

         // Authorization: Only the user who created the comment can update it
         if (comment.userId?.toString() !== userId) {
              return next(forbidden('You are not authorized to update this comment'));
         }

         // Optional: Check lead access again for safety
         if (!await canAccessLead(userId, comment.leadId.toString())) {
             return next(notFound(ErrorMessages.COMMENT_NOT_FOUND));
        }

         comment.comment = newCommentText;
         comment.updatedBy = new mongoose.Types.ObjectId(userId);
         await comment.save();

         await comment.populate('userId', 'firstName lastName email');
         res.status(200).json(dataResponse(SuccessMessages.COMMENT_UPDATED, comment));

    } catch (error: any) {
         if (error.name === 'ValidationError') {
            return next(badRequest(error.message));
        }
        next(serverError(error.message));
    }
};

/**
 * Delete a comment.
 */
export const deleteLeadComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params;
      const userId = req.user?.id;

    if (!id || !userId || !mongoose.Types.ObjectId.isValid(id)) {
        return next(badRequest('Valid Comment ID is required'));
    }

     try {
         const comment = await LeadComment.findById(id);
         if (!comment) {
            return next(notFound(ErrorMessages.COMMENT_NOT_FOUND));
         }

         // Authorization: Only the user who created the comment OR an admin can delete?
         // For now, restrict to creator only
         if (comment.userId?.toString() !== userId) {
              return next(forbidden('You are not authorized to delete this comment'));
         }

         // Optional: Check lead access again
          if (!await canAccessLead(userId, comment.leadId.toString())) {
             return next(notFound(ErrorMessages.COMMENT_NOT_FOUND));
        }

        await LeadComment.findByIdAndRemove(id);
        res.status(200).json(successResponse(SuccessMessages.COMMENT_DELETED));

     } catch (error: any) {
        next(serverError(error.message));
    }
};