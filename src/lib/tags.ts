// Cache tags shared by cached readers and the actions that invalidate them.
export const cartTag = (userId: string) => `cart:${userId}`;
export const ordersTag = (userId: string) => `orders:${userId}`;
export const ADMIN_TAG = "admin";
export const SETTINGS_TAG = "settings";
