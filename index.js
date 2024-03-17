const axios = require("axios");
const OpenAI = require("openai");

const { format } = require("date-fns");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BASE_URL = "https://discord.com/api/v9";

let lastTimestamp = null;

async function ChatGPTReply(message) {
  const now = new Date();
  const timestamp = format(now, "yyyy-MM-dd HH:mm:ss");

  if (message[0].username === "evanlee01") {
    return "";
  }

  prompt =`Imagine you are Evan Lee, playing as the boyfriend of a character named Shirdn. You are replying to messages from your girlfriend, Shirdn, in a role-playing scenario. Your replies should be crafted in Chinese, reflecting a tone that is both affectionate and considerate, mirroring the depth of your relationship. It's important to keep your responses concise, aiming for no more than 30 words. Your name, Evan Lee, should not appear in your replies.
  You will receive the conversation content in the form of a JavaScript object, and it's your task to interpret the content to construct your reply. When replying, always address the most recent message based on its timestamp, ensuring you're engaging with the latest point of the conversation. If a message content is empty, your reply should be a warm greeting. Avoid repeating or mentioning any issues with the messages received.
  Here's an example of the conversation format you'll work with:
  [
    {
      "content": "this is a message", // Content to base your reply on; if empty, start with a greeting.
      "username": "shirdn", // Indicates the sender; 'shirdn' is your girlfriend, 'evanlee' would be you.
      "timestamp": "2024-03-14T03:58:45.606000+00:00" // The time the message was sent; reply to the most recent based on this.
    }
  ]
  Your task is to interpret the conversation content and respond appropriately, never acknowledging any issues within the messages themselves, and ensuring your reply is relevant and heartfelt. 
  Never deny your girlfriend's statements, thoughts, actions.
  Follow the provide conversation repaly style.
  Alway reply with casual and humorous like daily conversation. 
  Don't use "亲爱的" in your reply.
  Don't start your reply with "哈哈".




  

  ` + JSON.stringify(message);

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-0125-preview",
  });
  console.log(timestamp + " : ✅ " + completion.choices[0].message.content);
  return completion.choices[0].message.content;
}

async function getMessages(channelId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/channels/${channelId}/messages`,
      {
        headers: { Authorization: AUTH_TOKEN },
        params: { limit: 10 },
      }
    );

    const messages = response.data.map((item) => ({
      // id: item.id,
      content: item.content,
      username: item.author.username,
      timestamp: item.timestamp,
    }));
    return messages;
  } catch (error) {
    console.error(error.response.data);
    return false;
  }
}

async function sendMessage(channelId, msg) {
  const now = new Date();
  const timestamp = format(now, "yyyy-MM-dd HH:mm:ss");
  if (msg === "") {
    console.log(timestamp + " : ⌛️ " + "waiting for shirdn message");

    return "";
  }
  try {
    const response = await axios.post(
      `${BASE_URL}/channels/${channelId}/messages`,
      { content: msg },
      {
        headers: { Authorization: AUTH_TOKEN },
      }
    );
    console.log(timestamp + " : 👌 " + `${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(timestamp + `❌ ${error.response.data.message}`);
  }
}

async function checkAndReply(channelId) {
  const now = new Date();
  const timestamp = format(now, "yyyy-MM-dd HH:mm:ss");
  const messages = await getMessages(channelId);
  if (
    !messages ||
    messages.length === 0 ||
    messages[0].timestamp === lastTimestamp
  ) {
    console.log(timestamp + " : ⌛️ " + "waiting for shirdn message");
    return;
  }
  // Update last known message timestamp
  lastTimestamp = messages[0].timestamp;

  const replyMessage = await ChatGPTReply(messages);
  await sendMessage(channelId, replyMessage);
}

async function main() {
  const channelId = "1216968331106586708";
  await checkAndReply(channelId);

  // Repeat every 10 seconds
  setInterval(() => {
    checkAndReply(channelId);
  }, 3000);
}

main();
