// opentype.js ships no bundled types and we only use it dynamically (parse +
// getPath) at export time, so a loose ambient declaration is sufficient.
declare module 'opentype.js';
