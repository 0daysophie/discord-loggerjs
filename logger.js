const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions and get user input
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

// Format date and time
function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Function to log messages to file
function logToFile(logFilePath, logMessage) {
  fs.appendFileSync(logFilePath, logMessage + '\n');
  // Don't log every message to console to keep output clean
}

// Function to create log directory if it doesn't exist
function ensureLogDirectory() {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
    console.log('📁 Created logs directory');
  }
  return logDir;
}

// Function to handle DM/Group logging
async function setupDMGroupLogging(client, groupId, logDir) {
  try {
    const channel = await client.channels.fetch(groupId);
    if (!channel) {
      console.log('❌ Channel/Group not found!');
      return;
    }

    const logFileName = `${channel.name || 'DM'}_${groupId}.log`;
    const logFilePath = path.join(logDir, logFileName);

    console.log(`✅ Found channel/group: ${channel.name || 'DM'}`);
    console.log(`📝 Logging to file: ${logFilePath}`);

    // Log header
    const headerMessage = `\n========== LOGGING STARTED FOR ${channel.name || 'DM'} (${groupId}) AT ${getFormattedDateTime()} ==========\n`;
    logToFile(logFilePath, headerMessage);

    // Fetch and log existing messages
    console.log('📚 Fetching existing messages...');
    let lastMessageId = null;
    let loggedCount = 0;

    // Loop to fetch messages in batches
    while (true) {
      const options = { limit: 100 };
      if (lastMessageId) options.before = lastMessageId;

      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) break;

      // Sort messages by timestamp (oldest first)
      const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      for (const message of sortedMessages) {
        const timestamp = new Date(message.createdTimestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const logMessage = `[ LOG ${timestamp} ] [${channel.name || 'DM'} ${groupId}] - ${message.author.tag}: ${message.content} (MESSAGE ID: ${message.id}, USER ID: ${message.author.id})`;
        logToFile(logFilePath, logMessage);
        loggedCount++;

        // Log attachments if any
        if (message.attachments.size > 0) {
          message.attachments.forEach(attachment => {
            const attachmentLog = `    📎 Attachment: ${attachment.name} - ${attachment.url}`;
            logToFile(logFilePath, attachmentLog);
          });
        }
      }

      lastMessageId = messages.last().id;
      console.log(`📊 Logged ${loggedCount} messages so far...`);
    }

    console.log(`✅ Finished logging ${loggedCount} existing messages`);

    // Set up listener for new messages
    client.on('messageCreate', message => {
      if (message.channel.id === groupId) {
        const timestamp = getFormattedDateTime();
        const logMessage = `[ LOG ${timestamp} ] [${channel.name || 'DM'} ${groupId}] - ${message.author.tag}: ${message.content} (MESSAGE ID: ${message.id}, USER ID: ${message.author.id})`;
        logToFile(logFilePath, logMessage);

        // Log attachments if any
        if (message.attachments.size > 0) {
          message.attachments.forEach(attachment => {
            const attachmentLog = `    📎 Attachment: ${attachment.name} - ${attachment.url}`;
            logToFile(logFilePath, attachmentLog);
          });
        }
      }
    });

    console.log('🔄 Now logging all new messages in real-time');
  } catch (err) {
    console.error('❌ Error setting up logging:', err);
  }
}

// Function to handle Server logging
async function setupServerLogging(client, serverId, channelId, logDir) {
  try {
    const guild = await client.guilds.fetch(serverId);
    if (!guild) {
      console.log('❌ Server not found!');
      return;
    }

    const logFileName = `${guild.name}_${serverId}.log`;
    const logFilePath = path.join(logDir, logFileName);

    console.log(`✅ Found server: ${guild.name}`);
    console.log(`📝 Logging to file: ${logFilePath}`);

    // Log header
    const headerMessage = `\n========== LOGGING STARTED FOR SERVER ${guild.name} (${serverId}) AT ${getFormattedDateTime()} ==========\n`;
    logToFile(logFilePath, headerMessage);

    // Get channels to log
    let channels = [];
    if (channelId.toLowerCase() === 'every') {
      // Get all text channels
      channels = Array.from(guild.channels.cache.values())
        .filter(channel => channel.type === 'GUILD_TEXT' || channel.type === 0); // 0 is GUILD_TEXT in newer versions
      console.log(`📚 Logging all ${channels.length} channels in the server`);
    } else {
      // Get specific channel
      const channel = await guild.channels.fetch(channelId);
      if (!channel) {
        console.log('❌ Channel not found in server!');
        return;
      }
      channels = [channel];
      console.log(`📚 Logging channel: ${channel.name}`);
    }

    // Process each channel
    for (const channel of channels) {
      console.log(`📚 Fetching messages from #${channel.name}...`);

      // Log channel header
      const channelHeader = `\n----- CHANNEL: #${channel.name} (${channel.id}) -----\n`;
      logToFile(logFilePath, channelHeader);

      let lastMessageId = null;
      let loggedCount = 0;

      // Loop to fetch messages in batches
      try {
        while (true) {
          const options = { limit: 100 };
          if (lastMessageId) options.before = lastMessageId;

          const messages = await channel.messages.fetch(options);
          if (messages.size === 0) break;

          // Sort messages by timestamp (oldest first)
          const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

          for (const message of sortedMessages) {
            const timestamp = new Date(message.createdTimestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });

            const logMessage = `[ LOG ${timestamp} ] [${guild.name} ${serverId}]: [#${channel.name} ${channel.id}] - ${message.author.tag}: ${message.content} (MESSAGE ID: ${message.id}, USER ID: ${message.author.id})`;
            logToFile(logFilePath, logMessage);
            loggedCount++;

            // Log attachments if any
            if (message.attachments.size > 0) {
              message.attachments.forEach(attachment => {
                const attachmentLog = `    📎 Attachment: ${attachment.name} - ${attachment.url}`;
                logToFile(logFilePath, attachmentLog);
              });
            }
          }

          lastMessageId = messages.last().id;
          console.log(`📊 Logged ${loggedCount} messages from #${channel.name} so far...`);
        }
      } catch (err) {
        console.error(`❌ Error fetching messages from #${channel.name}:`, err.message);
        continue; // Continue with next channel
      }

      console.log(`✅ Finished logging ${loggedCount} existing messages from #${channel.name}`);
    }

    // Set up listener for new messages in the server
    client.on('messageCreate', message => {
      if (message.guild && message.guild.id === serverId) {
        // Check if we should log this channel
        if (channelId.toLowerCase() === 'every' || message.channel.id === channelId) {
          const timestamp = getFormattedDateTime();
          const logMessage = `[ LOG ${timestamp} ] [${guild.name} ${serverId}]: [#${message.channel.name} ${message.channel.id}] - ${message.author.tag}: ${message.content} (MESSAGE ID: ${message.id}, USER ID: ${message.author.id})`;
          logToFile(logFilePath, logMessage);

          // Log attachments if any
          if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
              const attachmentLog = `    📎 Attachment: ${attachment.name} - ${attachment.url}`;
              logToFile(logFilePath, attachmentLog);
            });
          }
        }
      }
    });

    console.log('🔄 Now logging all new messages in real-time');
  } catch (err) {
    console.error('❌ Error setting up server logging:', err);
  }
}

// Main function
async function main() {
  console.log('🔍 Discord Message Logger 📝');
  console.log('============================');

  try {
    // Ask for token
    const token = await askQuestion('Enter your Discord token: ');
    if (!token) {
      console.log('❌ Token is required!');
      rl.close();
      return;
    }

    // Create client
    const client = new Client();

    // Set up login event
    client.on('ready', async () => {
      console.log(`✅ Logged in as: ${client.user.tag}`);

      // Create logs directory
      const logDir = ensureLogDirectory();

      // Ask for group/DM ID
      const groupId = await askQuestion('Enter Group/DM ID (or type "none" to log a server instead): ');

      if (groupId.toLowerCase() === 'none') {
        // Server logging
        const serverId = await askQuestion('Enter Server ID: ');
        if (!serverId) {
          console.log('❌ Server ID is required!');
          rl.close();
          client.destroy();
          return;
        }

        const channelId = await askQuestion('Enter Channel ID (or type "every" to log all channels): ');
        if (!channelId) {
          console.log('❌ Channel ID is required!');
          rl.close();
          client.destroy();
          return;
        }

        await setupServerLogging(client, serverId, channelId, logDir);
      } else {
        // Group/DM logging
        await setupDMGroupLogging(client, groupId, logDir);
      }

      console.log('\n📋 Logger is now running! Press Ctrl+C to stop.');
    });

    // Login
    await client.login(token);
  } catch (err) {
    console.error('❌ Error:', err);
    rl.close();
  }
}

// Start the program
main();
