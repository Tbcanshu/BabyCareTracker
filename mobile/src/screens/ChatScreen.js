import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { getBabyProfile } from '../storage';
import { chatApi } from '../utils/api';

const STORAGE_KEY = 'baby_care_chat_history';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome_msg',
  sender: 'bot',
  text: "Hello! I am your Baby Care AI Assistant. 🍼👶\n\nI am here to help answer any questions you might have about your baby's development, sleeping, feeding, crying, or other general care.\n\nTry asking me a question or tap one of the quick topics below! \n\n*Disclaimer: I am an AI, not a doctor. For any medical emergency, please consult a pediatrician immediately.*",
  createdAt: new Date().toISOString(),
};

const QUICK_TOPICS = [
  { label: '🌡️ Fever Guide', query: 'What should I do if my baby has a fever?' },
  { label: '🍼 Feeding', query: 'What are the feeding guidelines for my baby?' },
  { label: '💤 Sleep Safe', query: 'How can I ensure safe sleep for my baby?' },
  { label: '😭 Colic & Crying', query: 'How do I soothe a crying or colicky baby?' },
  { label: '💩 Poop Check', query: 'What color baby poop is concerning?' },
];

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [baby, setBaby] = useState(null);
  
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Load baby profile and chat history on mount
  useEffect(() => {
    const initScreen = async () => {
      // Load baby profile
      const profile = await getBabyProfile();
      if (profile) {
        setBaby(profile);
      }

      // Load chat history
      try {
        const rawHistory = await AsyncStorage.getItem(STORAGE_KEY);
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    };

    initScreen();

    // Auto-scroll when keyboard pops up
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => {
      showSubscription.remove();
    };
  }, []);

  // Save chat history whenever messages change
  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const resetMessages = [DEFAULT_WELCOME_MESSAGE];
            setMessages(resetMessages);
            await saveChatHistory(resetMessages);
          },
        },
      ]
    );
  };

  const sendMessage = async (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    setInputText('');
    
    const userMsg = {
      id: `${Date.now()}_user`,
      sender: 'user',
      text: query,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveChatHistory(updatedMessages);
    setLoading(true);

    // Prepare previous history in required format
    // Exclude the welcome message to keep prompt cleaner and focus on history
    const apiHistory = updatedMessages
      .filter(m => m.id !== 'welcome_msg')
      .slice(-6, -1) // Last 5 messages before the current query
      .map(m => ({
        sender: m.sender,
        text: m.text,
      }));

    try {
      const response = await chatApi.sendMessage(query, apiHistory, baby);
      
      const botMsg = {
        id: `${Date.now()}_bot`,
        sender: 'bot',
        text: response.reply,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } catch (error) {
      let errorText = `⚠️ **Connection Error**\n\nI couldn't reach the Baby Care API. Please check your internet connection and ensure your backend server is running.\n\n*Error details: ${error.message}*`;
      
      if (error.message && (error.message.includes('Too Many Questions') || error.message.includes('Too many requests') || error.message.includes('Rate Limit'))) {
        errorText = error.message;
      }

      const errorMsg = {
        id: `${Date.now()}_err`,
        sender: 'bot',
        text: errorText,
        createdAt: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  // Custom text renderer that handles simple Markdown bold, headers, and bullets
  const renderMessageText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Heading 3
      if (trimmedLine.startsWith('### ')) {
        return (
          <Text key={index} style={styles.mdHeader}>
            {trimmedLine.replace('### ', '')}
          </Text>
        );
      }

      // Bullet items
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const cleanLine = trimmedLine.replace(/^[-*]\s+/, '');
        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{renderInlineFormatting(cleanLine)}</Text>
          </View>
        );
      }

      // Numbered lists
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const cleanLine = trimmedLine.replace(/^\d+\.\s+/, '');
        const num = trimmedLine.match(/^\d+/)[0];
        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={styles.bulletNumber}>{num}.</Text>
            <Text style={styles.bulletText}>{renderInlineFormatting(cleanLine)}</Text>
          </View>
        );
      }

      // Empty line / spacer
      if (trimmedLine === '') {
        return <View key={index} style={{ height: 6 }} />;
      }

      // Normal paragraph
      return (
        <Text key={index} style={styles.mdParagraph}>
          {renderInlineFormatting(line)}
        </Text>
      );
    });
  };

  const renderInlineFormatting = (textString) => {
    const parts = textString.split('**');
    return parts.map((part, index) => {
      // Odd indexes are bold
      if (index % 2 === 1) {
        return (
          <Text key={index} style={styles.boldText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const renderChatItem = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🩺</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            !isUser && { backgroundColor: COLORS.surfaceAlt },
          ]}
        >
          {renderMessageText(item.text)}
          <Text style={[styles.timeText, isUser ? styles.userTime : styles.botTime]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Build age string for header
  const getBabyContextLabel = () => {
    if (!baby || !baby.name) return null;
    let details = [];
    if (baby.gender) details.push(baby.gender);
    
    if (baby.dob) {
      const birth = new Date(baby.dob);
      if (!isNaN(birth)) {
        const diffDays = Math.floor((new Date() - birth) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          details.push(`${diffDays}d`);
        } else {
          details.push(`${Math.floor(diffDays / 30)}m`);
        }
      }
    }
    const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
    return `Customized for ${baby.name}${detailsStr}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Baby Nurse 🤖</Text>
          {getBabyContextLabel() && (
            <Text style={styles.headerSubtitle}>{getBabyContextLabel()}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.chatList, { paddingBottom: SPACING.md }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          messages.length > 1 ? null : (
            <View style={styles.quickTopicsContainer}>
              <Text style={styles.quickTopicsTitle}>Quick Topics</Text>
              <View style={styles.quickTopicsRow}>
                {QUICK_TOPICS.map((topic, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.topicChip}
                    onPress={() => sendMessage(topic.query)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicText}>{topic.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        }
      />

      {/* Bouncing/Typing Indicator */}
      {loading && (
        <View style={styles.typingContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🩺</Text>
          </View>
          <View style={[styles.bubble, styles.botBubble, styles.typingBubble, { backgroundColor: COLORS.surfaceAlt }]}>
            <ActivityIndicator size="small" color={COLORS.primaryDark} style={styles.typingIndicator} />
            <Text style={styles.typingText}>Consulting pediatric guides...</Text>
          </View>
        </View>
      )}

      {/* Persistent Quick Topics (if chat has history) */}
      {messages.length > 1 && !loading && (
        <View style={styles.inlineTopicsWrapper}>
          <FlatList
            horizontal
            data={QUICK_TOPICS}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.inlineTopicChip}
                onPress={() => sendMessage(item.query)}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineTopicText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inlineTopicsList}
          />
        </View>
      )}

      {/* Input Section */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, SPACING.md) + 16 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask a question about feeding, sleep, etc..."
          placeholderTextColor={COLORS.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: COLORS.primaryDark }, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || loading}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  clearBtn: {
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  chatList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botRow: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    ...SHADOWS.sm,
  },
  userBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomRightRadius: 2,
  },
  botBubble: {
    borderBottomLeftRadius: 2,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  userTime: {
    color: COLORS.textSecondary,
  },
  botTime: {
    color: COLORS.textLight,
  },
  mdHeader: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 6,
    marginBottom: 4,
  },
  mdParagraph: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingRight: SPACING.sm,
  },
  bulletDot: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    marginRight: 8,
    lineHeight: 21,
  },
  bulletNumber: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
    lineHeight: 21,
  },
  bulletText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingIndicator: {
    marginRight: 8,
  },
  typingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  quickTopicsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  quickTopicsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickTopicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
  },
  topicText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inlineTopicsWrapper: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  inlineTopicsList: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  inlineTopicChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  inlineTopicText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.sm,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
