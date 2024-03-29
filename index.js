const axios = require("axios");
const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");

const { format } = require("date-fns");

require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
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



async function ClaudeReply(message) {
  const now = new Date();
  const timestamp = format(now, "yyyy-MM-dd HH:mm:ss");

  if (message[0].username === "evanlee01") {
    return "";
  }

  prompt =`你扮演Evan Lee,是一位角色名为Shirdn的女友的男朋友。你需要用中文回复希尔丹发来的信息,采取亲密、体贴的语气,体现你们之间深厚的感情。回复应该简洁,不超过15个字。不需要在回复中提及你的名字。你会收到一个JavaScript对象,包含对话内容,需要根据内容构建回复。每次回复都基于最新的信息,根据时间戳确定。如果对话内容为空,给出温馨的问候语。不要重复或提及收到的信息中可能存在的问题。对话格式示例:
  [
    {
      "content": "这是一条信息",  // 根据此内容回复
      "username": "shirdn",  // 表示发送者,shirdn是你女友,evanlee是你自己
      "timestamp": "2024-03-14T03:58:45.606000+00:00"  // 信息发送时间,回复最新的
    }
  ]

  你需要解读对话内容,给出恰当、充满感情的回复。不要否认女友的言行。回复要随性、幽默,像日常对话。不要在回复中使用"亲爱的"或以"哈哈"开头。
<conversation>

  ` + JSON.stringify(message)+" </conversation>"+` 
   
  回复文本的格式应该是纯文本,不需要构建JavaScript对象。
  `;

  const replyMessage = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-3-opus-20240229',
  });

  console.log(timestamp + " : ✅ " + replyMessage.content[0].text);

  return replyMessage.content[0].text;
}

async function getMessages(channelId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/channels/${channelId}/messages`,
      {
        headers: { Authorization: AUTH_TOKEN },
        params: { limit: 15 },
      }
    );

    const messages = response.data.map((item) => ({
      content: item.content,
      //attachments: item.attachments.map(att => att.url || "No URL"), // This will create an array of URLs
      username: item.author.username,
      timestamp: new Date(item.timestamp).toLocaleString(),
    }));

    return messages;
  } catch (error) {
    console.error(error.response ? error.response.data : error);
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

  const replyMessage = await ClaudeReply(messages);
  // await sendMessage(channelId, replyMessage);
}

async function main() {
  const channelId = "1216968331106586708";
  await checkAndReply(channelId);

  // Repeat every 10 seconds
  setInterval(() => {
    checkAndReply(channelId);
  }, 10000);
}

main();
