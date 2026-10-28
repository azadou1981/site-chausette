import { loadEnv } from './config/env.js';
import { createApp } from './app.js';

const env = loadEnv();
createApp(env).listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
