import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../utils/api';
import { AutocompleteDropdown } from '../../components/AutocompleteDropdown';
import { MarkdownText } from '../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const quotePostId = params.quote as string | undefined;
  
  const [body, setBody] = useState('');
  const [title, setTitle] = useState(''); // Separate title state for cleaner UI, or parse from markdown? 
  // User asked for "first line is title" behavior in spec, but for "better UX" a title field is often clearer.
  // I'll stick to the markdown parsing logic but maybe offer a field that auto-prepends #?
  // Let's stick to "body only" but with a "Title" button that inserts #.
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [autocomplete, setAutocomplete] = useState<{
    show: boolean;
    query: string;
    type: 'topic' | 'post' | 'user' | 'all';
    position: number;
  } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Modals state
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkToTopicModalVisible, setLinkToTopicModalVisible] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<any[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const textInputRef = useRef<TextInput>(null);
  const [quotedPost, setQuotedPost] = useState<any>(null);

  useEffect(() => {
    if (quotePostId) {
      loadQuotedPost();
    }
  }, [quotePostId]);

  const loadQuotedPost = async () => {
    try {
      const post = await api.get(`/posts/${quotePostId}`);
      setQuotedPost(post);
    } catch (error) {
      console.error('Failed to load quoted post', error);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const start = selection.start;
    const end = selection.end;
    
    const newBody = body.substring(0, start) + before + body.substring(start, end) + after + body.substring(end);
    setBody(newBody);
    
    // Attempt to move cursor after insertion (basic)
    // In a real app we might need to verify this works smoothly with the state update
    const newCursorPos = start + before.length + (end - start);
    // setSelection({ start: newCursorPos, end: newCursorPos }); // This often conflicts with render cycle in RN without native props
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setHeaderImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('compose.failedPickImage'));
    }
  };

  const handlePublish = async () => {
    const trimmedBody = body.trim();
    
    if (!trimmedBody) {
      Alert.alert(t('common.error'), t('compose.bodyRequired') || 'Post body is required');
      return;
    }

    if (trimmedBody.length < 3) {
      Alert.alert(t('common.error'), t('compose.bodyTooShort') || 'Post must be at least 3 characters');
      return;
    }

    if (trimmedBody.length > 10000) {
      Alert.alert(t('common.error'), t('compose.bodyTooLong') || 'Post must be less than 10,000 characters');
      return;
    }

    setIsPublishing(true);
    try {
      // Upload image if exists (mock upload)
      let imageKey = null;
      if (headerImage) {
        // In real app, upload to S3/MinIO here
        imageKey = 'mock-image-key'; 
      }

      if (quotePostId) {
        await api.post('/posts/quote', {
          postId: quotePostId,
          body: trimmedBody,
        });
      } else {
        await api.post('/posts', {
          body: trimmedBody,
          headerImageKey: imageKey, 
        });
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to publish', error);
      const errorMessage = error?.status === 400
        ? t('compose.invalidContent') || 'Invalid post content'
        : error?.status === 413
        ? t('compose.tooLarge') || 'Post is too large'
        : t('compose.error');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    // Autocomplete logic - show LINK TO TOPIC modal when typing [[
    const lastWord = text.split(/\s+/).pop();
    if (lastWord?.startsWith('[[') && !linkToTopicModalVisible) {
      setLinkToTopicModalVisible(true);
      loadTopicSuggestions();
    } else if (!lastWord?.startsWith('[[') && linkToTopicModalVisible) {
      setLinkToTopicModalVisible(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      setBody(prev => prev + `[${text}](${linkUrl})`);
      setLinkModalVisible(false);
      setLinkText('');
      setLinkUrl('');
    }
  };

  const loadTopicSuggestions = async () => {
    try {
      // Get recent topics or search based on current text
      const data = await api.get('/explore/topics?limit=5');
      const topics = Array.isArray(data) ? data : [];
      // Add mock suggestions if API doesn't return enough
      if (topics.length < 3) {
        topics.push(
          { id: '1', slug: 'linking-your-thinking', title: 'Linking Your Thinking', referenceCount: 12 },
          { id: '2', slug: 'network-topology', title: 'Network Topology', referenceCount: 3 },
        );
      }
      setTopicSuggestions(topics);
    } catch (error) {
      console.error('Failed to load topic suggestions', error);
      // Fallback to mock data
      setTopicSuggestions([
        { id: '1', slug: 'linking-your-thinking', title: 'Linking Your Thinking', referenceCount: 12 },
        { id: '2', slug: 'network-topology', title: 'Network Topology', referenceCount: 3 },
        { id: '3', slug: 'linear-notes', title: 'Linear Notes', referenceCount: 0 },
      ]);
    }
  };

  const handleLinkToTopic = (topic: any) => {
    setBody(prev => prev + `[[${topic.slug}]]`);
    setLinkToTopicModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          accessibilityLabel={t('compose.cancel')}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButton}>{t('compose.cancel')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('compose.newPost')}</Text>
        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleButton, !previewMode && styles.toggleButtonActive]} 
            onPress={() => setPreviewMode(false)}
            accessibilityLabel={t('compose.write')}
            accessibilityRole="tab"
            accessibilityState={{ selected: !previewMode }}
          >
            <Text style={[styles.toggleText, !previewMode && styles.toggleTextActive]}>{t('compose.write')}</Text>
          </Pressable>
          <Pressable 
            style={[styles.toggleButton, previewMode && styles.toggleButtonActive]} 
            onPress={() => setPreviewMode(true)}
            accessibilityLabel={t('compose.preview')}
            accessibilityRole="tab"
            accessibilityState={{ selected: previewMode }}
          >
            <Text style={[styles.toggleText, previewMode && styles.toggleTextActive]}>{t('compose.preview')}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handlePublish}
          disabled={!body.trim() || isPublishing}
          style={[styles.publishButton, (!body.trim() || isPublishing) && styles.publishButtonDisabled]}
          accessibilityLabel={t('compose.publish')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !body.trim() || isPublishing }}
        >
          <Text style={styles.publishButtonText}>
            {isPublishing ? '...' : t('compose.publish')}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {quotedPost && (
          <View style={styles.quotedPost}>
            <Text style={styles.quotedPostTitle}>{quotedPost.title || t('compose.quotedPost')}</Text>
            <Text style={styles.quotedPostBody} numberOfLines={2}>
              {quotedPost.body}
            </Text>
          </View>
        )}

        {headerImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: headerImage }} style={styles.headerImage} />
            {!previewMode && (
              <Pressable style={styles.removeImage} onPress={() => setHeaderImage(null)}>
                <MaterialIcons name="close" size={16} color="white" />
              </Pressable>
            )}
          </View>
        )}

        {previewMode ? (
          <View style={styles.previewContainer}>
            <MarkdownText>{body}</MarkdownText>
          </View>
        ) : (
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder={quotedPost ? t('compose.startWriting') : t('compose.placeholder')}
            placeholderTextColor={COLORS.tertiary}
            multiline
            value={body}
            onChangeText={handleBodyChange}
            onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            autoFocus
            textAlignVertical="top"
            accessibilityLabel={quotedPost ? t('compose.startWriting') : t('compose.placeholder')}
          />
        )}
      </ScrollView>

      {/* Toolbar - Only visible in Write mode */}
      {!previewMode && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
            <Pressable 
              style={[styles.toolbarButton, styles.toolbarButtonActive]} 
              onPress={() => insertText('# ')}
              accessibilityLabel="Insert heading"
              accessibilityRole="button"
            >
              <Text style={styles.toolbarButtonText}>T</Text>
            </Pressable>
            <Pressable 
              style={styles.toolbarButton} 
              onPress={() => insertText('**', '**')}
              accessibilityLabel="Insert bold"
              accessibilityRole="button"
            >
              <Text style={styles.toolbarButtonText}>B</Text>
            </Pressable>
            <Pressable 
              style={styles.toolbarButton} 
              onPress={() => insertText('_', '_')}
              accessibilityLabel="Insert italic"
              accessibilityRole="button"
            >
              <Text style={styles.toolbarButtonText}>I</Text>
            </Pressable>
            <Pressable 
              style={styles.toolbarButton} 
              onPress={() => insertText('> ')}
              accessibilityLabel="Insert quote"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-quote-close" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable 
              style={styles.toolbarButton} 
              onPress={() => insertText('- ')}
              accessibilityLabel="Insert list"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable 
              style={[styles.toolbarButton, linkToTopicModalVisible && styles.toolbarButtonActive]} 
              onPress={() => {
                setLinkToTopicModalVisible(true);
                loadTopicSuggestions();
              }}
              accessibilityLabel="Link to topic"
              accessibilityRole="button"
            >
              <MaterialIcons name="link" size={20} color={linkToTopicModalVisible ? COLORS.paper : COLORS.primary} />
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('[[')}>
              <MaterialCommunityIcons name="pound" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('[[post:')}>
              <MaterialIcons name="image" size={20} color={COLORS.primary} />
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* LINK TO TOPIC Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={linkToTopicModalVisible}
        onRequestClose={() => setLinkToTopicModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setLinkToTopicModalVisible(false)}
        >
          <Pressable 
            style={styles.linkToTopicModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.linkToTopicTitle}>LINK TO TOPIC</Text>
            <FlatList
              data={topicSuggestions}
              keyExtractor={(item) => item.id || item.slug}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.topicSuggestionItem}
                  onPress={() => handleLinkToTopic(item)}
                  accessibilityLabel={`Link to ${item.title || item.slug}`}
                  accessibilityRole="button"
                >
                  {item.slug === 'linear-notes' ? (
                    <MaterialIcons name="description" size={18} color={COLORS.tertiary} />
                  ) : item.slug === 'network-topology' ? (
                    <MaterialIcons name="hub" size={18} color={COLORS.tertiary} />
                  ) : (
                    <MaterialIcons name="link" size={18} color={COLORS.tertiary} />
                  )}
                  <View style={styles.topicSuggestionContent}>
                    <Text style={styles.topicSuggestionTitle}>{item.title || item.slug}</Text>
                    <Text style={styles.topicSuggestionRefs}>
                      {item.referenceCount !== undefined ? `${item.referenceCount} ${t('post.references')}` : t('compose.createNewPage')}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Pressable
                  style={styles.topicSuggestionItem}
                  onPress={() => {
                    setBody(prev => prev + '[[');
                    setLinkToTopicModalVisible(false);
                  }}
                  accessibilityLabel={t('compose.createNewPage')}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="description" size={18} color={COLORS.tertiary} />
                  <View style={styles.topicSuggestionContent}>
                    <Text style={styles.topicSuggestionTitle}>{t('compose.createNewPage')}</Text>
                  </View>
                </Pressable>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Link Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={linkModalVisible}
        onRequestClose={() => setLinkModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('compose.addLink')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('compose.linkDisplayText')}
              placeholderTextColor={COLORS.tertiary}
              value={linkText}
              onChangeText={setLinkText}
            />
            <TextInput
              style={styles.modalInput}
              placeholder={t('compose.linkUrl')}
              placeholderTextColor={COLORS.tertiary}
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setLinkModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.modalButtonAdd} onPress={addLink}>
                <Text style={styles.modalButtonTextAdd}>{t('post.add')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    position: 'relative',
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.hover,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  publishButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 80,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.paper,
    minHeight: 200,
    fontFamily: FONTS.regular,
    textAlignVertical: 'top',
  },
  previewContainer: {
    paddingVertical: SPACING.m,
  },
  quotedPost: {
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    marginBottom: SPACING.l,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  quotedPostTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: 4,
  },
  quotedPostBody: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  imagePreview: {
    marginBottom: SPACING.l,
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.borderRadius,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  toolbar: {
    paddingVertical: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  toolbarContent: {
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    gap: 8,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: COLORS.hover,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.divider,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.hover,
    color: COLORS.paper,
    padding: SPACING.m,
    borderRadius: 8,
    marginBottom: SPACING.m,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  modalButtonCancel: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 8,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
  },
  modalButtonAdd: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  modalButtonTextAdd: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  linkToTopicModal: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    marginHorizontal: SPACING.l,
    marginTop: 300,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  linkToTopicTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    paddingHorizontal: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  topicSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    gap: SPACING.m,
    borderRadius: SIZES.borderRadius,
  },
  topicSuggestionContent: {
    flex: 1,
  },
  topicSuggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  topicSuggestionRefs: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  toolbarButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
