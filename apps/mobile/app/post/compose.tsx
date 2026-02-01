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
import { api, getImageUrl } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/auth';
import { useComposerSearch } from '../../hooks/useComposerSearch';
import { MarkdownText } from '../../components/MarkdownText';
import { PostArticleBlock } from '../../components/PostArticleBlock';
import { Avatar } from '../../components/Avatar';
import { Post } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER, MODAL, LAYOUT, createStyles, FLATLIST_DEFAULTS } from '../../constants/theme';
import { Image as ExpoImage } from 'expo-image';

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

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const BODY_MAX_LENGTH = 10000;
  const BODY_MIN_LENGTH = 3; // Short minimum (e.g. "Yes." or "ok")
  const TITLE_MAX_LENGTH = 40; // Headlines (H1/H2/H3) and link/wikilink aliases
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
  /** Handles that were selected from the mention dropdown — only these render as @ mentions in preview. */
  const [confirmedMentionHandles, setConfirmedMentionHandles] = useState<Set<string>>(() => new Set());
  /** Source preview images for composer preview (post header/author avatar, topic image). */
  const [sourcePreviews, setSourcePreviews] = useState<{
    postById: Record<string, { headerImageKey?: string | null; authorAvatarKey?: string | null }>;
    topicBySlug: Record<string, { imageKey?: string | null }>;
  }>({ postById: {}, topicBySlug: {} });

  const textInputRef = useRef<TextInput>(null);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (quotePostId) loadQuotedPost(quotePostId);
    else if (replyToPostId) loadQuotedPost(replyToPostId);
  }, [quotePostId, replyToPostId]);

  function normalizeTopicSlug(s: string): string {
    return s.trim().toLowerCase().replace(/[^\w\-]+/g, '-');
  }

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

  // Load source preview images (header/avatar/topic image) when preview is shown
  useEffect(() => {
    if (!previewMode) return;
    const postIds: string[] = [];
    const topicSlugs: string[] = [];
    for (const m of body.matchAll(/\[\[post:([^\]|]+)(?:\|[^\]]*)?\]\]/g)) postIds.push(m[1]);
    for (const m of body.matchAll(/\[\[(?!post:)([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
      topicSlugs.push(normalizeTopicSlug(m[1]));
    }
    if (postIds.length === 0 && topicSlugs.length === 0) return;
    const q = new URLSearchParams();
    if (postIds.length) q.set('postIds', [...new Set(postIds)].join(','));
    if (topicSlugs.length) q.set('topicSlugs', [...new Set(topicSlugs)].join(','));
    api.get(`/posts/source-previews?${q.toString()}`).then((res: { posts?: Array<{ id: string; headerImageKey?: string | null; authorAvatarKey?: string | null }>; topics?: Array<{ slug: string; imageKey?: string | null }> }) => {
      const postById: Record<string, { headerImageKey?: string | null; authorAvatarKey?: string | null }> = {};
      (res.posts ?? []).forEach((p) => {
        postById[p.id] = { headerImageKey: p.headerImageKey ?? null, authorAvatarKey: p.authorAvatarKey ?? null };
      });
      const topicBySlug: Record<string, { imageKey?: string | null }> = {};
      (res.topics ?? []).forEach((t) => {
        topicBySlug[t.slug] = { imageKey: t.imageKey ?? null };
      });
      setSourcePreviews({ postById, topicBySlug });
    }).catch(() => { });
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

  /** Ranges that must not receive headings, bold or italic: wikilinks [[...]] and markdown links [text](url). */
  const getProtectedRanges = (text: string): { start: number; end: number }[] => {
    const ranges: { start: number; end: number }[] = [];
    // Wikilinks: [[...]] (articles, topic tags)
    const wikiRe = /\[\[[^\]]*\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = wikiRe.exec(text)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
    // Markdown links: [text](url) (sources)
    const linkRe = /\[[^\]]*\]\([^)]+\)/g;
    while ((m = linkRe.exec(text)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
    return ranges;
  };

  const selectionOverlapsProtected = (sel: { start: number; end: number }, ranges: { start: number; end: number }[]): boolean => {
    return ranges.some((r) => sel.start < r.end && sel.end > r.start);
  };

  /** Enforce max length for headline lines (H1/H2/H3) and for wikilink/link aliases. Stops new letters when limits are hit. */
  const enforceTitleAndAliasLimits = (text: string, maxLen: number): string => {
    let out = text.length <= BODY_MAX_LENGTH ? text : text.slice(0, BODY_MAX_LENGTH);
    const lines = out.split('\n');
    const trimmed: string[] = [];
    for (const line of lines) {
      if (line.startsWith('### ')) {
        trimmed.push('### ' + line.slice(4).slice(0, maxLen));
      } else if (line.startsWith('## ')) {
        trimmed.push('## ' + line.slice(3).slice(0, maxLen));
      } else if (line.startsWith('# ')) {
        trimmed.push('# ' + line.slice(2).slice(0, maxLen));
      } else {
        trimmed.push(line);
      }
    }
    out = trimmed.join('\n');
    // Wikilinks: [[x|alias]] or [[x]] – truncate alias or single part to maxLen
    out = out.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
      const pipeIdx = content.indexOf('|');
      if (pipeIdx >= 0) {
        const before = content.slice(0, pipeIdx);
        const alias = content.slice(pipeIdx + 1).slice(0, maxLen);
        return `[[${before}|${alias}]]`;
      }
      return `[[${content.slice(0, maxLen)}]]`;
    });
    // Markdown links: [text](url) – truncate text to maxLen
    out = out.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_, linkText, url) => `[${linkText.slice(0, maxLen)}](${url})`);
    return out;
  };

  const insertText = (text: string) => {
    const { start, end } = selection;
    const isHeading = text === '# ' || text === '## ' || text === '### ';
    let toInsert = text;
    let cursorOffset = text.length;
    if (isHeading) {
      const ranges = getProtectedRanges(body);
      const cursorInside = ranges.some((r) => start >= r.start && start <= r.end);
      const selectionOverlaps = selectionOverlapsProtected({ start, end }, ranges);
      if (cursorInside || selectionOverlaps) {
        showError(t('compose.formatNotAllowedOnRefs', 'Articles, topic tags and links cannot use headings, bold or italic.'));
        return;
      }
      // Ensure heading is on its own line: newline before # if not already at line start; cursor stays on same line after #
      const atLineStart = start === 0 || body[start - 1] === '\n';
      toInsert = (atLineStart ? '' : '\n') + text;
      cursorOffset = toInsert.length;
    }
    const newBody = body.substring(0, start) + toInsert + body.substring(end);
    setBody(newBody);

    const newPos = start + cursorOffset;
    setSelection({ start: newPos, end: newPos });
  };

  const formatSelection = (type: 'bold' | 'italic' | 'quote' | 'list' | 'ordered-list' | 'code') => {
    const { start, end } = selection;
    if (type === 'bold' || type === 'italic') {
      const ranges = getProtectedRanges(body);
      const sel = { start, end: end || start };
      if (selectionOverlapsProtected(sel, ranges)) {
        showError(t('compose.formatNotAllowedOnRefs', 'Articles, topic tags and links cannot use headings, bold or italic.'));
        return;
      }
    }
    const selectedText = body.substring(start, end);
    let newText = '';

    if (type === 'bold') newText = `**${selectedText || 'text'}**`;
    else if (type === 'italic') newText = `_${selectedText || 'text'}_`;
    else if (type === 'quote') newText = `> ${selectedText || 'quote'}`;
    else if (type === 'list') newText = `- ${selectedText || 'item'}`;
    else if (type === 'ordered-list') newText = `1. ${selectedText || 'item'}`;
    else if (type === 'code') newText = `\`${selectedText || 'code'}\``;

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

  /** Returns true if any heading line (# / ## / ### ) has content longer than TITLE_MAX_LENGTH. */
  const hasOverlongHeading = (text: string): boolean => {
    const lines = text.split('\n');
    for (const line of lines) {
      let content = '';
      if (line.startsWith('### ')) content = line.slice(4).trim();
      else if (line.startsWith('## ')) content = line.slice(3).trim();
      else if (line.startsWith('# ')) content = line.slice(2).trim();
      if (content.length > 0 && content.length > TITLE_MAX_LENGTH) return true;
    }
    return false;
  };

  /** Returns true if body contains a tag or link title longer than TITLE_MAX_LENGTH. */
  const hasOverlongRefTitle = (text: string): boolean => {
    const wikiRegex = /\[\[([^\]]+)(?:\|([^\]]*))?\]\]/g;
    let m;
    while ((m = wikiRegex.exec(text)) !== null) {
      const displayPart = m[2] !== undefined ? m[2] : m[1];
      if (displayPart.length > TITLE_MAX_LENGTH) return true;
    }
    const linkRegex = /\[([^\]]*)\]\([^)]+\)/g;
    while ((m = linkRegex.exec(text)) !== null) {
      if (m[1].length > TITLE_MAX_LENGTH) return true;
    }
    return false;
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
    let textToDisplay = linkText.trim() || (start !== end ? body.substring(start, end) : new URL(urlToUse).hostname);
    if (textToDisplay.length > TITLE_MAX_LENGTH) {
      showError(t('compose.linkTagTitleTooLong', 'Link and tag titles must be at most {{max}} characters.', { max: TITLE_MAX_LENGTH }));
      return;
    }

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
    if (trimmedBody.length < BODY_MIN_LENGTH) {
      showError(t('compose.bodyTooShort', 'Post must be at least {{min}} characters.', { min: BODY_MIN_LENGTH }));
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
    if (hasOverlongHeading(trimmedBody)) {
      showError(t('compose.headingTooLong', 'Headings (H1, H2, H3) must be at most {{max}} characters.', { max: TITLE_MAX_LENGTH }));
      return;
    }
    if (hasOverlongRefTitle(trimmedBody)) {
      showError(t('compose.linkTagTitleTooLong', 'Link and tag titles must be at most {{max}} characters.', { max: TITLE_MAX_LENGTH }));
      return;
    }
    setIsPublishing(true);
    setPendingPublish(false);
    setPreviewMode(false);
    try {
      // Strip @ from any mention that wasn't selected from dropdown (invalid) so stored post only has real mentions
      const bodyToPublish = trimmedBody.replace(/@([a-zA-Z0-9_.]+)/g, (_, handle) =>
        confirmedMentionHandles.has(handle) ? `@${handle}` : handle
      );

      let imageKey = null;
      let imageBlurhash = null;
      if (headerImageAsset) {
        const uploadRes = await api.upload('/upload/header-image', headerImageAsset);
        imageKey = uploadRes.key;
        imageBlurhash = uploadRes.blurhash;
      }

      if (quotePostId) {
        await api.post('/posts/quote', { postId: quotePostId, body: bodyToPublish });
      } else if (replyToPostId) {
        await api.post(`/posts/${replyToPostId}/replies`, { body: bodyToPublish });
      } else {
        await api.post('/posts', { body: bodyToPublish, headerImageKey: imageKey, headerImageBlurhash: imageBlurhash });
      }
      showSuccess(t('compose.publishedSuccess', 'Published successfully'));
      if (quotePostId) router.replace(`/post/${quotePostId}/reading`);
      else if (replyToPostId) router.replace(`/post/${replyToPostId}`);
      else router.back();
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
      const truncateAlias = (s: string) => (s || '').slice(0, TITLE_MAX_LENGTH).replace(/\]/g, '');
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
              uri={item.avatarKey ? getImageUrl(item.avatarKey) : item.avatarUrl}
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

  const topicRefMatches = body.match(/\[\[[^\]]*\]\]/g) || [];
  const topicRefCount = topicRefMatches.length;

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
    const wikiRegex = /\[\[([^\]]+)(?:\|([^\]]*))?\]\]/g;
    let m;
    while ((m = wikiRegex.exec(body)) !== null) {
      const displayPart = m[2] !== undefined ? m[2] : m[1];
      if (displayPart.length > maxAlias) maxAlias = displayPart.length;
    }
    const linkRegex = /\[([^\]]*)\]\([^)]+\)/g;
    while ((m = linkRegex.exec(body)) !== null) {
      if (m[1].length > maxAlias) maxAlias = m[1].length;
    }
    const maxTitleLength = Math.max(maxHeading, maxAlias);
    return { maxHeading, maxAlias, maxTitleLength };
  }, [body]);

  const previewPost = useMemo(() => {
    const p: Post = {
      id: 'preview',
      body,
      title: sanitizedTitle || undefined,
      author: {
        id: userId ?? 'preview',
        handle: 'me',
        displayName: t('compose.previewAuthor', 'Me'),
      },
      createdAt: new Date().toISOString(),
      replyCount: 0,
      quoteCount: 0,
      visibility: 'PUBLIC',
    };
    (p as any).referenceMetadata = referenceMetadata;
    return p;
  }, [body, sanitizedTitle, referenceMetadata, userId, t]);

  /** Sources derived from body for preview: [[post:id]], [[topic]], [text](url). Same shape as API getSources. */
  const previewSources = useMemo(() => {
    const list: Array<{ type: 'post' | 'topic' | 'external'; id?: string; title?: string; url?: string; slug?: string }> = [];
    const seenPost = new Set<string>();
    const seenTopic = new Set<string>();
    const seenUrl = new Set<string>();

    // [[post:id|alias]]
    for (const m of body.matchAll(/\[\[post:([^\]|]+)(?:\|([^\]]*))?\]\]/g)) {
      const id = m[1];
      if (seenPost.has(id)) continue;
      seenPost.add(id);
      const alias = m[2]?.trim();
      const title = referenceMetadata[id]?.title || alias || 'Post';
      list.push({ type: 'post', id, title });
    }

    // [[Topic]] or [[Topic|alias]] (not post:)
    for (const m of body.matchAll(/\[\[(?!post:)([^\]|]+)(?:\|([^\]]*))?\]\]/g)) {
      const slug = m[1].trim();
      if (seenTopic.has(slug)) continue;
      seenTopic.add(slug);
      const title = m[2]?.trim() || slug;
      list.push({ type: 'topic', slug, title });
    }

    // [text](url)
    for (const m of body.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
      const url = m[2].trim();
      if (seenUrl.has(url)) continue;
      seenUrl.add(url);
      const title = m[1]?.trim() || url;
      list.push({ type: 'external', title, url });
    }

    return list;
  }, [body, referenceMetadata]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (quotePostId) router.replace(`/post/${quotePostId}/reading`);
            else if (replyToPostId) router.replace(`/post/${replyToPostId}`);
            else router.back();
          }}
          style={styles.closeBtn}
        >
          <Text style={[styles.closeText, { color: HEADER.cancelColor }]}>{t('common.cancel')}</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => setPreviewMode(true)}
            style={[styles.previewBtn, (!body.trim() || body.trim().length < BODY_MIN_LENGTH) && styles.previewBtnDisabled]}
            disabled={!body.trim() || body.trim().length < BODY_MIN_LENGTH}
            accessibilityLabel={t('compose.preview')}
            accessibilityRole="button"
          >
            <Text style={[styles.previewBtnText, (!body.trim() || body.trim().length < BODY_MIN_LENGTH) && styles.previewBtnTextDisabled]}>
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
            <View style={styles.headerImagePreviewRow}>
              <Image source={{ uri: headerImage }} style={styles.headerImageThumb} resizeMode="cover" />
              <Text style={styles.headerImageLabel} numberOfLines={1}>{t('compose.headerImageAttached', 'Header image attached')}</Text>
              <Pressable style={styles.removeImgBtn} onPress={() => { setHeaderImage(null); setHeaderImageAsset(null); }}>
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
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                width: screenWidth,
                minHeight: screenHeight,
              },
            ]}
          >
            {/* Handle bar + header */}
            <View style={styles.previewHeader}>
              <View style={styles.previewHandle} />
              <View style={styles.previewHeaderRow}>
                <Pressable
                  style={styles.previewCloseBar}
                  onPress={() => { setPreviewMode(false); setPendingPublish(false); }}
                  accessibilityLabel={t('common.close')}
                  accessibilityRole="button"
                >
                  <Text style={styles.previewCloseText}>{t('common.close', 'Close')}</Text>
                </Pressable>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {pendingPublish ? t('compose.confirmPublish', 'Confirm & Publish') : t('compose.preview', 'Preview')}
                </Text>
                {pendingPublish ? (
                  <Pressable
                    style={[styles.previewPublishBtn, isPublishing && styles.previewPublishBtnDisabled]}
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
                  <View style={styles.previewHeaderSpacer} />
                )}
              </View>
            </View>
            {/* Article preview: same layout as post/[id]/reading.tsx */}
            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={[styles.previewScrollContent, styles.previewReadingContent]}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {headerImage ? (
                <View style={[styles.previewHeroWrap, { height: screenWidth * (3 / 4) }]}>
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
              ) : null}
              <PostArticleBlock
                post={previewPost}
                hasHero={!!headerImage}
                authorSubtitle={t('compose.preview', 'Preview')}
                referenceMetadata={referenceMetadata}
                validMentionHandles={confirmedMentionHandles}
              />
              {/* Sources / Quoted by: same section as reading page */}
              <View style={styles.previewSection}>
                <View style={styles.previewTabsRow}>
                  <View style={[styles.previewTabBtn, styles.previewTabBtnActive]}>
                    <Text style={[styles.previewTabBtnText, styles.previewTabBtnTextActive]}>
                      {t('post.sources', 'Sources')}
                    </Text>
                  </View>
                  <View style={styles.previewTabBtn}>
                    <Text style={styles.previewTabBtnText}>
                      {t('post.quotedBy', 'Quoted by')} (0)
                    </Text>
                  </View>
                </View>
                {previewSources.length === 0 ? (
                  <Text style={styles.previewEmptyText}>
                    {t('post.noSources', 'No tagged sources in this post.')}
                  </Text>
                ) : (
                  <View style={styles.previewSourcesList}>
                    {previewSources.map((source: any, index: number) => {
                      const onPress = () => {
                        if (source.type === 'external' && source.url) {
                          Linking.openURL(source.url).catch(() => { });
                        } else if (source.type === 'post' && source.id) {
                          setPreviewMode(false);
                          router.push(`/post/${source.id}`);
                        } else if (source.type === 'topic' && source.slug) {
                          setPreviewMode(false);
                          router.push(`/topic/${encodeURIComponent(source.slug)}`);
                        }
                      };
                      const title = source.title || source.url || source.slug || '';
                      const subtitle = source.type === 'external' && source.url
                        ? (() => { try { return new URL(source.url).hostname.replace('www.', ''); } catch { return ''; } })()
                        : source.type === 'topic' ? t('post.topic', 'Topic') : '';
                      const postPreview = source.type === 'post' && source.id ? sourcePreviews.postById[source.id] : null;
                      const topicPreview = source.type === 'topic' && source.slug ? sourcePreviews.topicBySlug[normalizeTopicSlug(source.slug)] : null;
                      const hasPostImage = postPreview && (postPreview.headerImageKey ?? postPreview.authorAvatarKey);
                      const hasTopicImage = topicPreview?.imageKey;
                      return (
                        <Pressable key={`${source.type}-${source.id ?? source.slug ?? source.url ?? index}`} style={styles.previewSourceCard} onPress={onPress}>
                          <View style={styles.previewSourceCardLeft}>
                            <View style={styles.previewSourceIconWrap}>
                              {source.type === 'post' && hasPostImage ? (
                                postPreview!.headerImageKey ? (
                                  <Image source={{ uri: getImageUrl(postPreview!.headerImageKey!) }} style={styles.previewSourceCircleImage} resizeMode="cover" />
                                ) : (
                                  <Avatar uri={getImageUrl(postPreview!.authorAvatarKey!)} name={title} size={40} style={styles.previewSourceCircleImage} />
                                )
                              ) : source.type === 'topic' && hasTopicImage ? (
                                <Image source={{ uri: getImageUrl(topicPreview!.imageKey!) }} style={styles.previewSourceCircleImage} resizeMode="cover" />
                              ) : (
                                <MaterialIcons
                                  name={source.type === 'post' ? 'article' : source.type === 'topic' ? 'tag' : 'link'}
                                  size={HEADER.iconSize}
                                  color={COLORS.primary}
                                />
                              )}
                            </View>
                            <View style={styles.previewSourceCardText}>
                              <Text style={styles.previewSourceCardTitle} numberOfLines={1}>{title}</Text>
                              {subtitle ? <Text style={styles.previewSourceCardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
                            </View>
                          </View>
                          <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                        </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    minHeight: 52,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { fontSize: 16, fontFamily: FONTS.medium },
  previewBtn: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBtnDisabled: { opacity: 0.5 },
  previewBtnText: { color: COLORS.secondary, fontSize: 16, fontFamily: FONTS.medium },
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
  linkInputContainer: { padding: SPACING.m },
  linkInputRow: { flexDirection: 'row', gap: 8 },
  linkField: { flex: 1, backgroundColor: COLORS.hover, color: COLORS.paper, padding: 12, borderRadius: 8, fontSize: 16 },
  linkDisplayField: { marginTop: 8, minHeight: 56, textAlignVertical: 'top' },
  linkAddButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, justifyContent: 'center' },
  linkCloseButton: { backgroundColor: COLORS.hover, padding: 12, borderRadius: 8, justifyContent: 'center' },

  previewFullscreen: { flex: 1, backgroundColor: COLORS.ink },
  previewHeader: {
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.ink,
  },
  previewHandle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: SPACING.m,
  },
  previewCloseBar: {
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  previewCloseText: {
    color: HEADER.cancelColor,
    fontSize: HEADER.titleSize,
    fontFamily: FONTS.medium,
  },
  previewTitle: {
    flex: 1,
    fontSize: HEADER.titleSize,
    fontFamily: FONTS.semiBold,
    color: COLORS.paper,
    textAlign: 'center',
  },
  previewHeaderSpacer: { minWidth: 80 },
  previewPublishBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 44,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  previewPublishBtnDisabled: { opacity: 0.6 },
  previewPublishText: {
    color: COLORS.ink,
    fontSize: HEADER.titleSize,
    fontFamily: FONTS.semiBold,
  },
  previewScroll: { flex: 1 },
  previewScrollContent: { paddingBottom: 40 },
  previewReadingContent: { paddingTop: SPACING.xl, paddingBottom: 80 },
  /* Reading-page layout: hero (full width) */
  previewHeroWrap: {
    width: '100%',
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
  previewSection: {
    marginTop: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
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
    gap: 0,
  },
  previewSourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  previewSourceCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    minWidth: 0,
  },
  previewSourceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewSourceCircleImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  previewSourceCardText: {
    flex: 1,
    minWidth: 0,
  },
  previewSourceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  previewSourceCardSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
