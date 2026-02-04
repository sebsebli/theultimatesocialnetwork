import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { api, getImageUrl, getAvatarUri } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/auth';
import { useComposerSearch } from '../../hooks/useComposerSearch';
import { MarkdownText } from '../../components/MarkdownText';
import { PostItem } from '../../components/PostItem';
import { Avatar } from '../../components/Avatar';
import { ImageVerifyingOverlay } from '../../components/ImageVerifyingOverlay';
import { HeaderIconButton, headerIconCircleSize, headerIconCircleMarginH } from '../../components/HeaderIconButton';
import { ScreenHeader, headerRightCancelStyle } from '../../components/ScreenHeader';
import { Post } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER, MODAL, LAYOUT, createStyles, FLATLIST_DEFAULTS, toDimension, toDimensionValue } from '../../constants/theme';
import { Image as ExpoImage } from 'expo-image';
import { useDrafts } from '../../context/DraftContext';

/** Stable component so typing in link fields does not remount and dismiss keyboard */
function LinkInputFields({
  linkUrl,
  setLinkUrl,
  linkText,
  setLinkText,
  onAdd,
  onClose,
  styles: linkStyles,
  maxDisplayLength = 40,
}: {
  linkUrl: string;
  setLinkUrl: (s: string) => void;
  linkText: string;
  setLinkText: (s: string) => void;
  onAdd: () => void;
  onClose: () => void;
  styles: Record<string, any>;
  maxDisplayLength?: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={linkStyles.linkInputContainer}>
      <View style={linkStyles.linkInputRow}>
        <TextInput
          style={linkStyles.linkField}
          placeholder={t('compose.linkUrlPlaceholder', 'URL (https://...')}
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
        onChangeText={(s: string) => setLinkText(s.length <= maxDisplayLength ? s : s.slice(0, maxDisplayLength))}
        maxLength={maxDisplayLength}
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const quotePostId = params.quote as string | undefined;
  const replyToPostId = params.replyTo as string | undefined;

  /** Current user for preview (real handle, displayName, avatar). */
  const [meUser, setMeUser] = useState<{ id: string; handle: string; displayName: string; avatarKey?: string | null; avatarUrl?: string | null } | null>(null);
  useEffect(() => {
    if (!userId) return;
    api.get('/users/me').then((u: any) => setMeUser(u)).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const BODY_MAX_LENGTH = 10000;
  const BODY_MIN_LENGTH = 3; // Short minimum (e.g. "Yes." or "ok")
  const TITLE_MAX_LENGTH = 40; // Headlines (H1/H2/H3) and link/wikilink aliases
  const MAX_TOPIC_REFS = 15;
  const MAX_SOURCES = 16; // Total sources (posts + topics + links) per post

  const { getDraft, setDraft, clearDraft } = useDrafts();
  const draftKey = quotePostId
    ? `quote_${quotePostId}`
    : replyToPostId
      ? `reply_${replyToPostId}`
      : 'new_post';

  const [body, setBodyState] = useState(() => {
    const draft = getDraft(draftKey);
    if (draft != null && draft.trim() !== '') return draft;
    if (quotePostId) return `[[post:${quotePostId}]]\n\n`;
    return '';
  });

  const setBody = (text: string) => {
    setBodyState(text);
    setDraft(draftKey, text);
  };

  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerImageAsset, setHeaderImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  /** After attach we upload in background (with AI check). When done, we have key + blurhash for publish. */
  const [uploadedHeaderKey, setUploadedHeaderKey] = useState<string | null>(null);
  const [uploadedHeaderBlurhash, setUploadedHeaderBlurhash] = useState<string | undefined>(undefined);
  const [headerUploadError, setHeaderUploadError] = useState<string | null>(null);
  const [headerUploading, setHeaderUploading] = useState(false);
  const headerUploadIdRef = useRef(0);
  const publishedWithHeaderKeyRef = useRef<string | null>(null);
  const uploadedHeaderKeyRef = useRef<string | null>(null);
  uploadedHeaderKeyRef.current = uploadedHeaderKey;

  // When opening quote/reply, load that post data (unless we already have it locally, but API is safer)
  // For quote, we fetch quotedPost. For reply, we fetch replyToPost.
  // Actually we need to display the quoted post in UI.
  // We can fetch it or pass via params if complex object passing was supported (it's not).
  // So we fetch by ID if present.
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchContextPost = async () => {
      if (quotePostId) {
        try {
          const res = await api.get(`/posts/${quotePostId}`);
          setQuotedPost(res?.data ?? res);
        } catch (e) { console.error(e); }
      } else if (replyToPostId) {
        // We might want to show what we are replying to?
        // Current UI design doesn't explicitly show "Replying to..." body in compose,
        // but often nice to have. Let's skip for now to keep it simple or add if needed.
      }
    };
    fetchContextPost();
  }, [quotePostId, replyToPostId]);

  // When quoted post loads, optionally add title as alias to the cite link (one-time, only if body is still the initial link)
  const quotedPostAliasAppliedRef = useRef(false);
  useEffect(() => {
    if (!quotePostId || !quotedPost?.title || quotedPostAliasAppliedRef.current) return;
    const bareLink = `[[post:${quotePostId}]]`;
    const trimmed = body.trim();
    if (trimmed !== bareLink && !trimmed.startsWith(bareLink + '\n')) return;
    quotedPostAliasAppliedRef.current = true;
    const alias = quotedPost.title.trim().replace(/\|/g, ' ').slice(0, TITLE_MAX_LENGTH);
    if (alias) setBody(`[[post:${quotePostId}|${alias}]]\n\n`);
  }, [quotePostId, quotedPost?.title, body]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishPhase, setPublishPhase] = useState<'idle' | 'publishing'>('idle');
  const [pendingPublish, setPendingPublish] = useState(false); // To show confirmation/preview state
  const [previewMode, setPreviewMode] = useState(false);

  // Suggestions state
  const {
    query: searchQuery,
    type: suggestionType,
    results: suggestions,
    search,
    clear: clearSearch,
    setQuery: setSuggestionQuery,
    setType: setSuggestionType
  } = useComposerSearch();

  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Link input state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // Mention tracking
  const [confirmedMentionHandles, setConfirmedMentionHandles] = useState<Set<string>>(new Set());
  // Cache for source previews (for reading mode preview)
  const [referenceMetadata, setReferenceMetadata] = useState<Record<string, { title?: string }>>({});
  // We need full objects for preview rendering (images etc)
  // We'll store them in a map: id -> Post object, slug -> Topic object
  const [sourcePreviews, setSourcePreviews] = useState<{
    postById: Record<string, Post>;
    topicBySlug: Record<string, any>;
  }>({ postById: {}, topicBySlug: {} });

  const normalizeTopicSlug = (slug: string) => slug.toLowerCase().replace(/\s+/g, '-');

  // Fetch metadata for references in body (for preview)
  useEffect(() => {
    // 1. Extract IDs/slugs
    const postIds = new Set<string>();
    const topicSlugs = new Set<string>();

    for (const m of body.matchAll(/\[\[post:([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      postIds.add(m[1]);
    }
    for (const m of body.matchAll(/\[\[(?!post:)([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      topicSlugs.add(normalizeTopicSlug(m[1].trim()));
    }

    // 2. Filter out already fetched
    const missingPosts = [...postIds].filter(id => !sourcePreviews.postById[id]);
    const missingTopics = [...topicSlugs].filter(slug => !sourcePreviews.topicBySlug[slug]);

    if (missingPosts.length === 0 && missingTopics.length === 0) return;

    // 3. Fetch
    const fetchMissing = async () => {
      try {
        const newPosts: Record<string, Post> = {};
        const newTopics: Record<string, any> = {};
        const newMeta: Record<string, { title?: string }> = {};

        await Promise.all([
          ...missingPosts.map(async id => {
            try {
              const { data } = await api.get(`/posts/${id}`);
              newPosts[id] = data;
              newMeta[id] = { title: data.title || 'Post' };
            } catch { } // Ignore errors for individual fetches
          }),
          ...missingTopics.map(async slug => {
            try {
              const { data } = await api.get(`/topics/${encodeURIComponent(slug)}`);
              newTopics[slug] = data;
            } catch { } // Ignore errors for individual fetches
          })
        ]);

        setSourcePreviews(prev => ({
          postById: { ...prev.postById, ...newPosts },
          topicBySlug: { ...prev.topicBySlug, ...newTopics }
        }));
        setReferenceMetadata(prev => ({ ...prev, ...newMeta }));
      } catch (e) {
        console.error('Failed to fetch preview metadata', e);
      }
    };

    // Debounce slightly to avoid excessive calls if body changes rapidly
    const timer = setTimeout(fetchMissing, 1000);
    return () => clearTimeout(timer);
  }, [body]);


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
      const asset = result.assets[0];
      setHeaderImage(asset.uri);
      setHeaderImageAsset(asset);
      setUploadedHeaderKey(null);
      setUploadedHeaderBlurhash(undefined);
      setHeaderUploadError(null);
      setHeaderUploading(true);
      const uploadId = ++headerUploadIdRef.current;
      api
        .upload('/upload/header-image', asset)
        .then((res: { key?: string; url?: string; blurhash?: string }) => {
          if (uploadId !== headerUploadIdRef.current) return;
          setUploadedHeaderKey(res?.key ?? null);
          setUploadedHeaderBlurhash(res?.blurhash);
          setHeaderUploadError(null);
        })
        .catch((err: any) => {
          if (uploadId !== headerUploadIdRef.current) return;
          setHeaderUploadError(err?.message ?? t('compose.imageUploadFailed', 'Image failed to upload'));
        })
        .finally(() => {
          if (uploadId === headerUploadIdRef.current) setHeaderUploading(false);
        });
    }
  };

  const removeHeaderImage = () => {
    const key = uploadedHeaderKeyRef.current;
    if (key) {
      api.post('/upload/abandon', { key }).catch(() => { });
    }
    setHeaderImage(null);
    setHeaderImageAsset(null);
    setUploadedHeaderKey(null);
    setUploadedHeaderBlurhash(undefined);
    setHeaderUploadError(null);
  };

  // On unmount: delete uploaded image if user left without publishing
  useEffect(() => {
    return () => {
      const key = uploadedHeaderKeyRef.current;
      if (key && publishedWithHeaderKeyRef.current !== key) {
        api.post('/upload/abandon', { key }).catch(() => { });
      }
    };
  }, []);

  const insertText = (text: string) => {
    const newBody = body.slice(0, selection.start) + text + body.slice(selection.end);
    const newCursorPos = selection.start + text.length;
    setBody(newBody);
    // setTimeout to ensure state update renders before selection update (React Native quirk)
    setTimeout(() => setSelection({ start: newCursorPos, end: newCursorPos }), 0);
  };

  const formatSelection = (type: 'bold' | 'italic' | 'quote' | 'list' | 'ordered-list' | 'code') => {
    const selectedText = body.slice(selection.start, selection.end);
    let newText = '';
    let newSelection = selection;

    switch (type) {
      case 'bold':
        newText = `**${selectedText || 'bold'}**`;
        break;
      case 'italic':
        newText = `_${selectedText || 'italic'}_`;
        break;
      case 'quote':
        newText = `> ${selectedText || 'quote'}`;
        break;
      case 'list':
        newText = `
- ${selectedText || 'item'}`;
        break;
      case 'ordered-list':
        newText = `
1. ${selectedText || 'item'}`;
        break;
      case 'code':
        newText = `
\`${selectedText || 'code'}\`
`;
        break;
    }

    const newBody = body.slice(0, selection.start) + newText + body.slice(selection.end);
    setBody(newBody);
    // Determine new cursor position: if text was selected, wrap it. If empty, place cursor inside.
    if (selectedText) {
      // Cursor at end of inserted block
      const endPos = selection.start + newText.length;
      setTimeout(() => setSelection({ start: endPos, end: endPos }), 0);
    } else {
      // Cursor inside markers
      let offset = 0;
      if (type === 'bold') offset = 2;
      else if (type === 'italic') offset = 1;
      else if (type === 'code') offset = 1;
      else if (type === 'quote') offset = 2;
      else if (type === 'list') offset = 3;
      else if (type === 'ordered-list') offset = 4;

      const cursor = selection.start + offset + (type === 'bold' || type === 'italic' || type === 'code' ? 0 : (type === 'quote' || type === 'list' || type === 'ordered-list' ? 5 : 0)); // simple Approx 
      // Actually simpler: just put cursor at end for now to avoid complexity
      const endPos = selection.start + newText.length;
      setTimeout(() => setSelection({ start: endPos, end: endPos }), 0);
    }
  };

  const openLinkInput = () => {
    // If text selected, use it as display text
    const selected = body.slice(selection.start, selection.end);
    if (selected) setLinkText(selected);
    setShowLinkInput(true);
  };

  /** Ensure URL has http:// or https:// so the renderer recognizes it as a link */
  const ensureUrlScheme = (url: string) => {
    const u = url.trim();
    if (!u) return u;
    if (/^https?:\/\//i.test(u)) return u;
    return 'https://' + u;
  };

  const addLink = () => {
    const raw = (linkUrl || '').trim();
    if (!raw) return;
    const url = ensureUrlScheme(raw);
    const text = linkText || url;
    const markdown = `[${text}](${url})`;
    // Replace selection or insert
    const newBody = body.slice(0, selection.start) + markdown + body.slice(selection.end);
    setBody(newBody);
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
    const newPos = selection.start + markdown.length;
    setTimeout(() => setSelection({ start: newPos, end: newPos }), 0);
  };

  const hasOverlongHeading = (text: string) => {
    const lines = text.split('\n');
    for (const line of lines) {
      if (/^#{1,3}\s/.test(line)) {
        // Strip markers
        const content = line.replace(/^#{1,3}\s/, '').trim();
        // Strip internal markdown for length check (approximate)
        const stripped = content.replace(/\`\[\[.*?\|?.*?\|?\]\]/g, 'L').replace(/\`\[.*?\].*?\)/g, 'L');
        if (stripped.length > TITLE_MAX_LENGTH) return true;
      }
    }
    return false;
  };

  const hasOverlongRefTitle = (text: string) => {
    // Check [[Title|Alias]]
    const wikiRegex = /\`\[\[([^\|\}\]]+)(?:\|([^\|\}\]]*))?\]\]/g;
    let m;
    while ((m = wikiRegex.exec(text)) !== null) {
      const display = m[2] || m[1];
      if (display.length > TITLE_MAX_LENGTH) return true;
    }
    // Check [Title](url)
    const linkRegex = /\`\[([^\]]*)\]\([^)]+\)/g;
    while ((m = linkRegex.exec(text)) !== null) {
      if (m[1].length > TITLE_MAX_LENGTH) return true;
    }
    return false;
  };

  const enforceTitleAndAliasLimits = (text: string, limit: number) => {
    // Only enforce on H1/H2/H3 and [[|alias]] and [text](url)
    // We won't auto-truncate while typing as it's annoying, but we will warn on publish.
    // However, the requirement says "Headlines... and link/wikilink aliases" are limited.
    // Let's rely on validation on publish to avoid fighting the user's cursor.
    return text;
  };

  const handlePublish = async () => {
    if (!body.trim()) return;
    if (isPublishing) return;

    if (headerImageAsset) {
      if (headerUploading) {
        showError(t('compose.imageUploadingWait', 'Please wait for the image to finish uploading.'));
        return;
      }
      if (headerUploadError) {
        showError(headerUploadError);
        return;
      }
      if (!uploadedHeaderKey) {
        showError(t('compose.imageUploadingWait', 'Please wait for the image to finish uploading.'));
        return;
      }
    }

    // Validate lengths again
    if (hasOverlongHeading(body)) {
      showError(t('compose.headingTooLong'));
      return;
    }
    if (hasOverlongRefTitle(body)) {
      showError(t('compose.linkTagTitleTooLong'));
      return;
    }

    setIsPublishing(true);
    setPendingPublish(false); // Hide preview/confirm modal while sending
    setPreviewMode(false);

    const imageKey = uploadedHeaderKey ?? undefined;
    const imageBlurhash = uploadedHeaderBlurhash;

    try {
      setPublishPhase('publishing');
      const bodyToPublish = body.trim();

      let res;
      if (quotePostId) {
        res = await api.post(`/posts/${quotePostId}/quote`, {
          body: bodyToPublish,
          headerImageKey: imageKey,
          headerImageBlurhash: imageBlurhash
        });
      } else if (replyToPostId) {
        // Reply endpoint usually: POST /posts/:id/reply
        res = await api.post(`/posts/${replyToPostId}/reply`, {
          body: bodyToPublish
          // Replies usually don't have header images in this spec?
          // "You can allow one photo per post... article posts...". 
          // Replies are posts too. Let's allow it if API supports it.
          // If API reply schema doesn't support headerImage, we should warn or hide UI.
          // Assuming simplified reply for now.
        });
      } else {
        res = await api.post('/posts', {
          body: bodyToPublish,
          headerImageKey: imageKey,
          headerImageBlurhash: imageBlurhash,
          visibility: 'PUBLIC', // or from state
        });
      }

      clearDraft(draftKey); // Clear draft on success
      if (imageKey) publishedWithHeaderKeyRef.current = imageKey;

      showSuccess(t('compose.publishedSuccess', 'Published successfully'));

      // Navigate away (do not open the quoted/reply post; just go back)
      router.back();

    } catch (error: any) {
      console.error('Failed to publish', error);
      showError(t('compose.error', 'Failed to publish. Please try again.'));
    } finally {
      setIsPublishing(false);
      setPublishPhase('idle');
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
        if (!query.includes('[[')) {
          // Trailing space = mention complete (e.g. after selecting a user), close and don't re-open
          if (query.endsWith(' ')) {
            if (suggestionType !== 'none') {
              setSuggestionType('none');
              clearSearch();
            }
            return;
          }
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
      // ]] or newline = reference complete (e.g. after selecting), close and don't re-open
      if (query.includes(']]') || query.includes('\n')) {
        if (suggestionType !== 'none') {
          setSuggestionType('none');
          clearSearch();
        }
        return;
      }
      if (suggestionType !== 'topic') setSuggestionType('topic');
      search(query, 'topic');
      return;
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
      const truncateAlias = (s: string) => (s || '').slice(0, TITLE_MAX_LENGTH).replace(/\ G]/g, '');
      if (item.type === 'post') {
        const alias = truncateAlias(item.displayName || item.title || 'Post');
        insertion = `[[post:${item.id}|${alias}]] `;
      } else {
        const alias = truncateAlias(item.slug || item.title || '');
        insertion = `[[${alias}]] `;
      }
    }

    if (triggerIndex !== -1) {
      const newBody = beforeCursor.substring(0, triggerIndex) + insertion + afterCursor;
      const newCursorPos = triggerIndex + insertion.length;
      setBody(newBody);
      setSelection({ start: newCursorPos, end: newCursorPos });
      if (suggestionType === 'mention' && item.handle) {
        setConfirmedMentionHandles((prev) => new Set(prev).add(item.handle));
      }
    }
    setSuggestionType('none');
    clearSearch();
  };

  // --- Components ---

  const SuggestionsView = () => {
    if (suggestionType === 'none') return null;
    let list: any[] = suggestionType === 'mention'
      ? suggestions.filter((item: any) => (item.id !== userId && !item.handle?.startsWith?.('__pending_')))
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
    const topics = suggestionType === 'topic' ? list.filter((i: any) => i.type === 'topic') : [];
    const posts = suggestionType === 'topic' ? list.filter((i: any) => i.type === 'post') : [];
    const showSections = suggestionType === 'topic' && (topics.length > 0 && posts.length > 0);

    if (list.length === 0) {
      return (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsPlaceholder}>{t('compose.startTypingToSeeSuggestions', 'Start typing to see suggestions')}</Text>
        </View>
      );
    }

    const formatPostSuggestionSubtext = (post: { authorHandle?: string; authorDisplayName?: string; createdAt?: string; quoteCount?: number; replyCount?: number }) => {
      const author = post.authorDisplayName || (post.authorHandle ? `@${post.authorHandle}` : null);
      const dateStr = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : null;
      const quotesLabel = (post.quoteCount ?? 0) > 0 ? t('compose.quotesCount', '{{count}} quotes', { count: post.quoteCount }) : null;
      return [author, dateStr, quotesLabel].filter(Boolean).join(' · ') || t('compose.post', 'Post');
    };

    const renderSuggestionItem = (item: any) => (
      <Pressable key={`${item.type}-${item.id ?? item.slug}`} style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)}>
        <View style={styles.suggestionIcon}>
          {suggestionType === 'mention' ? (
            <Avatar
              size={40}
              uri={getAvatarUri({ avatarKey: item.avatarKey, avatarUrl: item.avatarUrl })}
              name={(item.displayName || item.handle) ?? ''}
            />
          ) : item.type === 'post' && (item.headerImageKey || item.headerImageUrl) ? (
            <ExpoImage
              source={{ uri: item.headerImageKey ? getImageUrl(item.headerImageKey) : item.headerImageUrl }}
              style={styles.suggestionPostImage}
              contentFit="cover"
            />
          ) : item.type === 'post' ? (
            <MaterialIcons name="article" size={HEADER.iconSize} color={COLORS.primary} />
          ) : (
            <MaterialIcons name="tag" size={HEADER.iconSize} color={COLORS.primary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.suggestionText} numberOfLines={1}>{item.displayName || item.title || item.slug}</Text>
          <Text style={styles.suggestionSubText} numberOfLines={1}>
            {suggestionType === 'mention'
              ? `@${item.handle}`
              : item.type === 'post'
                ? formatPostSuggestionSubtext(item)
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
            {...FLATLIST_DEFAULTS}
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
      <Pressable style={styles.toolBtn} onPress={() => formatSelection('code')}><MaterialIcons name="code" size={HEADER.iconSize} color={COLORS.primary} /></Pressable>
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
        maxDisplayLength={TITLE_MAX_LENGTH}
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

  /** Heading (H1/H2/H3) count only for the line currently being edited (cursor position). */
  const currentLineHeadingInfo = useMemo(() => {
    const textBeforeCursor = body.slice(0, selection.start);
    const lines = body.split('\n');
    const lineIndex = Math.min(textBeforeCursor.split('\n').length - 1, lines.length - 1);
    if (lineIndex < 0) return null;
    const currentLine = lines[lineIndex] ?? '';
    let level: 'h1' | 'h2' | 'h3' | null = null;
    let content = '';
    if (currentLine.startsWith('### ')) {
      level = 'h3';
      content = currentLine.slice(4);
    } else if (currentLine.startsWith('## ')) {
      level = 'h2';
      content = currentLine.slice(3);
    } else if (currentLine.startsWith('# ')) {
      level = 'h1';
      content = currentLine.slice(2);
    }
    if (level == null) return null;
    const stripped = content
      .replace(/\s*\[\[[^\]]*\]\]\s*/g, '')
      .replace(/\s*@\S+\s*/g, '')
      .replace(/\s*\[[^\]]*\]\([^)]*\)\s*/g, '')
      .trim();
    return { level, length: stripped.length };
  }, [body, selection.start]);

  /** Unique tag refs ([[post:id]] + [[topic]]) for Ref count and limit; each distinct post/topic counts once (case-insensitive). */
  const topicRefCount = useMemo(() => {
    const seenPost = new Set<string>();
    const seenTopic = new Set<string>();
    for (const m of body.matchAll(/\[\[post:([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      seenPost.add(m[1].toLowerCase());
    }
    for (const m of body.matchAll(/\[\[(?!post:)([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      seenTopic.add(m[1].trim().toLowerCase());
    }
    return seenPost.size + seenTopic.size;
  }, [body]);

  /** Longest heading (H1/H2/H3) content length and longest link/tag alias length; max of both for "titles" limit. */
  const { maxTitleLength } = useMemo(() => {
    let maxHeading = 0;
    const lines = body.split('\n');
    for (const line of lines) {
      let content = '';
      if (line.startsWith('### ')) content = line.slice(4).trim();
      else if (line.startsWith('## ')) content = line.slice(3).trim();
      else if (line.startsWith('# ')) content = line.slice(2).trim();
      if (content.length > maxHeading) maxHeading = content.length;
    }
    let maxAlias = 0;
    const wikiRegex = /\`\[\[([^\|\}\]]+)(?:\|([^\|\}\]]*))?\]\]/g;
    let m;
    while ((m = wikiRegex.exec(body)) !== null) {
      const displayPart = m[2] !== undefined ? m[2] : m[1];
      if (displayPart.length > maxAlias) maxAlias = displayPart.length;
    }
    const linkRegex = /\`\[([^\]]*)\]\([^)]+\)/g;
    while ((m = linkRegex.exec(body)) !== null) {
      if (m[1].length > maxAlias) maxAlias = m[1].length;
    }
    const maxTitleLength = Math.max(maxHeading, maxAlias);
    return { maxHeading, maxAlias, maxTitleLength };
  }, [body]);

  const previewPost = useMemo(() => {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const author = meUser
      ? { id: meUser.id, handle: meUser.handle, displayName: meUser.displayName, avatarKey: meUser.avatarKey ?? undefined, avatarUrl: meUser.avatarUrl ?? undefined }
      : { id: userId ?? 'preview', handle: 'me', displayName: t('compose.previewAuthor', 'Me'), avatarKey: undefined, avatarUrl: undefined };
    const p: Post = {
      id: 'preview',
      body,
      title: sanitizedTitle || undefined,
      author,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      quoteCount: 0,
      visibility: 'PUBLIC',
      readingTimeMinutes,
    };
    (p as any).referenceMetadata = referenceMetadata;
    return p;
  }, [body, sanitizedTitle, referenceMetadata, userId, meUser, t]);

  /** Sources derived from body for preview: [[post:id]], [[topic]], @handle, [text](url). One entry per unique source (same as sourceCount). */
  const previewSources = useMemo(() => {
    const list: Array<{ type: 'post' | 'topic' | 'user' | 'external'; id?: string; title?: string; url?: string; slug?: string; handle?: string }> = [];
    const seenPost = new Set<string>();
    const seenTopic = new Set<string>();
    const seenUser = new Set<string>();
    const seenUrl = new Set<string>();

    // [[post:id|alias]] — one per post id (case-insensitive)
    for (const m of body.matchAll(/\[\[post:([^\|\]]+)(?:\|([^\|\]]*))?\]\]/g)) {
      const id = m[1];
      const key = id.toLowerCase();
      if (seenPost.has(key)) continue;
      seenPost.add(key);
      const alias = m[2]?.trim();
      const title = referenceMetadata[id]?.title || alias || 'Post';
      list.push({ type: 'post', id, title });
    }

    // [[Topic]] or [[Topic|alias]] — one per topic slug (case-insensitive)
    for (const m of body.matchAll(/\[\[(?!post:)([^\|\]]+)(?:\|([^\|\]]*))?\]\]/g)) {
      const slug = m[1].trim();
      const key = slug.toLowerCase();
      if (seenTopic.has(key)) continue;
      seenTopic.add(key);
      const title = m[2]?.trim() || slug;
      list.push({ type: 'topic', slug, title });
    }

    // @handle — one per user (case-insensitive; tagging same person twice = one source)
    for (const m of body.matchAll(/@([a-zA-Z0-9_.]+)/g)) {
      const handle = m[1];
      const key = handle.toLowerCase();
      if (seenUser.has(key)) continue;
      seenUser.add(key);
      list.push({ type: 'user', handle, title: `@${handle}` });
    }

    // [text](url) — one per url
    for (const m of body.matchAll(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g)) {
      const url = m[2].trim();
      if (seenUrl.has(url)) continue;
      seenUrl.add(url);
      const title = m[1]?.trim() || url;
      list.push({ type: 'external', title, url });
    }

    return list;
  }, [body, referenceMetadata]);

  /** Count of unique sources for limit (each person/topic/post/url counts once, case-insensitive where applicable). */
  const sourceCount = useMemo(() => {
    const seenPost = new Set<string>();
    const seenTopic = new Set<string>();
    const seenUser = new Set<string>();
    const seenUrl = new Set<string>();
    for (const m of body.matchAll(/\[\[post:([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      seenPost.add(m[1].toLowerCase());
    }
    for (const m of body.matchAll(/\[\[(?!post:)([^\|\]]+)(?:\|[^\|\]]*)?\]\]/g)) {
      seenTopic.add(m[1].trim().toLowerCase());
    }
    for (const m of body.matchAll(/@([a-zA-Z0-9_.]+)/g)) {
      seenUser.add(m[1].toLowerCase());
    }
    for (const m of body.matchAll(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g)) {
      seenUrl.add(m[2].trim());
    }
    return seenPost.size + seenTopic.size + seenUser.size + seenUrl.size;
  }, [body]);

  const publishOverlayMessage = t('compose.publishing', 'Publishing…');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ImageVerifyingOverlay visible={isPublishing} message={publishOverlayMessage} />

      <ScreenHeader
        title=""
        paddingTop={insets.top}
        right={
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setPreviewMode(true)}
              style={[styles.previewBtn, (!body.trim() || body.trim().length < BODY_MIN_LENGTH) && styles.previewBtnDisabled]}
              disabled={!body.trim() || body.trim().length < BODY_MIN_LENGTH}
              accessibilityLabel={t('compose.preview')}
              accessibilityRole="button"
            >
              <Text style={[headerRightCancelStyle, (!body.trim() || body.trim().length < BODY_MIN_LENGTH) && styles.previewBtnTextDisabled]}>
                {t('compose.preview', 'Preview')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const trimmed = body.trim();
                if (!trimmed) return;
                if (trimmed.length < BODY_MIN_LENGTH) {
                  showError(t('compose.bodyTooShort', 'Post must be at least {{min}} characters.', { min: BODY_MIN_LENGTH }));
                  return;
                }
                if (trimmed.length > BODY_MAX_LENGTH) {
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
                if (sourceCount > MAX_SOURCES) {
                  showError(t('compose.tooManySources', 'Too many sources. Maximum {{max}} per post.', { max: MAX_SOURCES }));
                  return;
                }
                if (hasOverlongHeading(body.trim())) {
                  showError(t('compose.headingTooLong', 'Headings (H1, H2, H3) must be at most {{max}} characters.', { max: TITLE_MAX_LENGTH }));
                  return;
                }
                if (hasOverlongRefTitle(body.trim())) {
                  showError(t('compose.linkTagTitleTooLong', 'Link and tag titles must be at most {{max}} characters.', { max: TITLE_MAX_LENGTH }));
                  return;
                }
                setPreviewMode(true);
                setPendingPublish(true);
              }}
              disabled={!body.trim() || body.trim().length < BODY_MIN_LENGTH || isPublishing}
              style={[styles.publishBtn, (!body.trim() || body.trim().length < BODY_MIN_LENGTH || isPublishing) && styles.publishBtnDisabled]}
            >
              <Text style={styles.publishText}>
                {isPublishing ? t('compose.publishing', 'Posting...') : t('compose.publish', 'Publish')}
              </Text>
            </Pressable>
          </View>
        }
      />

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
            <View style={styles.headerImagePreviewRow}>
              <Image source={{ uri: headerImage }} style={styles.headerImageThumb} resizeMode="cover" />
              <Text
                style={[styles.headerImageLabel, headerUploadError && styles.headerImageLabelError]}
                numberOfLines={1}
              >
                {headerUploading
                  ? t('common.verifyingImage', 'Uploading & verifying image…')
                  : headerUploadError
                    ? headerUploadError
                    : t('compose.headerImageAttached', 'Header image attached')}
              </Text>
              <Pressable style={styles.removeImgBtn} onPress={removeHeaderImage}>
                <MaterialIcons name="close" size={18} color="white" />
              </Pressable>
            </View>
          )}

          {!previewMode && (
            <TextInput
              ref={textInputRef}
              style={styles.input}
              placeholder={t('compose.placeholderWithMarkdown', 'Start writing...')}
              placeholderTextColor={COLORS.tertiary}
              multiline
              scrollEnabled={false}
              value={body}
              onChangeText={(text: string) => setBody(enforceTitleAndAliasLimits(text, TITLE_MAX_LENGTH))}
              onSelectionChange={(e: { nativeEvent: { selection: { start: number; end: number } } }) => setSelection(e.nativeEvent.selection)}
              autoFocus
            />
          )}
        </ScrollView>
      </Pressable>

      {/* Preview modal: rendered outside ScrollView so layout is correct */}
      {previewMode && (
        <Modal visible={true} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
          <View
            style={[
              styles.previewFullscreen,
              {
                paddingBottom: insets.bottom,
                width: screenWidth,
                minHeight: screenHeight,
              },
            ]}
          >
            {/* Header bar: same layout as ScreenHeader / reading overlay (back + title + right) */}
            <View style={[styles.previewHeader, { paddingTop: insets.top }]}>
              <View style={styles.previewHeaderRow}>
                <HeaderIconButton
                  onPress={() => { setPreviewMode(false); setPendingPublish(false); }}
                  icon="close"
                  accessibilityLabel={t('common.close')}
                />
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {pendingPublish ? t('compose.confirmPublish', 'Confirm & Publish') : t('compose.preview', 'Preview')}
                </Text>
                {pendingPublish ? (
                  <Pressable
                    style={[styles.previewHeaderSide, styles.previewHeaderSideRight, styles.previewPublishBtn, isPublishing && styles.previewPublishBtnDisabled]}
                    onPress={handlePublish}
                    disabled={isPublishing}
                    accessibilityLabel={t('compose.confirmPublish')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.previewPublishText}>
                      {isPublishing ? t('compose.publishing', 'Publishing...') : t('compose.publish')}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.previewHeaderSide, styles.previewHeaderSideRight]} />
                )}
              </View>
            </View>
            {/* Preview: same layout as reading screen (hero, article, actions, sources) */}
            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={[
                styles.previewScrollContent,
                { paddingBottom: 80, flexGrow: 1 },
                !headerImage && {
                  paddingTop: insets.top + 40 + toDimension(HEADER.barPaddingBottom) + toDimension(SPACING.s),
                },
              ]}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
            >
              {/* Hero: full-width cover like reading (only when header image set) */}
              {headerImage && (
                <View style={[styles.previewHeroWrap, { width: screenWidth, height: screenWidth * (3 / 4) }]}>
                  <ExpoImage
                    source={{ uri: headerImage }}
                    style={[styles.previewHeroImage, { width: screenWidth, height: screenWidth * (3 / 4) }]}
                    contentFit="cover"
                  />
                  {sanitizedTitle ? (
                    <View style={styles.previewHeroTitleOverlay}>
                      <Text style={styles.previewHeroTitleText} numberOfLines={2}>{sanitizedTitle}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={styles.previewArticle}>
                {/* Author line (same as reading) */}
                <View style={styles.previewAuthorLine}>
                  {getAvatarUri(previewPost.author) ? (
                    <ExpoImage source={{ uri: getAvatarUri(previewPost.author)! }} style={styles.previewAuthorAvatarImage} />
                  ) : (
                    <View style={styles.previewAuthorAvatar}>
                      <Text style={styles.previewAvatarText}>
                        {previewPost.author?.displayName?.charAt(0) || previewPost.author?.handle?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewAuthorName}>{previewPost.author?.displayName || previewPost.author?.handle || t('compose.previewAuthor', 'Me')}</Text>
                    <Text style={styles.previewReadTime}>
                      {new Date(previewPost.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                {/* Title only when no hero (hero already shows title) */}
                {(!headerImage && sanitizedTitle) ? (
                  <Text style={styles.previewArticleTitle}>{sanitizedTitle}</Text>
                ) : null}

                <MarkdownText stripLeadingH1IfMatch={sanitizedTitle ?? undefined} referenceMetadata={referenceMetadata}>{body}</MarkdownText>

                {/* Action row: same icons as reading (non-interactive in preview) */}
                <View style={styles.previewActionsRow}>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="favorite-border" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="format-quote" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="bookmark-border" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="add-circle-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                  <View style={styles.previewActionBtn}>
                    <MaterialIcons name="ios-share" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                </View>
              </View>

              {/* Sources section (same layout as reading: tab + list or empty) */}
              <View style={styles.previewSection}>
                <View style={styles.previewTabsRow}>
                  <View style={[styles.previewTabBtn, styles.previewTabBtnActive]}>
                    <Text style={[styles.previewTabBtnText, styles.previewTabBtnTextActive]}>{t('post.sources', 'Sources')}</Text>
                  </View>
                </View>
                {previewSources.length === 0 ? (
                  <Text style={styles.previewEmptyText}>{t('post.noSources', 'No tagged sources in this post.')}</Text>
                ) : (
                  <View style={styles.previewSourcesList}>
                    {previewSources.map((source: any, index: number) => {
                      const title = source.title || source.url || source.slug || source.handle || '';
                      const subtitle =
                        source.type === 'external' && source.url
                          ? (() => {
                              try {
                                return new URL(source.url).hostname.replace('www.', '');
                              } catch {
                                return '';
                              }
                            })()
                          : source.type === 'topic'
                            ? t('post.topic', 'Topic')
                            : source.type === 'user' && source.handle
                              ? `@${source.handle}`
                              : '';
                      return (
                        <View
                          key={source.type === 'external' && source.url ? `ext-${source.url}` : (source.id ?? source.handle ?? source.slug ?? `i-${index}`)}
                          style={styles.previewSourceCard}
                        >
                          <View style={styles.previewSourceCardLeft}>
                            {source.type === 'user' ? (
                              <View style={styles.previewSourceAvatar}>
                                <Text style={styles.previewSourceAvatarText}>
                                  {(source.title || source.handle || '?').charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.previewSourceIconWrap}>
                                <MaterialIcons
                                  name={source.type === 'post' ? 'article' : source.type === 'topic' ? 'tag' : 'link'}
                                  size={HEADER.iconSize}
                                  color={COLORS.primary}
                                />
                              </View>
                            )}
                            <View style={styles.previewSourceCardText}>
                              <Text style={styles.previewSourceCardTitle} numberOfLines={1}>{title}</Text>
                              {subtitle ? <Text style={styles.previewSourceCardSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
                            </View>
                          </View>
                          <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Footer: char count (bottom right) then context bar (toolbar or link overlay) */}
      {!previewMode && (
        <View style={styles.footer} pointerEvents="box-none">
          <SuggestionsView />
          <View style={styles.charCountRow}>
            {currentLineHeadingInfo ? (
              <Text style={styles.charCount}>
                {currentLineHeadingInfo.level === 'h1' ? t('compose.headline', 'Headline') : currentLineHeadingInfo.level.toUpperCase()}: {currentLineHeadingInfo.length} / {TITLE_MAX_LENGTH}
              </Text>
            ) : <View />}
            <Text style={[styles.charCount, styles.charCountRight]} numberOfLines={1}>
              {body.trim().length < BODY_MIN_LENGTH
                ? t('compose.charCountMinMax', '{{current}} / {{min}}–{{max}}', { current: body.trim().length, min: BODY_MIN_LENGTH, max: BODY_MAX_LENGTH.toLocaleString() })
                : t('compose.charCount', '{{current}} / {{max}}', { current: body.trim().length, max: BODY_MAX_LENGTH.toLocaleString() })}
              {topicRefCount > 0 ? ` · ${t('compose.refs', 'Refs')} ${topicRefCount}/${MAX_TOPIC_REFS}` : ''}
              {` · ${t('compose.sourcesCount', 'Sources {{used}}/{{max}}', { used: sourceCount, max: MAX_SOURCES })}`}
            </Text>
          </View>
          {linkInputEl}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  previewBtn: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBtnDisabled: { opacity: 0.5 },
  previewBtnTextDisabled: { color: COLORS.tertiary },
  publishBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnDisabled: { opacity: 0.5 },
  publishText: { color: COLORS.ink, fontWeight: '600', fontSize: 16 },

  editorContainer: { flex: 1, padding: SPACING.l },
  input: { fontSize: 18, color: COLORS.paper, lineHeight: 26, textAlignVertical: 'top', minHeight: 200 },

  quoteBox: { backgroundColor: COLORS.hover, padding: SPACING.m, borderRadius: 8, marginBottom: SPACING.xs, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  quoteTitle: { color: COLORS.paper, fontWeight: '600', marginBottom: 4 },
  quoteBody: { color: COLORS.secondary },
  quoteHint: { fontSize: 12, color: COLORS.tertiary, marginBottom: SPACING.m, fontStyle: 'italic' },

  headerImagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    gap: SPACING.m,
  },
  headerImageThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.divider,
  },
  headerImageLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  headerImageLabelError: {
    color: COLORS.error,
  },
  removeImgBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
  },

  footer: { backgroundColor: COLORS.ink, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.s },

  charCountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.l, paddingBottom: 4 },
  charCount: { fontSize: 12, color: COLORS.tertiary },
  charCountRight: { textAlign: 'right' },

  toolbar: { flexDirection: 'row', padding: SPACING.s },
  toolBtn: { padding: 8, borderRadius: 4, marginRight: 4, backgroundColor: COLORS.hover, minWidth: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  toolText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  divider: { width: 1, height: 24, backgroundColor: COLORS.divider, marginHorizontal: 8, alignSelf: 'center' },

  suggestionsContainer: { maxHeight: 280, borderBottomWidth: 1, borderBottomColor: COLORS.divider, backgroundColor: COLORS.ink, paddingHorizontal: SPACING.m, paddingTop: SPACING.s },
  suggestionsPlaceholder: { fontSize: 14, color: COLORS.tertiary, textAlign: 'center', paddingVertical: SPACING.l, fontFamily: FONTS.regular },
  suggestionsScroll: { maxHeight: 280 },
  suggestionSectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.tertiary, marginTop: SPACING.m, marginBottom: SPACING.xs, marginHorizontal: SPACING.l, textTransform: 'uppercase' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.l, borderBottomWidth: 1, borderBottomColor: COLORS.hover, gap: 16 },
  suggestionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.hover, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  suggestionPostImage: { width: 40, height: 40, borderRadius: 8 },
  suggestionAvatarText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  suggestionText: { color: COLORS.paper, fontSize: 16, fontWeight: '600' },
  suggestionSubText: { color: COLORS.secondary, fontSize: 13 },

  linkInputWrap: { backgroundColor: COLORS.ink },
  linkInputContainer: { padding: SPACING.m, paddingBottom: SPACING.xl },
  linkInputRow: { flexDirection: 'row', gap: 8 },
  linkField: { flex: 1, backgroundColor: COLORS.hover, color: COLORS.paper, padding: 12, borderRadius: 8, fontSize: 16 },
  linkDisplayField: { marginTop: 8, marginBottom: SPACING.m, minHeight: 56, textAlignVertical: 'top' },
  linkAddButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, justifyContent: 'center' },
  linkCloseButton: { backgroundColor: COLORS.hover, padding: 12, borderRadius: 8, justifyContent: 'center' },

  previewFullscreen: { flex: 1, backgroundColor: COLORS.ink },
  previewHeader: {
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    backgroundColor: COLORS.ink,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  /** Left/right slots: same size as ScreenHeader and reading overlay so buttons align across app */
  previewHeaderSide: {
    minWidth: headerIconCircleSize + headerIconCircleMarginH * 2,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeaderSideRight: {
    justifyContent: 'flex-end',
  },
  previewTitle: {
    flex: 1,
    fontSize: HEADER.titleSize,
    fontFamily: FONTS.semiBold,
    color: COLORS.paper,
    textAlign: 'center',
  },
  previewPublishBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPublishBtnDisabled: { opacity: 0.5 },
  previewPublishText: {
    color: COLORS.ink,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  previewScroll: { flex: 1, backgroundColor: COLORS.ink },
  previewScrollContent: { backgroundColor: COLORS.ink },
  previewSection: {
    marginTop: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  /* Reading-style hero (full width, 4:3) */
  previewHeroWrap: {
    alignSelf: 'center',
    marginBottom: SPACING.l,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  previewHeroImage: {
    width: '100%',
    backgroundColor: COLORS.divider,
  },
  previewHeroTitleOverlay: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.l,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewHeroTitleText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
  },
  /* Article block (author, title, body, actions) – matches reading.tsx */
  previewArticle: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
  },
  previewAuthorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  previewAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAuthorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  previewAvatarText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  previewAuthorName: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  previewReadTime: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  previewArticleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
    marginBottom: SPACING.xl,
  },
  previewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.s,
    paddingRight: SPACING.l,
    paddingBottom: SPACING.s,
    marginTop: SPACING.xl,
  },
  previewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
  },
  previewTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  previewTabBtn: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginRight: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  previewTabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  previewTabBtnText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  previewTabBtnTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  previewEmptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  previewSourcesList: {
    gap: SPACING.s,
  },
  previewSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  previewSourceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  previewSourceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  previewSourceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  previewSourceAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  previewSourceCardText: {
    flex: 1,
    minWidth: 0,
  },
  previewSourceCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  previewSourceCardSubtitle: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
