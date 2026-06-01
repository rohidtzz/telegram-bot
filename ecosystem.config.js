module.exports = {
  apps: [
    {
      name: "telegram-bot-monitoring",
      script: "./src/server.js",
      instances: "1",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      output: "/dev/null",
      error: "/dev/null",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
