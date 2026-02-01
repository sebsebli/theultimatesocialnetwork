import React, { useState, useMemo, memo } from 'react';
import { Text, View, Modal, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SPACING, SIZES, FONTS, createStyles } from '../constants/theme';

const CODE_FONT = Platform.select({ ios: 'Menlo', android: 'monospace' }) ?? 'monospace';

interface MarkdownTextProps {
  children: string;
  referenceMetadata?: Record<string, { title?: string }>;
  /** When set, only @handle that are in this set render as mention chips; others render as plain text (no @). Omit for published content to render all @ as mentions. */
  validMentionHandles?: Set<string> | null;
  /** When set (e.g. post.title in full view), the first line "# &lt;title&gt;" is not rendered so the title is not shown twice. */
  stripLeadingH1IfMatch?: string | null;
}

function MarkdownTextInner({ children, referenceMetadata = {}, validMentionHandles, stripLeadingH1IfMatch: titleToStrip }: MarkdownTextProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [alias, setAlias] = useState('');

  const handleLinkPress = async (url: string | null | undefined) => {
    if (url == null || typeof url !== 'string') return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('http')) {
      await WebBrowser.openBrowserAsync(trimmed, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.ink,
        controlsColor: COLORS.primary,
      });
    } else if (trimmed.startsWith('post:')) {
      const id = trimmed.split(':')[1];
      if (id) router.push(`/post/${id}`);
    } else {
      // Topic: use exact wikilink target as topic ID (no slugification).
      // [[Artificial Intelligence]] → /topic/Artificial%20Intelligence, [[AI]] → /topic/AI
      router.push(`/topic/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleWikiLinkPress = (targetString: string | null | undefined, displayAlias?: string) => {
    if (targetString == null || typeof targetString !== 'string') return;
    const items = targetString.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length > 1) {
      setTargets(items);
      setAlias(displayAlias || 'Linked Items');
      setModalVisible(true);
    } else if (items[0]) {
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
      let match: RegExpExecArray | null;
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
          const matchIndex = match.index;
          if (isMultiLine) {
            parts.push(
              <View key={`${lineKey}-${matchIndex}`} style={styles.inlineCodeBlockWrap}>
                {codeContent.split('\n').map((codeLine: string, idx: number) => (
                  <Text key={`${lineKey}-${matchIndex}-${idx}`} style={[lineStyle, styles.inlineCodeBlockLine]} selectable>
                    {codeLine || ' '}
                  </Text>
                ))}
              </View>
            );
          } else {
            parts.push(<Text key={`${lineKey}-${matchIndex}`} style={[lineStyle, styles.inlineCode]}>{codeContent}</Text>);
          }
        } else if (match[7]) {
          const linkContentVal = match[8] != null ? String(match[8]) : '';
          const aliasVal = match[9] != null ? String(match[9]) : undefined;
          const meta = referenceMetadata ?? {};
          let linkDisplay = aliasVal ?? linkContentVal;
          if (!aliasVal && linkContentVal.startsWith('post:')) {
            const id = linkContentVal.split(':')[1] ?? '';
            const refTitle = (meta as Record<string, { title?: string }>)[id]?.title ?? (meta as Record<string, { title?: string }>)[id?.toLowerCase?.() ?? '']?.title;
            linkDisplay = refTitle ?? id.slice(0, 8);
          }
          parts.push(
            <Pressable
              key={`${lineKey}-${match.index}`}
              style={({ pressed }: { pressed: boolean }) => [styles.inlineLinkWrap, pressed && styles.inlineLinkPressed]}
              onPress={() => handleWikiLinkPress(linkContentVal, aliasVal)}
            >
              <Text style={[lineStyle, styles.tagText]} numberOfLines={1}>{linkDisplay}</Text>
            </Pressable>
          );
        } else if (match[10]) {
          const hrefVal = match[12] != null ? String(match[12]) : '';
          const linkTextVal = match[11] != null ? String(match[11]) : hrefVal;
          parts.push(
            <Pressable key={`${lineKey}-${match.index}`} style={({ pressed }: { pressed: boolean }) => [styles.inlineLinkWrap, pressed && styles.inlineLinkPressed]} onPress={() => handleLinkPress(hrefVal)}>
              <Text style={[lineStyle, styles.tagText]} numberOfLines={1}>{linkTextVal}</Text>
            </Pressable>
          );
        } else if (match[13]) {
          const handle = match[13].substring(1);
          const isValidMention = validMentionHandles == null || validMentionHandles.has(handle);
          if (isValidMention) {
            parts.push(
              <Pressable key={`${lineKey}-${match.index}`} style={({ pressed }: { pressed: boolean }) => [styles.inlineLinkWrap, pressed && styles.inlineLinkPressed]} onPress={() => router.push(`/user/${handle}`)}>
                <Text style={[lineStyle, styles.tagText]}>{match[13]}</Text>
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

    let content = children;
    if (titleToStrip && content.trim()) {
      const firstLine = content.split('\n')[0].trim();
      if (firstLine === '# ' + titleToStrip || firstLine === '#' + titleToStrip) {
        content = content.slice(content.indexOf('\n') + 1).trimStart();
      }
    }
    // No line breaks before/after [[]], [text](url), @mention: collapse to space so they render inline
    content = content.replace(/\n+\s*(\[\[[^\]]+\]\])/g, ' $1');
    content = content.replace(/(\[\[[^\]]+\]\])\s*\n+\s*/g, '$1 ');
    content = content.replace(/\n+\s*(\[[^\]]+\]\([^)]+\))/g, ' $1');
    content = content.replace(/(\[[^\]]+\]\([^)]+\))\s*\n+\s*/g, '$1 ');
    content = content.replace(/\n+\s*(@[a-zA-Z0-9_.]+)/g, ' $1');
    content = content.replace(/(@[a-zA-Z0-9_.]+)\s*\n+\s*/g, '$1 ');
    const lines = content.split('\n');
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
        const trimmedLine = line.trimStart();
        let lineStyle = styles.text;
        let content = trimmedLine;
        let prefix = null;
        if (trimmedLine.startsWith('### ')) {
          lineStyle = styles.h3;
          content = trimmedLine.substring(4).trimStart();
        } else if (trimmedLine.startsWith('## ')) {
          lineStyle = styles.h2;
          content = trimmedLine.substring(3).trimStart();
        } else if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
          lineStyle = styles.h1;
          content = trimmedLine.substring(2).trimStart();
        } else if (trimmedLine.startsWith('> ')) {
          lineStyle = styles.blockquote;
          content = trimmedLine.substring(2).trimStart();
          prefix = <View style={styles.blockquoteBar} />;
        } else if (trimmedLine.startsWith('- ')) {
          lineStyle = styles.listItem;
          content = trimmedLine.substring(2).trimStart();
          prefix = <Text style={styles.bullet}>• </Text>;
        } else if (/^\d+\. /.test(trimmedLine)) {
          lineStyle = styles.listItem;
          const m = trimmedLine.match(/^(\d+)\. /);
          const num = m ? m[1] : '1';
          content = trimmedLine.substring(m ? m[0].length : 3).trimStart();
          prefix = <Text style={styles.number}>{num}. </Text>;
        } else {
          content = trimmedLine;
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
  }, [children, titleToStrip, referenceMetadata, validMentionHandles]);

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

export const MarkdownText = memo(MarkdownTextInner as React.FunctionComponent<MarkdownTextProps>) as (props: MarkdownTextProps) => React.ReactElement | null;

const styles = createStyles({
  container: {
    marginBottom: SPACING.m,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
  },
  /* H1/H2/H3: Inter, H1 > H2 > H3, tight spacing */
  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.s,
    marginBottom: SPACING.xs,
  },
  h2: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.s,
    marginBottom: SPACING.xs,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
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
  /* Inline code `code` – lighter grey bg, orange code text */
  inlineCode: {
    fontFamily: CODE_FONT,
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    color: '#E8B86D',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  /* Multi-line inline code (backticks with newlines) – paragraph-like spacing */
  inlineCodeBlockWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(232, 184, 109, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginVertical: SPACING.m,
    overflow: 'hidden',
  },
  inlineCodeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 13,
    color: '#E8B86D',
    lineHeight: 20,
  },
  /* Fenced code block ```...``` – own paragraph with space before/after, lighter grey bg, orange code */
  codeBlockContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(232, 184, 109, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    marginVertical: SPACING.l,
    overflow: 'hidden',
  },
  codeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 13,
    color: '#E8B86D',
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
    marginBottom: SPACING.xs,
  },
  /* Tags, links, mentions – same font as body (serif), bold and distinct color */
  inlineLinkWrap: {
    alignSelf: 'baseline',
  },
  tagText: {
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.serifSemiBold,
  },
  inlineLinkPressed: {
    opacity: 0.8,
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