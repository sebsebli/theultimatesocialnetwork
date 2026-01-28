import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { MarkdownText } from '../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const quotePostId = params.quote as string | undefined;
  const replyToPostId = params.replyTo as string | undefined;

  const [body, setBody] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerImageKey, setHeaderImageKey] = useState<string | null>(null);
  const [headerImageBlurhash, setHeaderImageBlurhash] = useState<string | null>(null);
  const [headerImageAsset, setHeaderImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

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
      loadQuotedPost(quotePostId);
    } else if (replyToPostId) {
      loadQuotedPost(replyToPostId);
    }
  }, [quotePostId, replyToPostId]);

  const loadQuotedPost = async (id: string) => {
    try {
      const post = await api.get(`/posts/${id}`);
      setQuotedPost(post);
    } catch (error) {
      console.error('Failed to load referenced post', error);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const start = selection.start;
    const end = selection.end;

    const newBody = body.substring(0, start) + before + body.substring(start, end) + after + body.substring(end);
    setBody(newBody);
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
        setHeaderImageAsset(result.assets[0]);
      }
    } catch (error) {
      showError(t('compose.failedPickImage'));
    }
  };

  const handlePublish = async () => {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      showError(t('compose.bodyRequired', 'Post body is required'));
      return;
    }

    if (trimmedBody.length < 3) {
      showError(t('compose.bodyTooShort', 'Post must be at least 3 characters'));
      return;
    }

    setIsPublishing(true);
    try {
      // Upload image if exists
      let imageKey = null;
      let imageBlurhash = null;
      if (headerImageAsset) {
        const uploadRes = await api.upload('/upload/header-image', headerImageAsset);
        imageKey = uploadRes.key;
        imageBlurhash = uploadRes.blurhash;
      }

      if (quotePostId) {
        await api.post('/posts/quote', {
          postId: quotePostId,
          body: trimmedBody,
        });
      } else if (replyToPostId) {
        await api.post(`/posts/${replyToPostId}/replies`, {
          body: trimmedBody,
        });
      } else {
        await api.post('/posts', {
          body: trimmedBody,
          headerImageKey: imageKey,
          headerImageBlurhash: imageBlurhash,
        });
      }
      showSuccess(t('compose.publishedSuccess', 'Published successfully'));
      router.back();
    } catch (error: any) {
      console.error('Failed to publish', error);
      const errorMessage = error?.status === 400
        ? t('compose.invalidContent', 'Invalid post content')
        : error?.status === 413
          ? t('compose.tooLarge', 'Post is too large')
          : t('compose.error');
      showError(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBodyChange = useCallback((text: string) => {
    setBody(text);
    const lastWord = text.split(/\s+/).pop();
    if (lastWord?.startsWith('[[') && !linkToTopicModalVisible) {
      setLinkToTopicModalVisible(true);
      loadTopicSuggestions();
    } else if (!lastWord?.startsWith('[[') && linkToTopicModalVisible) {
      setLinkToTopicModalVisible(false);
    }
  }, [linkToTopicModalVisible]);

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
      const data = await api.get('/explore/topics?limit=5');
      const topics = Array.isArray(data) ? data : [];
      if (topics.length < 3) {
        topics.push(
          { id: '1', slug: 'linking-your-thinking', title: 'Linking Your Thinking', referenceCount: 12 },
          { id: '2', slug: 'network-topology', title: 'Network Topology', referenceCount: 3 },
        );
      }
      setTopicSuggestions(topics);
    } catch (error) {
      console.error('Failed to load topic suggestions', error);
      setTopicSuggestions([
        { id: '1', slug: 'linking-your-thinking', title: 'Linking Your Thinking', referenceCount: 12 },
        { id: '2', slug: 'network-topology', title: 'Network Topology', referenceCount: 3 },
      ]);
    }
  };

  const handleLinkToTopic = (topic: any) => {
    setBody(prev => prev + `${topic.slug}]]`);
    setLinkToTopicModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancelButton}>{t('compose.cancel')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('compose.newPost')}</Text>
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, !previewMode && styles.toggleButtonActive]}
            onPress={() => setPreviewMode(false)}
          >
            <Text style={[styles.toggleText, !previewMode && styles.toggleTextActive]}>{t('compose.write')}</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, previewMode && styles.toggleButtonActive]}
            onPress={() => setPreviewMode(true)}
          >
            <Text style={[styles.toggleText, previewMode && styles.toggleTextActive]}>{t('compose.preview')}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handlePublish}
          disabled={!body.trim() || isPublishing}
          style={[styles.publishButton, (!body.trim() || isPublishing) && styles.publishButtonDisabled]}
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
              <Pressable style={styles.removeImage} onPress={() => { setHeaderImage(null); setHeaderImageAsset(null); }}>
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
            onSelectionChange={(event: any) => setSelection(event.nativeEvent.selection)}
            autoFocus
            textAlignVertical="top"
          />
        )}
      </ScrollView>

      {/* Toolbar */}
      {!previewMode && (
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
            <Pressable style={[styles.toolbarButton, styles.toolbarButtonActive]} onPress={() => insertText('# ')}>
              <Text style={styles.toolbarButtonText}>H1</Text>
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('## ')}>
              <Text style={styles.toolbarButtonText}>H2</Text>
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('**', '**')}>
              <Text style={styles.toolbarButtonText}>B</Text>
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('_', '_')}>
              <Text style={styles.toolbarButtonText}>I</Text>
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('> ')}>
              <MaterialCommunityIcons name="format-quote-close" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => insertText('- ')}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.primary} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.toolbarButton} onPress={() => setLinkModalVisible(true)}>
              <MaterialIcons name="link" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={() => {
              setLinkToTopicModalVisible(true);
              loadTopicSuggestions();
              insertText('[[');
            }}>
              <MaterialCommunityIcons name="pound" size={20} color={COLORS.primary} />
            </Pressable>
            <Pressable style={styles.toolbarButton} onPress={pickImage}>
              <MaterialIcons name="image" size={20} color={COLORS.primary} />
            </Pressable>
          </ScrollView>
        </View>
      )}

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

      {/* Topic Suggestions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={linkToTopicModalVisible}
        onRequestClose={() => setLinkToTopicModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLinkToTopicModalVisible(false)}>
          <View style={styles.linkToTopicModal}>
            <Text style={styles.linkToTopicTitle}>{t('compose.linkToTopic', 'LINK TO TOPIC')}</Text>
            <FlatList
              data={topicSuggestions}
              keyExtractor={(item: any) => item.id || item.slug}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  style={styles.topicSuggestionItem}
                  onPress={() => handleLinkToTopic(item)}
                >
                  <MaterialIcons name="link" size={18} color={COLORS.tertiary} />
                  <View style={styles.topicSuggestionContent}>
                    <Text style={styles.topicSuggestionTitle}>{item.title || item.slug}</Text>
                    {item.referenceCount !== undefined && (
                      <Text style={styles.topicSuggestionRefs}>{t('compose.references', { count: item.referenceCount, defaultValue: `${item.referenceCount} references` })}</Text>
                    )}
                  </View>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
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
    zIndex: -1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.hover,
    borderRadius: 8,
    padding: 2,
    marginRight: SPACING.m,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  publishButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
  },
  publishButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.hover,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
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
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.m,
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
  toolbarButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
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
    marginTop: 100, // Adjust for positioning
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: 300,
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
});
