import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useComposerSearch } from '../../hooks/useComposerSearch';
import { PostContent } from '../../components/PostContent';
import { Post } from '../../types';
import { COLORS, SPACING } from '../../constants/theme';

export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const quotePostId = params.quote as string | undefined;
  const replyToPostId = params.replyTo as string | undefined;

  const [body, setBody] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerImageAsset, setHeaderImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Suggestions state
  const [suggestionType, setSuggestionType] = useState<'none' | 'topic' | 'mention'>('none');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const { results: suggestions, search, clearSearch } = useComposerSearch();

  // Link Input State (Inline, no modal)
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [referenceMetadata, setReferenceMetadata] = useState<Record<string, { title?: string }>>({});

  const textInputRef = useRef<TextInput>(null);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (quotePostId) loadQuotedPost(quotePostId);
    else if (replyToPostId) loadQuotedPost(replyToPostId);
  }, [quotePostId, replyToPostId]);

  // Load referenced post metadata when entering preview
  useEffect(() => {
    if (previewMode) {
      const loadRefs = async () => {
        const matches = body.matchAll(/\[\[post:([^\]|]+)(?:\|[^\]]+)?\]\]/g);
        const ids = new Set<string>();
        for (const m of matches) ids.add(m[1]);

        if (ids.size > 0) {
          const metadata: Record<string, { title?: string }> = {};
          await Promise.all(Array.from(ids).map(async (id) => {
            try {
              const p = await api.get(`/posts/${id}`);
              metadata[id] = { title: p.title };
            } catch (e) {
              // ignore
            }
          }));
          setReferenceMetadata(metadata);
        }
      };
      loadRefs();
    }
  }, [previewMode, body]);

  const loadQuotedPost = async (id: string) => {
    try {
      const post = await api.get(`/posts/${id}`);
      setQuotedPost(post);
    } catch (error) {
      // ignore
    }
  };

  const insertText = (text: string) => {
    const { start, end } = selection;
    const newBody = body.substring(0, start) + text + body.substring(end);
    setBody(newBody);

    // Update cursor position
    const newPos = start + text.length;
    setSelection({ start: newPos, end: newPos });
  };

  const formatSelection = (type: 'bold' | 'italic' | 'quote' | 'list' | 'ordered-list') => {
    const { start, end } = selection;
    const selectedText = body.substring(start, end);
    let newText = '';

    if (type === 'bold') newText = `**${selectedText || 'text'}**`;
    else if (type === 'italic') newText = `_${selectedText || 'text'}_`;
    else if (type === 'quote') newText = `> ${selectedText || 'quote'}`;
    else if (type === 'list') newText = `- ${selectedText || 'item'}`;
    else if (type === 'ordered-list') newText = `1. ${selectedText || 'item'}`;

    const newBody = body.substring(0, start) + newText + body.substring(end);
    setBody(newBody);

    // Select the wrapped text or cursor at end
    const newEnd = start + newText.length;
    setSelection({ start: newEnd, end: newEnd });
  };

  const openLinkInput = () => {
    const { start, end } = selection;
    if (start !== end) {
      setLinkText(body.substring(start, end));
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setShowLinkInput(true);
  };

  const addLink = () => {
    if (linkUrl) {
      const { start, end } = selection;
      const textToDisplay = linkText || (start !== end ? body.substring(start, end) : linkUrl);

      const newText = `[${textToDisplay}](${linkUrl})`;
      const newBody = body.substring(0, start) + newText + body.substring(end);
      setBody(newBody);

      const newPos = start + newText.length;
      setSelection({ start: newPos, end: newPos });

      setShowLinkInput(false);
      setLinkText('');
      setLinkUrl('');
    }
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
    setIsPublishing(true);
    try {
      let imageKey = null;
      let imageBlurhash = null;
      if (headerImageAsset) {
        const uploadRes = await api.upload('/upload/header-image', headerImageAsset);
        imageKey = uploadRes.key;
        imageBlurhash = uploadRes.blurhash;
      }

      if (quotePostId) {
        await api.post('/posts/quote', { postId: quotePostId, body: trimmedBody });
      } else if (replyToPostId) {
        await api.post(`/posts/${replyToPostId}/replies`, { body: trimmedBody });
      } else {
        await api.post('/posts', { body: trimmedBody, headerImageKey: imageKey, headerImageBlurhash: imageBlurhash });
      }
      showSuccess(t('compose.publishedSuccess', 'Published successfully'));
      router.back();
    } catch (error: any) {
      console.error('Failed to publish', error);
      showError(t('compose.error'));
    } finally {
      setIsPublishing(false);
    }
  };

  // --- Suggestions Logic ---
  const checkTriggers = (text: string, cursorIndex: number) => {
    const beforeCursor = text.slice(0, cursorIndex);

    // Check for Mention (@Name Surname)
    const lastAt = beforeCursor.lastIndexOf('@');
    // Ensure @ is preceded by space or start of line
    const isAtValid = lastAt === 0 || /\s/.test(beforeCursor[lastAt - 1]);

    if (lastAt !== -1 && isAtValid) {
      const query = beforeCursor.slice(lastAt + 1);
      // Allow spaces in mentions, but stop at newline or reasonable length
      if (!query.includes('\n') && query.length < 50) {
        // Check if we typed another trigger character that invalidates this one
        if (!query.includes('[[')) {
          if (suggestionType !== 'mention') setSuggestionType('mention');
          search(query, 'mention');
          return;
        }
      }
    }

    // Check for Topic ([[Topic]])
    const lastBracket = beforeCursor.lastIndexOf('[[');
    if (lastBracket !== -1) {
      const query = beforeCursor.slice(lastBracket + 2);
      if (!query.includes(']]') && !query.includes('\n')) {
        if (suggestionType !== 'topic') setSuggestionType('topic');
        search(query, 'topic');
        return;
      }
    }

    if (suggestionType !== 'none') {
      setSuggestionType('none');
      clearSearch();
    }
  };

  const handleSuggestionSelect = (item: any) => {
    const beforeCursor = body.slice(0, selection.start);
    const afterCursor = body.slice(selection.start);

    let triggerIndex = -1;
    let insertion = '';

    if (suggestionType === 'mention') {
      triggerIndex = beforeCursor.lastIndexOf('@');
      insertion = `@${item.handle} `;
    } else if (suggestionType === 'topic') {
      triggerIndex = beforeCursor.lastIndexOf('[[');
      if (item.type === 'post') {
        insertion = `[[post:${item.id}|${item.displayName || item.title}]] `;
      } else {
        insertion = `[[${item.slug || item.title}]] `;
      }
    }

    if (triggerIndex !== -1) {
      const newBody = beforeCursor.substring(0, triggerIndex) + insertion + afterCursor;
      setBody(newBody);
    }
    setSuggestionType('none');
    clearSearch();
  };

  // --- Components ---

  const SuggestionsView = () => {
    if (suggestionType === 'none' || suggestions.length === 0) return null;
    return (
      <View style={styles.suggestionsContainer}>
        <FlatList
          data={suggestions}
          keyExtractor={item => item.id || item.slug || item.handle}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)}>
              <View style={styles.suggestionIcon}>
                {suggestionType === 'mention' ? (
                  <Text style={styles.suggestionAvatarText}>{(item.displayName || item.handle)?.charAt(0)}</Text>
                ) : (
                  <MaterialIcons name="pound" size={20} color={COLORS.primary} />
                )}
              </View>
              <View>
                <Text style={styles.suggestionText}>{item.displayName || item.title || item.slug}</Text>
                <Text style={styles.suggestionSubText}>{suggestionType === 'mention' ? `@${item.handle}` : 'Topic'}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  };

  const LinkInput = () => (
    <View style={styles.linkInputContainer}>
      <View style={styles.linkInputRow}>
        <TextInput
          style={styles.linkField}
          placeholder="URL (https://...)"
          placeholderTextColor={COLORS.tertiary}
          value={linkUrl}
          onChangeText={setLinkUrl}
          autoFocus
          autoCapitalize="none"
          keyboardType="url"
        />
        <Pressable onPress={addLink} style={styles.linkAddButton}>
          <MaterialIcons name="check" size={20} color={COLORS.ink} />
        </Pressable>
        <Pressable onPress={() => setShowLinkInput(false)} style={styles.linkCloseButton}>
          <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
        </Pressable>
      </View>
      <TextInput
        style={[styles.linkField, { marginTop: 8 }]}
        placeholder="Display Text (optional)"
        placeholderTextColor={COLORS.tertiary}
        value={linkText}
        onChangeText={setLinkText}
      />
    </View>
  );

  const Toolbar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.toolBtn} onPress={() => insertText('# ')}><Text style={styles.toolText}>H1</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('## ')}><Text style={styles.toolText}>H2</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('bold')}><MaterialIcons name="format-bold" size={20} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('italic')}><MaterialIcons name="format-italic" size={20} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('quote')}><MaterialIcons name="format-quote" size={20} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('list')}><MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></Pressable>
      <View style={styles.divider} />
      <Pressable style={styles.toolBtn} onPress={openLinkInput}><MaterialIcons name="link" size={20} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('[[')}><Text style={styles.toolText}>[[ ]]</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('@')}><MaterialIcons name="alternate-email" size={20} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={pickImage}><MaterialIcons name="image" size={20} color={COLORS.primary} /></Pressable>
    </ScrollView>
  );

  useEffect(() => {
    checkTriggers(body, selection.start);
  }, [body, selection]);

  const previewPost = {
    id: 'preview',
    title: body.startsWith('# ') ? body.split('\n')[0].substring(2) : undefined,
    body: body,
    createdAt: new Date().toISOString(),
    author: {
      id: 'me',
      handle: 'me',
      displayName: 'Me',
    },
    headerImageKey: null,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>{t('common.cancel')}</Text>
        </Pressable>
        <View style={styles.modeToggle}>
          <Pressable onPress={() => setPreviewMode(false)} style={[styles.modeBtn, !previewMode && styles.modeBtnActive]}>
            <Text style={[styles.modeText, !previewMode && styles.modeTextActive]}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => setPreviewMode(true)} style={[styles.modeBtn, previewMode && styles.modeBtnActive]}>
            <Text style={[styles.modeText, previewMode && styles.modeTextActive]}>Preview</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={handlePublish}
          disabled={!body.trim() || isPublishing}
          style={[styles.publishBtn, (!body.trim() || isPublishing) && styles.publishBtnDisabled]}
        >
          <Text style={styles.publishText}>{isPublishing ? 'Posting...' : t('compose.publish')}</Text>
        </Pressable>
      </View>

      <Pressable style={{ flex: 1 }} onPress={() => !previewMode && textInputRef.current?.focus()}>
        <ScrollView
          style={styles.editorContainer}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {quotedPost && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteTitle}>{quotedPost.title || 'Post'}</Text>
              <Text numberOfLines={2} style={styles.quoteBody}>{quotedPost.body}</Text>
            </View>
          )}

          {headerImage && !previewMode && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: headerImage }} style={styles.headerImg} />
              <Pressable style={styles.removeImgBtn} onPress={() => { setHeaderImage(null); setHeaderImageAsset(null); }}>
                <MaterialIcons name="close" size={16} color="white" />
              </Pressable>
            </View>
          )}

          {previewMode ? (
            <PostContent
              post={previewPost}
              headerImageUri={headerImage}
              disableNavigation
              showSources={true}
              referenceMetadata={referenceMetadata}
            />
          ) : (
            <TextInput
              ref={textInputRef}
              style={styles.input}
              placeholder={t('compose.placeholderWithMarkdown', 'Start writing...')}
              placeholderTextColor={COLORS.tertiary}
              multiline
              scrollEnabled={false}
              value={body}
              onChangeText={setBody}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              autoFocus
            />
          )}
        </ScrollView>
      </Pressable>

      {/* Footer Area */}
      {!previewMode && (
        <View style={styles.footer}>
          <SuggestionsView />
          {showLinkInput ? <LinkInput /> : <Toolbar />}
        </View>
      )}
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
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeBtn: { padding: SPACING.s },
  closeText: { color: COLORS.secondary, fontSize: 16 },
  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.hover, borderRadius: 8, padding: 2 },
  modeBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  modeBtnActive: { backgroundColor: COLORS.ink, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  modeText: { color: COLORS.tertiary, fontSize: 13, fontWeight: '500' },
  modeTextActive: { color: COLORS.paper, fontWeight: '600' },
  publishBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  publishBtnDisabled: { opacity: 0.5 },
  publishText: { color: COLORS.ink, fontWeight: '600', fontSize: 14 },

  editorContainer: { flex: 1, padding: SPACING.l },
  input: { fontSize: 18, color: COLORS.paper, lineHeight: 26, textAlignVertical: 'top', minHeight: 200 },

  quoteBox: { backgroundColor: COLORS.hover, padding: SPACING.m, borderRadius: 8, marginBottom: SPACING.m, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  quoteTitle: { color: COLORS.paper, fontWeight: '600', marginBottom: 4 },
  quoteBody: { color: COLORS.secondary },

  imageContainer: { marginBottom: SPACING.m, borderRadius: 8, overflow: 'hidden' },
  headerImg: { width: '100%', height: 200 },
  removeImgBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 },

  footer: { backgroundColor: COLORS.ink, borderTopWidth: 1, borderTopColor: COLORS.divider },

  toolbar: { flexDirection: 'row', padding: SPACING.s },
  toolBtn: { padding: 8, borderRadius: 4, marginRight: 4, backgroundColor: COLORS.hover, minWidth: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  toolText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  divider: { width: 1, height: 24, backgroundColor: COLORS.divider, marginHorizontal: 8, alignSelf: 'center' },

  suggestionsContainer: { maxHeight: 220, borderBottomWidth: 1, borderBottomColor: COLORS.divider, backgroundColor: COLORS.ink },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.l, borderBottomWidth: 1, borderBottomColor: COLORS.hover, gap: 16 },
  suggestionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.hover, alignItems: 'center', justifyContent: 'center' },
  suggestionAvatarText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  suggestionText: { color: COLORS.paper, fontSize: 16, fontWeight: '600' },
  suggestionSubText: { color: COLORS.secondary, fontSize: 13 },

  linkInputContainer: { padding: SPACING.m },
  linkInputRow: { flexDirection: 'row', gap: 8 },
  linkField: { flex: 1, backgroundColor: COLORS.hover, color: COLORS.paper, padding: 12, borderRadius: 8, fontSize: 16 },
  linkAddButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, justifyContent: 'center' },
  linkCloseButton: { backgroundColor: COLORS.hover, padding: 12, borderRadius: 8, justifyContent: 'center' },
});
