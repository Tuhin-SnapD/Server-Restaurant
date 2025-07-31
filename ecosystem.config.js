module.exports = {
  apps: [{
    name: 'restaurant-server',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 8000,
      HTTP_PORT: 80
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 443,
      HTTP_PORT: 80
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'sessions', 'backups'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}; 