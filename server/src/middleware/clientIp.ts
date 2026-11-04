import { config } from '../config';
import type { AppSocket } from "../gateway/types"


export function getClientIp(socket: AppSocket): string  {
  // thsi is the nginx ip who connect directly to node 
  const directPeerIp = socket.handshake.address;
  const trustedProxyCount = config.TRUST_PROXY;
  if (trustedProxyCount === 0) return directPeerIp;

  // Cloudflare adds X-Forwarded-For 
  const header = socket.handshake.headers['x-forwarded-for'];
  const forwardedHeaderText = Array.isArray(header)
    ? header.join(',')
    : (header ?? '');

  const forwardedIps = forwardedHeaderText
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  // Full path from user to Node: header IPs + the direct connection at the end
  const chain = [...forwardedIps, directPeerIp];
  // Skip our own proxies from the end; the IP right before them is the real user
  const userPosition = chain.length - 1 - trustedProxyCount;
  if (userPosition < 0) return directPeerIp;
  return chain[userPosition] ?? directPeerIp;
}