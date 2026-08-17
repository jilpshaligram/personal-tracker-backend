import { Request } from 'express';

/**
 * Extract client IP address from HTTP request
 *
 * Priority order:
 * 1. X-Forwarded-For header (leftmost IP if multiple)
 * 2. X-Real-IP header
 * 3. Socket remote address
 *
 * @param request - Express request object
 * @returns IP address string or 'unknown' if not found
 */
export function extractIpAddress(request: Request): string {
  // Check X-Forwarded-For header (used by proxies)
  const xForwardedFor = request.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    // Use the leftmost IP (client's original IP)
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative proxy header)
  const xRealIp = request.headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  // Fallback to socket remote address
  const socketAddress = request.socket?.remoteAddress;
  if (socketAddress) {
    // Remove IPv6 prefix if present
    return socketAddress.replace(/^::ffff:/, '');
  }

  return 'unknown';
}
