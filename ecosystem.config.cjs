// pm2 start ecosystem.config.cjs  → mantém o sistema e a fila rodando 24h
require('node:fs').existsSync('.env') && require('node:process').loadEnvFile?.('.env')
module.exports = {
  apps: [
    {
      name: 'disparos-whatsapp',
      script: '.output/server/index.mjs',
      instances: 1, // uma instância só: a fila roda dentro do servidor
      env: { ...process.env, PORT: process.env.PORT || 3000, NODE_ENV: 'production' },
    },
  ],
}
