import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../middleware/errorHandler';
import Proxy from '../models/proxy.model';
import { ProxyManager } from '../utils/proxy.utils';

/**
 * Create a new proxy
 * @route POST /api/proxies
 * @access Private/Admin
 */
export const createProxy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { host, port, username, password, protocol, description } = req.body;

    // Validate required fields
    if (!host || !port) {
      throw new ApiError('Host and port are required', 400);
    }

    // Check if port is valid
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new ApiError('Port must be a number between 1 and 65535', 400);
    }

    // Check if protocol is valid
    const validProtocols = ['http', 'https', 'socks4', 'socks5'];
    if (protocol && !validProtocols.includes(protocol)) {
      throw new ApiError(`Protocol must be one of: ${validProtocols.join(', ')}`, 400);
    }

    // Check if both username and password are provided together
    if ((username && !password) || (!username && password)) {
      throw new ApiError('Both username and password must be provided together for authentication', 400);
    }

    // Check if proxy already exists
    const existingProxy = await Proxy.findOne({
      host,
      port: portNum,
      protocol: protocol || 'http',
    });

    if (existingProxy) {
      throw new ApiError('Proxy with this host, port, and protocol already exists', 400);
    }

    // Create new proxy
    const newProxy = new Proxy({
      host,
      port: portNum,
      username,
      protocol: protocol || 'http',
      description,
      createdBy: req.user!.userId,
    });

    // Set password securely if provided
    if (password) {
      newProxy.setPassword(password);
    }

    // Save to database
    await newProxy.save();

    // Reset manager cache to include the new proxy
    ProxyManager.getInstance().resetCache();

    res.status(201).json({
      success: true,
      message: 'Proxy created successfully',
      data: {
        id: newProxy._id,
        host: newProxy.host,
        port: newProxy.port,
        username: newProxy.username,
        protocol: newProxy.protocol,
        description: newProxy.description,
        createdAt: newProxy.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all proxies
 * @route GET /api/proxies
 * @access Private/Admin
 */
export const getProxies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Proxy.countDocuments();

    // Get proxies with pagination
    const proxies = await Proxy.find()
      .select('-encryptedPassword')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Proxies retrieved successfully',
      data: proxies,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a proxy by ID
 * @route GET /api/proxies/:id
 * @access Private/Admin
 */
export const getProxyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proxyId = req.params.id;

    const proxy = await Proxy.findById(proxyId)
      .select('-encryptedPassword')
      .populate('createdBy', 'name email');

    if (!proxy) {
      throw new ApiError('Proxy not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Proxy retrieved successfully',
      data: proxy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a proxy
 * @route PUT /api/proxies/:id
 * @access Private/Admin
 */
export const updateProxy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proxyId = req.params.id;
    const { host, port, username, password, protocol, description, isActive } = req.body;

    // Find proxy
    const proxy = await Proxy.findById(proxyId);

    if (!proxy) {
      throw new ApiError('Proxy not found', 404);
    }

    // Update fields if provided
    if (host) proxy.host = host;
    if (port) {
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        throw new ApiError('Port must be a number between 1 and 65535', 400);
      }
      proxy.port = portNum;
    }

    // Update protocol if provided
    if (protocol) {
      const validProtocols = ['http', 'https', 'socks4', 'socks5'];
      if (!validProtocols.includes(protocol)) {
        throw new ApiError(`Protocol must be one of: ${validProtocols.join(', ')}`, 400);
      }
      proxy.protocol = protocol;
    }

    // Update username/password if provided
    const updatingUsername = username !== undefined;
    const updatingPassword = password !== undefined;

    // Ensure username and password are set/unset together
    if (
      (updatingUsername && !updatingPassword && !proxy.encryptedPassword) ||
      (updatingPassword && !updatingUsername && !proxy.username)
    ) {
      throw new ApiError('Both username and password must be provided together for authentication', 400);
    }

    if (updatingUsername) proxy.username = username;
    if (updatingPassword && password) proxy.setPassword(password);

    // If username is being removed, also remove password
    if (updatingUsername && !username) {
      proxy.encryptedPassword = undefined;
    }

    if (description !== undefined) proxy.description = description;
    if (isActive !== undefined) proxy.isActive = isActive;

    // Save changes
    await proxy.save();

    // Reset manager cache to reflect changes
    ProxyManager.getInstance().resetCache();

    res.status(200).json({
      success: true,
      message: 'Proxy updated successfully',
      data: {
        id: proxy._id,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        protocol: proxy.protocol,
        description: proxy.description,
        isActive: proxy.isActive,
        updatedAt: proxy.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a proxy
 * @route DELETE /api/proxies/:id
 * @access Private/Admin
 */
export const deleteProxy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proxyId = req.params.id;

    const proxy = await Proxy.findByIdAndDelete(proxyId);

    if (!proxy) {
      throw new ApiError('Proxy not found', 404);
    }

    // Reset manager cache to reflect changes
    ProxyManager.getInstance().resetCache();

    res.status(200).json({
      success: true,
      message: 'Proxy deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get next available proxy (for internal use)
 * @route GET /api/proxies/next
 * @access Private/Admin
 */
export const getNextAvailableProxy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const proxy = await ProxyManager.getInstance().getNextProxy();

    if (!proxy) {
      throw new ApiError('No active proxies available', 404);
    }

    // Return proxy string
    const proxyString = proxy.getProxyString();

    res.status(200).json({
      success: true,
      message: 'Next available proxy retrieved',
      data: {
        id: proxy._id,
        host: proxy.host,
        port: proxy.port,
        proxyString: proxyString,
        protocol: proxy.protocol,
      },
    });
  } catch (error) {
    next(error);
  }
};
