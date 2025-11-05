module.exports = {
  apps: [{
    name: 'vyomkesh',
    script: 'dist/server/node-build.mjs',
    cwd: '/www/wwwroot/vyomkeshgroup.com',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      HOST: '127.0.0.1'
      // NOTE: MONGODB_URI & JWT_SECRET .env se aa jayenge (dotenv/config)
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
}
