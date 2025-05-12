import LinkedInAccount, { ILinkedInAccount } from '../models/linkedinAccount.model';
import Proxy, { IProxy } from '../models/proxy.model';

/**
 * Class to manage proxy rotation and selection
 */
export class ProxyManager {
  private static instance: ProxyManager;
  private cachedProxies: IProxy[] = [];
  private lastUpdated: Date = new Date(0); // Initialize with epoch time
  private cacheTTL: number = 60 * 1000; // 1 minute in milliseconds

  private constructor() { }

  /**
   * Get singleton instance of the ProxyManager
   */
  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  /**
   * Refresh the cached proxies if the cache is outdated
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - this.lastUpdated.getTime();

    if (timeSinceLastUpdate > this.cacheTTL || this.cachedProxies.length === 0) {
      this.cachedProxies = await Proxy.findAvailable();
      this.lastUpdated = now;
    }
  }

  /**
   * Reset the proxy cache to force a refresh on next access
   */
  public resetCache(): void {
    this.lastUpdated = new Date(0);
    this.cachedProxies = [];
  }

  /**
   * Get the next available proxy based on least used first
   */
  public async getNextProxy(): Promise<IProxy | null> {
    await this.refreshCacheIfNeeded();

    if (this.cachedProxies.length === 0) {
      return null;
    }

    // Get first proxy (least used)
    const proxy = this.cachedProxies[0];

    // Increment usage count in database
    await Proxy.incrementUsage(proxy._id);

    // Update cache
    this.cachedProxies = this.cachedProxies.slice(1);

    return proxy;
  }

  /**
   * Get a specific proxy by ID
   * @param proxyId - ID of the proxy to retrieve
   * @returns The requested proxy or null if not found
   */
  public async getProxyById(proxyId: string): Promise<IProxy | null> {
    return Proxy.findById(proxyId);
  }

  /**
   * Get all available proxies
   * @returns Array of all available proxies
   */
  public async getAllProxies(): Promise<IProxy[]> {
    await this.refreshCacheIfNeeded();
    return this.cachedProxies;
  }
}

/**
 * Class to manage LinkedIn account rotation and selection
 */
export class LinkedInAccountManager {
  private static instance: LinkedInAccountManager;
  private cachedAccounts: ILinkedInAccount[] = [];
  private lastUpdated: Date = new Date(0); // Initialize with epoch time
  private cacheTTL: number = 60 * 1000; // 1 minute in milliseconds

  private constructor() { }

  /**
   * Get singleton instance of the LinkedInAccountManager
   */
  public static getInstance(): LinkedInAccountManager {
    if (!LinkedInAccountManager.instance) {
      LinkedInAccountManager.instance = new LinkedInAccountManager();
    }
    return LinkedInAccountManager.instance;
  }

  /**
   * Refresh the cached accounts if the cache is outdated
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = new Date();
    const timeSinceLastUpdate = now.getTime() - this.lastUpdated.getTime();

    if (timeSinceLastUpdate > this.cacheTTL || this.cachedAccounts.length === 0) {
      this.cachedAccounts = await LinkedInAccount.findAvailable();
      this.lastUpdated = now;
    }
  }

  /**
   * Reset the account cache to force a refresh on next access
   */
  public resetCache(): void {
    this.lastUpdated = new Date(0);
    this.cachedAccounts = [];
  }

  /**
   * Get the next available LinkedIn account based on least used first
   */
  public async getNextAccount(): Promise<ILinkedInAccount | null> {
    await this.refreshCacheIfNeeded();

    if (this.cachedAccounts.length === 0) {
      return null;
    }

    // Get first account (least used)
    const account = this.cachedAccounts[0];

    // Increment usage count in database
    await LinkedInAccount.incrementUsage(account._id);

    // Update cache
    this.cachedAccounts = this.cachedAccounts.slice(1);

    return account;
  }

  /**
   * Get a specific LinkedIn account by ID
   * @param linkedinAccountId - ID of the account to retrieve
   * @returns The requested account or null if not found
   */
  public async getAccountById(linkedinAccountId: string): Promise<ILinkedInAccount | null> {
    return LinkedInAccount.findById(linkedinAccountId);
  }

  /**
   * Get all available LinkedIn accounts
   * @returns Array of all available accounts
   */
  public async getAllAccounts(): Promise<ILinkedInAccount[]> {
    await this.refreshCacheIfNeeded();
    return this.cachedAccounts;
  }
}
