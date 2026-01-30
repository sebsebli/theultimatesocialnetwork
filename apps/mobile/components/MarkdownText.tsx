import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

const CODE_FONT = Platform.select({ ios: 'Menlo', android: 'monospace' }) ?? 'monospace';

interface MarkdownTextProps {
  children: string;
  referenceMetadata?: Record<string, { title?: string }>;
  /** When set, only @handle that are in this set render as mention chips; others render as plain text (no @). Omit for published content to render all @ as mentions. */
  validMentionHandles?: Set<string> | null;
}

export function MarkdownText({ children, referenceMetadata = {}, validMentionHandles }: MarkdownTextProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [alias, setAlias] = useState('');

  const handleLinkPress = async (url: string) => {
    if (url.startsWith('http')) {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.ink,
        controlsColor: COLORS.primary,
      });
    } else if (url.startsWith('post:')) {
      const id = url.split(':')[1];
      router.push(`/post/${id}`);
    } else {
      // Topic: use exact wikilink target as topic ID (no slugification).
      // [[Artificial Intelligence]] → /topic/Artificial%20Intelligence, [[AI]] → /topic/AI
      router.push(`/topic/${encodeURIComponent(url)}`);
    }
  };

  const handleWikiLinkPress = (targetString: string, displayAlias?: string) => {
    const items = targetString.split(',').map(s => s.trim());
    if (items.length > 1) {
      setTargets(items);
      setAlias(displayAlias || 'Linked Items');
      setModalVisible(true);
    } else {
      handleLinkPress(items[0]);
    }
  };

  // Supported: H1/H2/H3, bold **, italic _, blockquote > , list - , ordered 1. , inline code `, fenced code ```...```, [[wikilink]], [link](url), @mention
  const parseText = useMemo(() => {
    if (!children) return null;

    const parseLineContent = (content: string, lineStyle: any, lineKey: string): any[] => {
      const parts: any[] = [];
      let lastIndex = 0;
      // Only composer-supported inline: Bold (**), Italic (_), Inline code (`), Wikilink ([[...]]), Link [...](...), Mention (@...)
      // Inline code is intentionally matched inside bold/italic by recursing on bold/italic content.
      const regex = /(\*\*(.*?)\*\*)|(_(.*?)_)|(`([^`]+)`)|(\[\[(.*?)(?:\|(.*?))?\]\])|(\[(.*?)\]\((.*?)\))|(@[a-zA-Z0-9_.]+)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<Text key={`${lineKey}-${lastIndex}`} style={lineStyle}>{content.substring(lastIndex, match.index)}</Text>);
        }
        if (match[1]) {
          // Recursively parse bold content so inline code (and other markdown) inside renders correctly
          parts.push(...parseLineContent(match[2], [lineStyle, styles.bold], `${lineKey}-${match.index}-b`));
        } else if (match[3]) {
          // Recursively parse italic content so inline code (and other markdown) inside renders correctly
          parts.push(...parseLineContent(match[4], [lineStyle, styles.italic], `${lineKey}-${match.index}-i`));
        } else if (match[5]) {
          const codeContent = match[6];
          const isMultiLine = codeContent.includes('\n');
          if (isMultiLine) {
            parts.push(
              <View key={`${lineKey}-${match.index}`} style={styles.inlineCodeBlockWrap}>
                {codeContent.split('\n').map((codeLine, idx) => (
                  <Text key={`${lineKey}-${match.index}-${idx}`} style={[lineStyle, styles.inlineCodeBlockLine]} selectable>
                    {codeLine || ' '}
                  </Text>
                ))}
              </View>
            );
          } else {
            parts.push(<Text key={`${lineKey}-${match.index}`} style={[lineStyle, styles.inlineCode]}>{codeContent}</Text>);
          }
        } else if (match[7]) {
          const linkContent = match[8];
          let linkDisplay = match[9] || linkContent;
          if (!match[9] && linkContent.startsWith('post:')) {
            const id = linkContent.split(':')[1];
            if (referenceMetadata[id]?.title) linkDisplay = referenceMetadata[id].title;
          }
          parts.push(
            <Pressable key={`${lineKey}-${match.index}`} style={({ pressed }: { pressed: boolean }) => [styles.tagChip, pressed && styles.tagChipPressed]} onPress={() => handleWikiLinkPress(linkContent, match[9])}>
              <Text style={[lineStyle, styles.tagChipText]} numberOfLines={1}>{linkDisplay}</Text>
            </Pressable>
          );
        } else if (match[10]) {
          parts.push(
            <Pressable key={`${lineKey}-${match.index}`} style={({ pressed }: { pressed: boolean }) => [styles.linkChip, pressed && styles.linkChipPressed]} onPress={() => handleLinkPress(match[12])}>
              <Text style={[lineStyle, styles.linkChipText]} numberOfLines={1}>{match[11]}</Text>
            </Pressable>
          );
        } else if (match[13]) {
          const handle = match[13].substring(1);
          const isValidMention = validMentionHandles == null || validMentionHandles.has(handle);
          if (isValidMention) {
            parts.push(
              <Pressable key={`${lineKey}-${match.index}`} style={({ pressed }: { pressed: boolean }) => [styles.mentionChip, pressed && styles.mentionChipPressed]} onPress={() => router.push(`/user/${handle}`)}>
                <Text style={[lineStyle, styles.mentionChipText]}>{match[13]}</Text>
              </Pressable>
            );
          } else {
            // Don't render @ when user wasn't selected from suggestions / doesn't exist — show handle only (no @)
            parts.push(<Text key={`${lineKey}-${match.index}`} style={lineStyle}>{handle}</Text>);
          }
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(<Text key={`${lineKey}-end`} style={lineStyle}>{content.substring(lastIndex)}</Text>);
      }
      return parts;
    };

    const lines = children.split('\n');
    type Segment = { type: 'normal'; lines: string[] } | { type: 'code'; lines: string[] };
    const segments: Segment[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const isFence = line.trim().startsWith('```');
      if (isFence) {
        i += 1; // skip opening ``` or ```lang
        const codeLines: string[] = [];
        while (i < lines.length) {
          if (lines[i].trim().startsWith('```')) {
            i += 1; // skip closing ```
            break;
          }
          codeLines.push(lines[i]);
          i += 1;
        }
        segments.push({ type: 'code', lines: codeLines });
      } else {
        const normalLines: string[] = [];
        while (i < lines.length) {
          const l = lines[i];
          if (l.trim().startsWith('```')) break;
          normalLines.push(l);
          i += 1;
        }
        segments.push({ type: 'normal', lines: normalLines });
      }
    }

    const nodes: any[] = [];
    let nodeKey = 0;

    segments.forEach((seg) => {
      if (seg.type === 'code') {
        const blockKey = `code-${nodeKey++}`;
        nodes.push(
          <View key={blockKey} style={styles.codeBlockContainer}>
            {seg.lines.map((codeLine, idx) => (
              <Text key={`${blockKey}-${idx}`} style={styles.codeBlockLine} selectable>
                {codeLine || ' '}
              </Text>
            ))}
          </View>
        );
        return;
      }

      seg.lines.forEach((line, lineIndex) => {
        let lineStyle = styles.text;
        let content = line;
        let prefix = null;
        if (line.startsWith('### ')) {
          lineStyle = styles.h3;
          content = line.substring(4);
        } else if (line.startsWith('## ')) {
          lineStyle = styles.h2;
          content = line.substring(3);
        } else if (line.startsWith('# ') && !line.startsWith('## ')) {
          lineStyle = styles.h1;
          content = line.substring(2);
        } else if (line.startsWith('> ')) {
          lineStyle = styles.blockquote;
          content = line.substring(2);
          prefix = <View style={styles.blockquoteBar} />;
        } else if (line.startsWith('- ')) {
          lineStyle = styles.listItem;
          content = line.substring(2);
          prefix = <Text style={styles.bullet}>• </Text>;
        } else if (/^\d+\. /.test(line)) {
          lineStyle = styles.listItem;
          const m = line.match(/^(\d+)\. /);
          const num = m ? m[1] : '1';
          content = line.substring(m ? m[0].length : 3);
          prefix = <Text style={styles.number}>{num}. </Text>;
        }
        const lineKey = `l-${nodeKey}-${lineIndex}`;
        if (content.trim() === '') {
          nodes.push(<View key={lineKey} style={{ height: SPACING.m }} />);
        } else {
          const parts = parseLineContent(content, lineStyle, lineKey);
          nodes.push(
            <View
              key={lineKey}
              style={[
                styles.lineRow,
                (lineStyle === styles.h1 || lineStyle === styles.h2 || lineStyle === styles.h3) && styles.lineRowHeading,
                lineStyle === styles.blockquote && styles.lineRowBlockquote
              ]}
            >
              {prefix}
              {parts.length > 0 ? parts : <Text style={lineStyle}>{content}</Text>}
            </View>
          );
        }
      });
      nodeKey += 1;
    });

    return nodes;
  }, [children, referenceMetadata, validMentionHandles]);

  return (
    <>
      <View style={styles.container}>{parseText}</View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{alias}</Text>
            {targets.map((target, index) => (
              <Pressable
                key={index}
                style={styles.targetItem}
                onPress={() => {
                  setModalVisible(false);
                  handleLinkPress(target);
                }}
              >
                <Text style={styles.targetText}>{target}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: SPACING.s,
    marginBottom: SPACING.m,
  },
  blockquote: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
    color: COLORS.secondary,
    fontFamily: FONTS.serifRegular,
  },
  blockquoteBar: {
    width: 4,
    marginRight: SPACING.m,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
    alignSelf: 'stretch',
    minHeight: 20,
  },
  lineRowBlockquote: {
    paddingLeft: 0,
  },
  listItem: {
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
  },
  bullet: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  number: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bold: {
    fontWeight: '700',
    fontFamily: FONTS.serifSemiBold,
  },
  italic: {
    fontStyle: 'italic',
  },
  /* Inline code `code` – Slack-like: monospace, code container, distinct bg */
  inlineCode: {
    fontFamily: CODE_FONT,
    fontSize: 14,
    backgroundColor: 'rgba(30, 32, 36, 0.85)',
    color: 'rgba(230, 232, 235, 1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  /* Multi-line inline code (backticks with newlines) – same container as block */
  inlineCodeBlockWrap: {
    backgroundColor: 'rgba(30, 32, 36, 0.9)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(110, 122, 138, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
  inlineCodeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 13,
    color: 'rgba(230, 232, 235, 1)',
    lineHeight: 20,
  },
  /* Fenced code block ```...``` – Slack-like: monospace, code container, accent bar */
  codeBlockContainer: {
    backgroundColor: 'rgba(30, 32, 36, 0.9)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(110, 122, 138, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    marginVertical: SPACING.m,
    overflow: 'hidden',
  },
  codeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 13,
    color: 'rgba(230, 232, 235, 1)',
    lineHeight: 20,
  },
  lineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
  },
  lineRowHeading: {
    marginBottom: SPACING.m,
  },
  /* [[Topic]] / [[post:id|title]] – tag pill (minimal vertical padding for compact batches) */
  tagChip: {
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  tagChipPressed: {
    opacity: 0.8,
  },
  tagChipText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  /* [text](url) – link pill (minimal vertical padding for compact batches) */
  linkChip: {
    backgroundColor: 'rgba(110, 122, 138, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: 'rgba(110, 122, 138, 0.3)',
  },
  linkChipPressed: {
    opacity: 0.8,
  },
  linkChipText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  /* @handle – mention pill (minimal vertical padding for compact batches) */
  mentionChip: {
    backgroundColor: 'rgba(110, 122, 138, 0.18)',
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  mentionChipPressed: {
    opacity: 0.8,
  },
  mentionChipText: {
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  targetItem: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  targetText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
  },
  closeButton: {
    marginTop: SPACING.l,
    alignItems: 'center',
    padding: SPACING.m,
  },
  closeButtonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});