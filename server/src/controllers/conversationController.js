const Conversation = require('../models/Conversation');
const Client = require('../models/Client');
const { AppError } = require('../middleware/errorHandler');

// ─── Get or create conversation for a client ───────────────────────────────────
const getConversation = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // Verify client belongs to user
    const client = await Client.findOne({
      _id: clientId,
      userId: req.user._id,
    });
    if (!client) {
      return next(new AppError('Client not found', 404));
    }

    let conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id,
        clientId,
        messages: [],
      });
    }

    res.json({
      success: true,
      conversation,
      client: {
        _id: client._id,
        businessName: client.businessName,
        contactName: client.contactName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add a single message (manual copy-paste) ─────────────────────────────────
const addMessage = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { sender, content, messageType, mediaUrl, mediaName, cloudinaryId, messageDate } = req.body;

    if (!sender || (!content && !mediaUrl)) {
      return next(new AppError('Sender and content (or media) are required', 400));
    }

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const newMessage = {
      sender,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
      mediaName,
      cloudinaryId,
      messageDate: messageDate || new Date(),
    };

    conversation.messages.push(newMessage);
    await conversation.save();

    // Return the newly created message
    const addedMessage = conversation.messages[conversation.messages.length - 1];

    res.status(201).json({
      success: true,
      message: addedMessage,
      messageCount: conversation.messageCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Insert a message at a specific position ──────────────────────────────────
const insertMessage = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { sender, content, messageType, mediaUrl, mediaName, cloudinaryId, messageDate, afterMessageId } = req.body;

    if (!sender || (!content && !mediaUrl)) {
      return next(new AppError('Sender and content (or media) are required', 400));
    }

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const newMessage = {
      sender,
      content: content || '',
      messageType: messageType || 'text',
      mediaUrl,
      mediaName,
      cloudinaryId,
      messageDate: messageDate || new Date(),
    };

    if (afterMessageId) {
      const idx = conversation.messages.findIndex(
        (m) => m._id.toString() === afterMessageId
      );
      if (idx === -1) {
        return next(new AppError('Reference message not found', 404));
      }
      conversation.messages.splice(idx + 1, 0, newMessage);
    } else {
      // Insert at beginning
      conversation.messages.unshift(newMessage);
    }

    await conversation.save();

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Edit a message ────────────────────────────────────────────────────────────
const editMessage = async (req, res, next) => {
  try {
    const { clientId, messageId } = req.params;
    const { content, messageType, mediaUrl, mediaName, cloudinaryId, sender, messageDate } = req.body;

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return next(new AppError('Message not found', 404));
    }

    if (content !== undefined) message.content = content;
    if (messageType !== undefined) message.messageType = messageType;
    if (mediaUrl !== undefined) message.mediaUrl = mediaUrl;
    if (mediaName !== undefined) message.mediaName = mediaName;
    if (cloudinaryId !== undefined) message.cloudinaryId = cloudinaryId;
    if (sender !== undefined) message.sender = sender;
    if (messageDate !== undefined) message.messageDate = messageDate;
    message.isEdited = true;
    message.editedAt = new Date();

    await conversation.save();

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete a message ──────────────────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { clientId, messageId } = req.params;

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const msgIndex = conversation.messages.findIndex(
      (m) => m._id.toString() === messageId
    );

    if (msgIndex === -1) {
      return next(new AppError('Message not found', 404));
    }

    conversation.messages.splice(msgIndex, 1);
    await conversation.save();

    res.json({
      success: true,
      messageCount: conversation.messageCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Bulk upload messages (JSON) ───────────────────────────────────────────────
const bulkUploadMessages = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return next(new AppError('Messages array is required and must not be empty', 400));
    }

    // Validate each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.sender || !['me', 'them'].includes(msg.sender)) {
        return next(
          new AppError(
            `Message at index ${i}: sender must be 'me' or 'them'`,
            400
          )
        );
      }
      if (!msg.content && !msg.mediaUrl) {
        return next(
          new AppError(
            `Message at index ${i}: content or mediaUrl is required`,
            400
          )
        );
      }
    }

    let conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      // Verify client
      const client = await Client.findOne({
        _id: clientId,
        userId: req.user._id,
      });
      if (!client) {
        return next(new AppError('Client not found', 404));
      }
      conversation = new Conversation({
        userId: req.user._id,
        clientId,
        messages: [],
      });
    }

    // Map and add messages
    const newMessages = messages.map((msg) => ({
      sender: msg.sender,
      content: msg.content || '',
      messageType: msg.messageType || 'text',
      mediaUrl: msg.mediaUrl || undefined,
      mediaName: msg.mediaName || undefined,
      cloudinaryId: msg.cloudinaryId || undefined,
      messageDate: msg.messageDate || msg.date || msg.timestamp || new Date(),
      reaction: msg.reaction || undefined,
    }));

    conversation.messages.push(...newMessages);

    // Sort messages by date
    conversation.messages.sort(
      (a, b) => new Date(a.messageDate) - new Date(b.messageDate)
    );

    await conversation.save();

    res.status(201).json({
      success: true,
      imported: newMessages.length,
      totalMessages: conversation.messageCount,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Clear all messages ────────────────────────────────────────────────────────
const clearConversation = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    conversation.messages = [];
    conversation.aiInsights = {};
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation cleared',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversation,
  addMessage,
  insertMessage,
  editMessage,
  deleteMessage,
  bulkUploadMessages,
  clearConversation,
};
