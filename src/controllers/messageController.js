const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Product = require('../models/Product');

// Create or get conversation
exports.createConversation = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;

    if (!productId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and sellerId.'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Don't allow seller to message themselves
    if (sellerId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself.'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, sellerId] },
      product: productId
    }).populate('participants', 'name mobile profilePicture')
      .populate('product', 'title price images')
      .populate('lastMessage');

    if (conversation) {
      return res.json({
        success: true,
        conversation
      });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [req.user._id, sellerId],
      product: productId
    });

    await conversation.save();
    
    await conversation.populate('participants', 'name mobile profilePicture');
    await conversation.populate('product', 'title price images');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully.',
      conversation
    });
  } catch (error) {
    console.error('Create Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating conversation.'
    });
  }
};

// Get all conversations for user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name mobile profilePicture')
      .populate('product', 'title price images status')
      .populate('lastMessage')
      .sort('-updatedAt');

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations.'
    });
  }
};

// Get single conversation
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name mobile email profilePicture')
      .populate('product', 'title price images status seller');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this conversation.'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation.'
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide conversationId and message content.'
      });
    }

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this conversation.'
      });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    await message.populate('sender', 'name profilePicture');

    // Emit socket event (to be handled by socket.io)
    if (req.io) {
      req.io.to(conversationId).emit('new-message', message);
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message.'
    });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these messages.'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'name profilePicture')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversation: conversationId })
    ]);

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages.'
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    // Get all user's conversations
    const conversations = await Conversation.find({
      participants: req.user._id
    });

    const conversationIds = conversations.map(c => c._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user._id },
      read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count.'
    });
  }
};
