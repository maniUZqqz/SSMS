// Shared application state. Modules register their functions on `app`
// so they can call each other without circular imports at load time.

export const app = {
  conns: new Map(),   // connection id -> { id, spec, info, databases }
  tabs: [],
  active: null,
};
