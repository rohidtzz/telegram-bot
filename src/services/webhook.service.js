const logger = require("../utils/logger");
const telegramRepository = require("../repositories/telegram.repository");
const s3Repository = require("../repositories/s3.repository");
const { S3_BUCKET } = require("../config");

/**
 * Download file from Telegram and save to S3
 * @param {object} file - Telegram file object
 * @param {string} fileName - File name
 * @returns {Promise<object>}
 */
async function downloadAndSaveMedia(file, fileName) {
  try {
    if (!file || !file.file_id) {
      throw new Error("Invalid file object");
    }

    // Get file from Telegram
    const fileBuffer = await telegramRepository.downloadFile(file.file_id);

    // Generate object name
    const timestamp = Date.now();
    const objectName = `${timestamp}-${fileName}`;

    // Upload to S3
    const result = await s3Repository.uploadFile(
      S3_BUCKET,
      objectName,
      fileBuffer,
      file.mime_type || "application/octet-stream"
    );

    logger.info(`Media saved: ${objectName}`);
    return result;
  } catch (error) {
    logger.error(`Failed to download and save media: ${error.message}`);
    throw error;
  }
}

/**
 * Process Telegram update
 * @param {object} update - Telegram update object
 * @returns {Promise<object>}
 */
async function processUpdate(update) {
  try {
    const message = update.message || update.channel_post;

    if (!message) {
      return { status: "no_message" };
    }

    const result = {
      update_id: update.update_id,
      chat_id: message.chat.id,
      from_id: message.from?.id,
      type: null,
      data: null
    };

    // Handle different message types
    if (message.text) {
      result.type = "text";
      result.data = {
        text: message.text,
        entities: message.entities || []
      };
      logger.info(`Text message received: ${message.text.substring(0, 50)}`);
    } else if (message.photo) {
      result.type = "photo";
      const photo = message.photo[message.photo.length - 1]; // Get highest quality
      const savedFile = await downloadAndSaveMedia(photo, `photo-${Date.now()}.jpg`);
      result.data = {
        caption: message.caption,
        file_size: photo.file_size,
        s3: savedFile
      };
      logger.info(`Photo received and saved: ${savedFile.object}`);
    } else if (message.document) {
      result.type = "document";
      const doc = message.document;
      const savedFile = await downloadAndSaveMedia(doc, doc.file_name || `document-${Date.now()}`);
      result.data = {
        file_name: doc.file_name,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        s3: savedFile
      };
      logger.info(`Document received and saved: ${savedFile.object}`);
    } else if (message.video) {
      result.type = "video";
      const video = message.video;
      const savedFile = await downloadAndSaveMedia(video, `video-${Date.now()}.mp4`);
      result.data = {
        duration: video.duration,
        file_size: video.file_size,
        mime_type: video.mime_type,
        s3: savedFile
      };
      logger.info(`Video received and saved: ${savedFile.object}`);
    } else if (message.audio) {
      result.type = "audio";
      const audio = message.audio;
      const savedFile = await downloadAndSaveMedia(audio, `audio-${Date.now()}.mp3`);
      result.data = {
        duration: audio.duration,
        file_size: audio.file_size,
        mime_type: audio.mime_type,
        s3: savedFile
      };
      logger.info(`Audio received and saved: ${savedFile.object}`);
    } else if (message.voice) {
      result.type = "voice";
      const voice = message.voice;
      const savedFile = await downloadAndSaveMedia(voice, `voice-${Date.now()}.ogg`);
      result.data = {
        duration: voice.duration,
        file_size: voice.file_size,
        mime_type: voice.mime_type,
        s3: savedFile
      };
      logger.info(`Voice message received and saved: ${savedFile.object}`);
    } else {
      result.type = "unsupported";
      result.data = {
        message: "Unsupported message type"
      };
      logger.info("Unsupported message type received");
    }

    return result;
  } catch (error) {
    logger.error(`Failed to process update: ${error.message}`);
    throw error;
  }
}

module.exports = {
  downloadAndSaveMedia,
  processUpdate
};
