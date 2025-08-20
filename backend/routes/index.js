const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const axios = require('axios');

// Health check route
router.get('/', (req, res) => {
  res.send('API is running');
});

// Get all chat messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Post a new chat message and get Cohere AI response
router.post('/messages', async (req, res) => {
  try {
    const { sender, text } = req.body;
    const message = new ChatMessage({ sender, text });
    await message.save();

    // Call Cohere AI API for bot reply
    let botReply = "Sorry, I couldn't get a response.";
    try {
      const cohereRes = await axios.post(
        'https://api.cohere.ai/v1/chat',
        { message: text },
        {
          headers: {
            'Authorization': 'Bearer xsgsbr4zbP4YiO81k20BFdc3xVkBhvqLroUQs1PL',
            'Content-Type': 'application/json'
          }
        }
      );
      botReply = cohereRes.data.text || botReply;
    } catch (err) {
      console.error('Cohere API error:', err.response?.data || err.message);
    }

    const botMessage = new ChatMessage({ sender: 'Bot', text: botReply });
    await botMessage.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: 'Failed to save message' });
  }
});

// Delete all chat messages
router.delete('/messages', async (req, res) => {
  try {
    await ChatMessage.deleteMany({});
    res.json({ message: 'All messages deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

module.exports = router;
