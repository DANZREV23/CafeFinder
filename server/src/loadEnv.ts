import dotenv from 'dotenv';

const cliNodeEnv = process.env.NODE_ENV;
dotenv.config({ override: true });

// Preserve explicitly passed NODE_ENV from CLI/cross-env
if (cliNodeEnv) {
  process.env.NODE_ENV = cliNodeEnv;
} else if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

console.log('[Env]: Environment variables loaded (PORT=' + process.env.PORT + ', NODE_ENV=' + process.env.NODE_ENV + ')');
