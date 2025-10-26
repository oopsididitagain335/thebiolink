// src/lib/startBot.ts
// This module safely initializes your Discord bot alongside Next.js.
// It runs ONLY on the server and never in the browser.

// Prevent accidental bundling or execution in browser environments
if (typeof window !== 'undefined') {
  throw new Error('Discord bot must only run on the server.');
}

// Import your existing bot logic from bot/index.js
// Adjust the path if your `bot/` folder is not at the project root.
import '../../bot/index.js';

// Export nothing to avoid module side-effects in bundling
export {};
