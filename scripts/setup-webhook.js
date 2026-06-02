#!/usr/bin/env node

require("dotenv").config();
const axios = require("axios");
const { BOT_TOKEN, WEBHOOK_URL } = require("../src/config");

async function setupWebhook() {
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN not configured in .env");
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error("❌ WEBHOOK_URL not configured in .env");
    process.exit(1);
  }

  try {
    console.log("🔄 Setting up Telegram webhook...");
    console.log(`   Webhook URL: ${WEBHOOK_URL}`);

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        url: WEBHOOK_URL,
        allowed_updates: ["message", "channel_post"]
      }
    );

    if (response.data.ok) {
      console.log("✅ Webhook setup successful!");
      console.log(`\n📋 Webhook Info:`);
      console.log(`   URL: ${response.data.result.url}`);
      console.log(`   Has Custom Certificate: ${response.data.result.has_custom_certificate}`);
      console.log(`   Pending Update Count: ${response.data.result.pending_update_count}`);
    } else {
      console.error("❌ Failed to setup webhook:");
      console.error(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error setting up webhook:");
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

async function getWebhookStatus() {
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN not configured in .env");
    process.exit(1);
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );

    if (response.data.ok) {
      const info = response.data.result;
      console.log("📊 Current Webhook Status:");
      console.log(`   URL: ${info.url || "Not set"}`);
      console.log(`   Has Custom Certificate: ${info.has_custom_certificate}`);
      console.log(`   Pending Update Count: ${info.pending_update_count}`);
      console.log(`   IP Address: ${info.ip_address}`);
      console.log(`   Last Error Date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : "None"}`);
      console.log(`   Last Error Message: ${info.last_error_message || "None"}`);
    } else {
      console.error("❌ Failed to get webhook info:");
      console.error(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error getting webhook status:");
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

async function deleteWebhook() {
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN not configured in .env");
    process.exit(1);
  }

  try {
    console.log("🔄 Deleting webhook...");

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
    );

    if (response.data.ok) {
      console.log("✅ Webhook deleted successfully!");
    } else {
      console.error("❌ Failed to delete webhook:");
      console.error(response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error deleting webhook:");
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case "setup":
    setupWebhook();
    break;
  case "status":
    getWebhookStatus();
    break;
  case "delete":
    deleteWebhook();
    break;
  default:
    console.log("Telegram Webhook Manager");
    console.log("\nUsage:");
    console.log("  npm run webhook:setup     - Setup webhook");
    console.log("  npm run webhook:status    - Check webhook status");
    console.log("  npm run webhook:delete    - Delete webhook (fallback to polling)");
    console.log("\nExample:");
    console.log("  WEBHOOK_URL=https://yourdomain.com/webhooks/telegram npm run webhook:setup");
    process.exit(0);
}
