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
  Modal,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/auth';
import { useComposerSearch } from '../../hooks/useComposerSearch';
import { MarkdownText } from '../../components/MarkdownText';
import { Post } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';

/** Stable component so typing in link fields does not remount and dismiss keyboard */
function LinkInputFields({
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  onAdd,
  onClose,
  styles: linkStyles,
}: {
  linkUrl: string;
  setLinkUrl: (s: string) => void;
  linkText: string;
  setLinkText: (s: string) => void;
  onAdd: () => void;
  onClose: () => void;
  styles: Record<string, any>;
}) {
  const { t } = useTranslation();
  return (
    <View style={linkStyles.linkInputContainer}>
      <View style={linkStyles.linkInputRow}>
        <TextInput
          style={linkStyles.linkField}
          placeholder={t('compose.linkUrlPlaceholder', 'URL (https://...)')}
          placeholderTextColor={COLORS.tertiary}
          value={linkUrl}
          onChangeText={setLinkUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          blurOnSubmit={false}
        />
        <Pressable onPress={onAdd} style={linkStyles.linkAddButton}>
          <MaterialIcons name="check" size={HEADER.iconSize} color={COLORS.ink} />
        </Pressable>
        <Pressable onPress={onClose} style={linkStyles.linkCloseButton}>
          <MaterialIcons name="close" size={HEADER.iconSize} color={COLORS.tertiary} />
        </Pressable>
      </View>
      <TextInput
        style={[linkStyles.linkField, linkStyles.linkDisplayField]}
        placeholder={t('compose.linkDisplayTextPlaceholder', 'Display Text (optional)')}
        placeholderTextColor={COLORS.tertiary}
        value={linkText}
        onChangeText={setLinkText}
        blurOnSubmit={false}
      />
    </View>
  );
}

export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const headerImageHeight = Math.round(screenWidth * (3 / 4));
  const quotePostId = params.quote as string | undefined;
  const replyToPostId = params.replyTo as string | undefined;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const BODY_MAX_LENGTH = 10000;
  const TITLE_MAX_LENGTH = 200;
  const MAX_TOPIC_REFS = 15;
  const [body, setBody] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [pendingPublish, setPendingPublish] = useState(false);
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      // Auto-insert [[post:id|Title]] in body (second row: after first line if present, else at start)
      const ref = `[[post:${post.id}|${(post.title || 'Post').replace(/\]/g, '')}]]`;
      setBody((prev) => {
        if (prev.includes(`[[post:${post.id}`)) return prev;
        const trimmed = prev.trim();
        if (!trimmed) return `${ref}\n\n`;
        const firstNewline = trimmed.indexOf('\n');
        if (firstNewline === -1) return `${trimmed}\n\n${ref}\n\n`;
        const firstLine = trimmed.slice(0, firstNewline);
        const rest = trimmed.slice(firstNewline + 1).trimStart();
        return `${firstLine}\n${ref}\n\n${rest}`;
      });
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

  const isValidUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const addLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) return;
    const urlToUse = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    if (!isValidUrl(urlToUse)) {
      showError(t('compose.invalidUrl', 'Please enter a valid URL (e.g. https://example.com)'));
      return;
    }
    const { start, end } = selection;
    const textToDisplay = linkText.trim() || (start !== end ? body.substring(start, end) : new URL(urlToUse).hostname);

    const newText = `[${textToDisplay}](${urlToUse})`;
    const newBody = body.substring(0, start) + newText + body.substring(end);
    setBody(newBody);

    const newPos = start + newText.length;
    setSelection({ start: newPos, end: newPos });

    setShowLinkInput(false);
    setLinkText('');
    setLinkUrl('');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
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
    if (trimmedBody.length > BODY_MAX_LENGTH) {
      showError(t('compose.bodyTooLong', 'Post is too long. Please shorten it.'));
      return;
    }
    if (titleLength > TITLE_MAX_LENGTH) {
      showError(t('compose.headlineTooLong', 'Headline is too long. Please keep it under {{max}} characters.', { max: TITLE_MAX_LENGTH }));
      return;
    }
    if (topicRefCount > MAX_TOPIC_REFS) {
      showError(t('compose.tooManyRefs', 'Too many topic/post references. Maximum {{max}}.', { max: MAX_TOPIC_REFS }));
      return;
    }
    setIsPublishing(true);
    setPendingPublish(false);
    setPreviewMode(false);
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

    // Check for Topic/Post [[...]] — search until ]] or newline; allow spaces in query
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
    let list: any[] = suggestionType === 'mention' && userId
      ? suggestions.filter((item: any) => item.id !== userId)
      : suggestions;
    if (suggestionType === 'topic') {
      const seen = new Set<string>();
      list = list.filter((item: any) => {
        const key = item.type === 'post' ? `post:${item.id}` : `topic:${item.slug ?? item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    if (list.length === 0 && suggestionType === 'mention') return null;
    const topics = suggestionType === 'topic' ? list.filter((i: any) => i.type === 'topic') : [];
    const posts = suggestionType === 'topic' ? list.filter((i: any) => i.type === 'post') : [];
    const showSections = suggestionType === 'topic' && (topics.length > 0 && posts.length > 0);

    const renderSuggestionItem = (item: any) => (
      <Pressable key={`${item.type}-${item.id ?? item.slug}`} style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)}>
        <View style={styles.suggestionIcon}>
          {suggestionType === 'mention' ? (
            <Text style={styles.suggestionAvatarText}>{(item.displayName || item.handle)?.charAt(0)}</Text>
          ) : item.type === 'post' ? (
            <MaterialIcons name="article" size={HEADER.iconSize} color={COLORS.primary} />
          ) : (
            <MaterialIcons name="tag" size={HEADER.iconSize} color={COLORS.primary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.suggestionText} numberOfLines={1}>{item.displayName || item.title || item.slug}</Text>
          <Text style={styles.suggestionSubText} numberOfLines={1}>
            {suggestionType === 'mention' ? `@${item.handle}` : item.type === 'post'
              ? (item.authorDisplayName ? `${item.authorDisplayName}` : item.authorHandle ? `@${item.authorHandle}` : t('compose.post', 'Post'))
              : t('compose.topic', 'Topic')}
          </Text>
        </View>
      </Pressable>
    );

    return (
      <View style={styles.suggestionsContainer}>
        {showSections ? (
          <ScrollView style={styles.suggestionsScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            {topics.length > 0 && (
              <>
                <Text style={[styles.suggestionSectionHeader, { marginTop: 0 }]}>{t('compose.topics', 'Topics')}</Text>
                {topics.map((item: any) => renderSuggestionItem(item))}
              </>
            )}
            {posts.length > 0 && (
              <>
                <Text style={styles.suggestionSectionHeader}>{t('compose.posts', 'Posts')}</Text>
                {posts.map((item: any) => renderSuggestionItem(item))}
              </>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item: { type: string; id?: string; slug?: string; handle?: string }) => `${item.type}-${item.id ?? item.slug ?? item.handle}`}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }: { item: { type: string; id?: string; slug?: string; handle?: string } }) => renderSuggestionItem(item)}
          />
        )}
      </View>
    );
  };

  const Toolbar = () => (
    <ScrollView horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.toolBtn} onPress={() => insertText('# ')}><Text style={styles.toolText}>H1</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('## ')}><Text style={styles.toolText}>H2</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('### ')}><Text style={styles.toolText}>H3</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('bold')}><MaterialIcons name="format-bold" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('italic')}><MaterialIcons name="format-italic" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('quote')}><MaterialIcons name="format-quote" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('list')}><MaterialIcons name="format-list-bulleted" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('ordered-list')}><MaterialIcons name="format-list-numbered" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <View style={styles.divider} />
      <Pressable style={styles.toolBtn} onPress={openLinkInput}><MaterialIcons name="link" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('[[')}><Text style={styles.toolText}>[[ ]]</Text></Pressable>
      <Pressable style={styles.toolBtn} onPress={() => insertText('@')}><MaterialIcons name="alternate-email" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
      <Pressable style={styles.toolBtn} onPress={pickImage}><MaterialIcons name="image" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
    </ScrollView>
  );

  const linkInputEl = showLinkInput ? (
    <View style={styles.linkInputWrap}>
      <LinkInputFields
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        linkText={linkText}
        setLinkText={setLinkText}
        onAdd={addLink}
        onClose={() => setShowLinkInput(false)}
        styles={styles}
      />
    </View>
  ) : suggestionType !== 'none' ? null : (
    <Toolbar />
  );

  useEffect(() => {
    checkTriggers(body, selection.start);
  }, [body, selection]);

  const firstLine = body.split('\n')[0] || '';
  const h1AtStart = firstLine.startsWith('# ');
  const rawTitleFromStart = h1AtStart ? firstLine.substring(2).trim() : '';
  const lastH1Line = body.split('\n').filter((l) => /^#\s+.+/.test(l)).pop() || '';
  const rawTitleFromEnd = lastH1Line.startsWith('# ') ? lastH1Line.substring(2).trim() : '';
  const rawTitle = rawTitleFromStart || rawTitleFromEnd;
  const sanitizedTitle = rawTitle
    .replace(/\s*\[\[[^\]]*\]\]\s*/g, '')
    .replace(/\s*@\S+\s*/g, '')
    .replace(/\s*\[[^\]]*\]\([^)]*\)\s*/g, '')
    .replace(/\s*>\s*/g, '')
    .trim()
    .slice(0, TITLE_MAX_LENGTH);
  const titleLength = (rawTitle
    .replace(/\s*\[\[[^\]]*\]\]\s*/g, '')
    .replace(/\s*@\S+\s*/g, '')
    .replace(/\s*\[[^\]]*\]\([^)]*\)\s*/g, '')
    .replace(/\s*>\s*/g, '')
    .trim()).length;
  const topicRefMatches = body.match(/\[\[[^\]]*\]\]/g) || [];
  const topicRefCount = topicRefMatches.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: HEADER.cancelColor }]}>{t('common.cancel')}</Text>
        </Pressable>
        <View style={styles.modeToggle}>
          <Pressable onPress={() => { setPreviewMode(false); setPendingPublish(false); }} style={[styles.modeBtn, !previewMode && styles.modeBtnActive]}>
            <Text style={[styles.modeText, !previewMode && styles.modeTextActive]}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => setPreviewMode(true)} style={[styles.modeBtn, previewMode && styles.modeBtnActive]}>
            <Text style={[styles.modeText, previewMode && styles.modeTextActive]}>Preview</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            if (!body.trim()) return;
            if (body.trim().length > BODY_MAX_LENGTH) {
              showError(t('compose.bodyTooLong', 'Post is too long. Please shorten it.'));
              return;
            }
            if (titleLength > TITLE_MAX_LENGTH) {
              showError(t('compose.headlineTooLong', 'Headline is too long. Please keep it under {{max}} characters.', { max: TITLE_MAX_LENGTH }));
              return;
            }
            if (topicRefCount > MAX_TOPIC_REFS) {
              showError(t('compose.tooManyRefs', 'Too many topic/post references. Maximum {{max}}.', { max: MAX_TOPIC_REFS }));
              return;
            }
            setPreviewMode(true);
            setPendingPublish(true);
          }}
          disabled={!body.trim() || isPublishing}
          style={[styles.publishBtn, (!body.trim() || isPublishing) && styles.publishBtnDisabled]}
        >
          <Text style={styles.publishText}>{isPublishing ? 'Posting...' : t('compose.publish')}</Text>
        </Pressable>
      </View>

      <Pressable style={{ flex: 1 }} onPress={() => !previewMode && !showLinkInput && textInputRef.current?.focus()}>
        <ScrollView
          style={styles.editorContainer}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
        >
          {quotedPost && (
            <>
              <View style={styles.quoteBox}>
                <Text style={styles.quoteTitle}>{quotedPost.title || 'Post'}</Text>
                <Text numberOfLines={2} style={styles.quoteBody}>{quotedPost.body}</Text>
              </View>
              <Text style={styles.quoteHint}>{t('compose.quoteHint', 'Quoting adds context without mentioning in the headline.')}</Text>
            </>
          )}

          {headerImage && !previewMode && (
            <View style={[styles.imageContainer, { height: headerImageHeight }]}>
              <Image source={{ uri: headerImage }} style={[styles.headerImg, { height: headerImageHeight }]} resizeMode="cover" />
              <Pressable style={styles.removeImgBtn} onPress={() => { setHeaderImage(null); setHeaderImageAsset(null); }}>
                <MaterialIcons name="close" size={HEADER.iconSize} color="white" />
              </Pressable>
            </View>
          )}

          {previewMode ? (
            <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
              <View style={[styles.previewFullscreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.previewHeaderRow}>
                  <Pressable style={styles.previewCloseBar} onPress={() => { setPreviewMode(false); setPendingPublish(false); }}>
                    <Text style={styles.previewCloseText}>{t('common.close', 'Close')}</Text>
                  </Pressable>
                  {pendingPublish ? (
                    <Pressable
                      style={[styles.publishBtn, styles.publishBtnInPreview]}
                      onPress={handlePublish}
                      disabled={isPublishing}
                    >
                      <Text style={styles.publishText}>{isPublishing ? 'Posting...' : t('compose.confirmPublish', 'Confirm & Publish')}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                  {/* Same layout as post reading screen: hero (if image) then article */}
                  {headerImage && (
                    <View style={[styles.previewHeroWrap, { height: headerImageHeight }]}>
                      <Image source={{ uri: headerImage }} style={[styles.previewHeroImage, { height: headerImageHeight }]} resizeMode="cover" />
                      {sanitizedTitle ? (
                        <View style={styles.previewHeroTitleOverlay}>
                          <Text style={styles.previewHeroTitleText} numberOfLines={2}>{sanitizedTitle}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                  <View style={styles.previewArticle}>
                    <View style={styles.previewAuthorLine}>
                      <View style={styles.previewAuthorAvatar}>
                        <Text style={styles.previewAvatarText}>M</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.previewAuthorName}>{t('compose.previewAuthor', 'Me')}</Text>
                        <Text style={styles.previewReadTime}>
                          {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    {!headerImage && sanitizedTitle ? (
                      <Text style={styles.previewTitle}>{sanitizedTitle}</Text>
                    ) : null}
                    <MarkdownText referenceMetadata={referenceMetadata}>{body}</MarkdownText>
                  </View>
                </ScrollView>
              </View>
            </Modal>
          ) : null}
          {!previewMode && (
            <TextInput
              ref={textInputRef}
              style={styles.input}
              placeholder={t('compose.placeholderWithMarkdown', 'Start writing...')}
              placeholderTextColor={COLORS.tertiary}
              multiline
              scrollEnabled={false}
              value={body}
              onChangeText={(text: string) => setBody(text.length <= BODY_MAX_LENGTH ? text : text.slice(0, BODY_MAX_LENGTH))}
              onSelectionChange={(e: { nativeEvent: { selection: { start: number; end: number } } }) => setSelection(e.nativeEvent.selection)}
              autoFocus
            />
          )}
        </ScrollView>
      </Pressable>

      {/* Footer: char count (bottom right) then context bar (toolbar or link overlay) */}
      {!previewMode && (
        <View style={styles.footer} pointerEvents="box-none">
          <SuggestionsView />
          <View style={styles.charCountRow}>
            {h1AtStart ? (
              <Text style={styles.charCount}>
                {t('compose.headline', 'Headline')}: {titleLength} / {TITLE_MAX_LENGTH}
              </Text>
            ) : <View />}
            <Text style={[styles.charCount, styles.charCountRight]}>
              {body.length} / {BODY_MAX_LENGTH}
              {topicRefCount > 0 ? ` · ${t('compose.refs', 'Refs')} ${topicRefCount}/${MAX_TOPIC_REFS}` : ''}
            </Text>
          </View>
          {linkInputEl}
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
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingBottom: HEADER.barPaddingBottom,
  },
  closeBtn: { padding: SPACING.s },
  closeText: { fontSize: 16, fontFamily: FONTS.medium },
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

  quoteBox: { backgroundColor: COLORS.hover, padding: SPACING.m, borderRadius: 8, marginBottom: SPACING.xs, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  quoteTitle: { color: COLORS.paper, fontWeight: '600', marginBottom: 4 },
  quoteBody: { color: COLORS.secondary },
  quoteHint: { fontSize: 12, color: COLORS.tertiary, marginBottom: SPACING.m, fontStyle: 'italic' },

  imageContainer: { marginBottom: SPACING.m, borderRadius: SIZES.borderRadius, overflow: 'hidden', width: '100%' },
  headerImg: { width: '100%' },
  removeImgBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 },

  footer: { backgroundColor: COLORS.ink, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.s },

  charCountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.l, paddingBottom: 4 },
  charCount: { fontSize: 12, color: COLORS.tertiary },
  charCountRight: { textAlign: 'right' },

  toolbar: { flexDirection: 'row', padding: SPACING.s },
  toolBtn: { padding: 8, borderRadius: 4, marginRight: 4, backgroundColor: COLORS.hover, minWidth: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  toolText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  divider: { width: 1, height: 24, backgroundColor: COLORS.divider, marginHorizontal: 8, alignSelf: 'center' },

  suggestionsContainer: { maxHeight: 280, borderBottomWidth: 1, borderBottomColor: COLORS.divider, backgroundColor: COLORS.ink, paddingHorizontal: SPACING.m, paddingTop: SPACING.s },
  suggestionsScroll: { maxHeight: 280 },
  suggestionSectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.tertiary, marginTop: SPACING.m, marginBottom: SPACING.xs, marginHorizontal: SPACING.l, textTransform: 'uppercase' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.l, borderBottomWidth: 1, borderBottomColor: COLORS.hover, gap: 16 },
  suggestionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.hover, alignItems: 'center', justifyContent: 'center' },
  suggestionAvatarText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  suggestionText: { color: COLORS.paper, fontSize: 16, fontWeight: '600' },
  suggestionSubText: { color: COLORS.secondary, fontSize: 13 },

  linkInputWrap: { backgroundColor: COLORS.ink },
  linkInputContainer: { padding: SPACING.m },
  linkInputRow: { flexDirection: 'row', gap: 8 },
  linkField: { flex: 1, backgroundColor: COLORS.hover, color: COLORS.paper, padding: 12, borderRadius: 8, fontSize: 16 },
  linkDisplayField: { marginTop: 8, minHeight: 56, textAlignVertical: 'top' },
  linkAddButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, justifyContent: 'center' },
  linkCloseButton: { backgroundColor: COLORS.hover, padding: 12, borderRadius: 8, justifyContent: 'center' },

  previewFullscreen: { flex: 1, backgroundColor: COLORS.ink },
  previewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  previewCloseBar: { padding: SPACING.l },
  previewCloseText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  publishBtnInPreview: { marginRight: SPACING.l },
  previewScroll: { flex: 1 },
  previewScrollContent: { paddingBottom: 40 },
  /* Reading-format layout: same as post/[id]/reading.tsx */
  previewHeroWrap: { width: '100%', marginBottom: SPACING.l, position: 'relative', overflow: 'hidden' },
  previewHeroImage: { width: '100%', backgroundColor: COLORS.divider },
  previewHeroTitleOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING.l, backgroundColor: 'rgba(0,0,0,0.5)' },
  previewHeroTitleText: { fontSize: 28, fontWeight: '700', color: COLORS.paper, fontFamily: FONTS.semiBold, lineHeight: 34 },
  previewArticle: { paddingHorizontal: SPACING.l, marginBottom: SPACING.l },
  previewAuthorLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m, marginBottom: SPACING.l },
  previewAuthorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(110, 122, 138, 0.2)', justifyContent: 'center', alignItems: 'center' },
  previewAvatarText: { color: COLORS.primary, fontWeight: '600', fontSize: 16, fontFamily: FONTS.semiBold },
  previewAuthorName: { fontSize: 15, color: COLORS.paper, fontFamily: FONTS.medium },
  previewReadTime: { fontSize: 13, color: COLORS.tertiary, fontFamily: FONTS.regular },
  previewTitle: { fontSize: 28, fontWeight: '700', color: COLORS.paper, fontFamily: FONTS.semiBold, lineHeight: 34, marginBottom: SPACING.xl },
});
