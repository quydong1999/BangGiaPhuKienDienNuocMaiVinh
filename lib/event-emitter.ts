import { EventEmitter } from 'events';

/**
 * Global EventEmitter Singleton
 * Dùng để bridge giữa Webhook handler và SSE stream.
 * Lưu trên `global` để duy trì qua các lần Hot Reload trong Next.js Dev mode.
 */

const globalForEmitter = global as typeof global & {
  transactionEmitter?: EventEmitter;
};

if (!globalForEmitter.transactionEmitter) {
  globalForEmitter.transactionEmitter = new EventEmitter();
  globalForEmitter.transactionEmitter.setMaxListeners(50);
}

export const transactionEmitter = globalForEmitter.transactionEmitter;

// Event names
export const TRANSACTION_EVENTS = {
  NEW_TRANSACTION: 'new-transaction',
} as const;
