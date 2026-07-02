/** Every request carries a device id (anon fallback) and, once signed in, a user id.
 * Data is looked up by userId when present, else by deviceId. */
export interface AuthContext {
  userId?: string;
  deviceId: string;
}

export function partitionWhere(authCtx: AuthContext): { userId: string } | { deviceId: string } {
  return authCtx.userId ? { userId: authCtx.userId } : { deviceId: authCtx.deviceId };
}
