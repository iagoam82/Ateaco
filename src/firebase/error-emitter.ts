import { EventEmitter } from 'events';

// Since we are in a server/client component environment,
// we need to ensure that the event emitter is a singleton.
// We can do this by attaching it to the global object.

declare global {
  var errorEmitter: EventEmitter;
}

const errorEmitter = globalThis.errorEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.errorEmitter = errorEmitter;
}

export { errorEmitter };
