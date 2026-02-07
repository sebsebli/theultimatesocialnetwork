import React, { useState, useMemo, memo, isValidElement } from "react";
import {
  Text,
  View,
  Modal,
  Pressable,
  Platform,
  TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOpenExternalLink } from "../hooks/useOpenExternalLink";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  createStyles,
} from "../constants/theme";

const CODE_FONT =
  Platform.select({ ios: "Menlo", android: "monospace" }) ?? "monospace";

/** Format large numbers compactly: 1234 → "1.2K", 1500000 → "1.5M" */
function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "K";
  }
  return String(n);
}

interface InlineEnrichment {
  mentionAvatars?: Record<string, string | null>;
  topicPostCounts?: Record<string, number>;
  postCiteCounts?: Record<string, number>;
}

interface MarkdownTextProps {
  children: string;
  referenceMetadata?: Record<
    string,
    {
      title?: string;
      bodyExcerpt?: string;
      deletedAt?: string;
      isProtected?: boolean;
    }
  >;
  /** Fresh inline enrichment: mention avatars, topic post counts, cite counts. */
  inlineEnrichment?: InlineEnrichment | null;
  /** When set, only @handle that are in this set render as mention chips; others render as plain text (no @). Omit for published content to render all @ as mentions. */
  validMentionHandles?: Set<string> | null;
  /** When set (e.g. post.title in full view), the first line "# &lt;title&gt;" is not rendered so the title is not shown twice. */
  stripLeadingH1IfMatch?: string | null;
}

function MarkdownTextInner({
  children,
  referenceMetadata = {},
  inlineEnrichment,
  validMentionHandles,
  stripLeadingH1IfMatch: titleToStrip,
}: MarkdownTextProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { openExternalLink } = useOpenExternalLink();
  const [modalVisible, setModalVisible] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [alias, setAlias] = useState("");
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const previewMeta = previewPostId
    ? (referenceMetadata as Record<string, { title?: string; bodyExcerpt?: string; deletedAt?: string }>)?.[previewPostId] ??
    (referenceMetadata as Record<string, { title?: string; bodyExcerpt?: string; deletedAt?: string }>)?.[previewPostId?.toLowerCase?.() ?? ""]
    : null;

  const handleLinkPress = async (url: string | null | undefined) => {
    if (url == null || typeof url !== "string") return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("http")) {
      await openExternalLink(trimmed);
    } else if (trimmed.startsWith("post:")) {
      const id = trimmed.split(":")[1];
      if (id) router.push(`/post/${id}/reading`);
    } else {
      router.push(`/topic/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleWikiLinkPress = (
    targetString: string | null | undefined,
    displayAlias?: string,
  ) => {
    if (targetString == null || typeof targetString !== "string") return;
    const items = targetString
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 1) {
      setTargets(items);
      setAlias(displayAlias || t("post.linkedItems", "Linked Items"));
      setModalVisible(true);
    } else if (items[0]) {
      handleLinkPress(items[0]);
    }
  };

  /*
   * DESIGN PRINCIPLE: All inline elements (topics, mentions, post refs, links)
   * render as pure <Text> nested inside the parent <Text>. <Image> is allowed
   * inside <Text> (RN treats it as an inline character glyph).
   * This preserves natural text flow — nothing forces a new line or breaks
   * the reading rhythm. Visual distinction is achieved through color, weight,
   * subtle styling, and tiny inline avatars / counts.
   */
  const parseText = useMemo(() => {
    const getLinkDisplayText = (
      href: string,
      linkText: string,
      isExternal: boolean,
    ): string => {
      const hasCustomLabel = linkText !== href && linkText !== "";
      if (hasCustomLabel) return linkText || href;
      if (isExternal) {
        try {
          return new URL(href).hostname.replace(/^www\./i, "");
        } catch {
          return href.length > 45 ? href.slice(0, 42) + "…" : href;
        }
      }
      return href;
    };

    if (!children) return null;

    const parseLineContent = (
      content: string,
      lineStyle: TextStyle | TextStyle[],
      lineKey: string,
    ): React.ReactNode[] => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [];
      let lastIndex = 0;
      const regex =
        /(\*\*(.*?)\*\*)|(_(.*?)_)|(`([^`]+)`)|(\[(.*?)\]\((.*?)\))|(\[\[(.*?)(?:\|(.*?))?\]\])|(@[a-zA-Z0-9_.]+)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <Text key={`${lineKey}-${lastIndex}`} style={lineStyle}>
              {content.substring(lastIndex, match.index)}
            </Text>,
          );
        }
        if (match[1]) {
          const boldStyle: TextStyle[] = Array.isArray(lineStyle)
            ? [...lineStyle, styles.bold as TextStyle]
            : [lineStyle, styles.bold as TextStyle];
          const boldParts = parseLineContent(
            match[2],
            boldStyle,
            `${lineKey}-${match.index}-b`,
          );
          parts.push(...boldParts);
        } else if (match[3]) {
          const italicStyle: TextStyle[] = Array.isArray(lineStyle)
            ? [...lineStyle, styles.italic as TextStyle]
            : [lineStyle, styles.italic as TextStyle];
          const italicParts = parseLineContent(
            match[4],
            italicStyle,
            `${lineKey}-${match.index}-i`,
          );
          parts.push(...italicParts);
        } else if (match[5]) {
          const codeContent = match[6];
          const isMultiLine = codeContent.includes("\n");
          const matchIndex = match.index;
          if (isMultiLine) {
            parts.push(
              <View
                key={`${lineKey}-${matchIndex}`}
                style={styles.inlineCodeBlockWrap}
              >
                {codeContent
                  .split("\n")
                  .map((codeLine: string, idx: number) => (
                    <Text
                      key={`${lineKey}-${matchIndex}-${idx}`}
                      style={[lineStyle, styles.inlineCodeBlockLine]}
                      selectable
                    >
                      {codeLine || " "}
                    </Text>
                  ))}
              </View>,
            );
          } else {
            parts.push(
              <Text
                key={`${lineKey}-${matchIndex}`}
                style={[lineStyle, styles.inlineCode]}
              >
                {codeContent}
              </Text>,
            );
          }
        } else if (match[7]) {
          // Markdown link [text](url)
          const bracketContent =
            match[8] != null ? String(match[8]).trim() : "";
          const parenContent = match[9] != null ? String(match[9]).trim() : "";
          const isUrl = (s: string) =>
            s.startsWith("http://") || s.startsWith("https://");
          const hrefVal = isUrl(parenContent)
            ? parenContent
            : isUrl(bracketContent)
              ? bracketContent
              : parenContent || bracketContent;
          const linkTextVal = isUrl(parenContent)
            ? bracketContent
            : isUrl(bracketContent)
              ? parenContent
              : bracketContent || parenContent;
          const isExternalUrl = hrefVal.startsWith("http");
          const displayText = getLinkDisplayText(
            hrefVal,
            linkTextVal,
            isExternalUrl,
          );
          const inlineLinkStyle = isExternalUrl
            ? styles.urlLinkText
            : hrefVal.toLowerCase().startsWith("post:")
              ? styles.postLinkText
              : styles.topicTagText;
          parts.push(
            <Text
              key={`${lineKey}-${match.index}`}
              style={[lineStyle, inlineLinkStyle]}
              onPress={() => handleLinkPress(hrefVal)}
            >
              {displayText}
            </Text>,
          );
        } else if (match[10]) {
          // Wikilink [[...]] or [[...|alias]]
          const linkContentVal = match[11] != null ? String(match[11]) : "";
          const aliasVal = match[12] != null ? String(match[12]) : undefined;
          const meta = referenceMetadata ?? {};
          let linkDisplay = aliasVal ?? linkContentVal;
          let postId: string | undefined;
          if (!aliasVal && linkContentVal.startsWith("post:")) {
            const id = linkContentVal.split(":")[1] ?? "";
            postId = id;
            const refMeta =
              (
                meta as Record<
                  string,
                  { title?: string; deletedAt?: string; isProtected?: boolean }
                >
              )[id] ??
              (
                meta as Record<
                  string,
                  { title?: string; deletedAt?: string; isProtected?: boolean }
                >
              )[id?.toLowerCase?.() ?? ""];
            const refTitle = refMeta?.title;
            const isDeleted = !!refMeta?.deletedAt;
            const isProtected = !!refMeta?.isProtected;

            if (isDeleted) {
              linkDisplay = refTitle
                ? `${refTitle} (deleted)`
                : t("post.deletedContent", "(deleted content)");
            } else {
              linkDisplay =
                (refTitle ?? id.slice(0, 8)) +
                (isProtected ? " (private)" : "");
            }
          }
          const isPostLink = linkContentVal.toLowerCase().startsWith("post:");
          const isUrlLink = linkContentVal.startsWith("http");

          // All wikilinks render as pure inline <Text> — no View wrappers
          const wikilinkStyle = isPostLink
            ? styles.postLinkText
            : isUrlLink
              ? styles.urlLinkText
              : styles.topicTagText;

          // Topic post count (for topic wikilinks)
          const isTopicLink = !isPostLink && !isUrlLink;
          const topicSlug = isTopicLink ? linkContentVal.split(",")[0].trim() : undefined;
          const topicCount = topicSlug
            ? inlineEnrichment?.topicPostCounts?.[topicSlug]
            : undefined;

          // Post cite count (for post wikilinks)
          const citeCount =
            isPostLink && postId
              ? inlineEnrichment?.postCiteCounts?.[postId.toLowerCase()]
              : undefined;

          parts.push(
            <Text
              key={`${lineKey}-${match.index}`}
              style={[lineStyle, wikilinkStyle]}
              onPress={() => handleWikiLinkPress(linkContentVal, aliasVal)}
              onLongPress={
                isPostLink && postId
                  ? () => setPreviewPostId(postId)
                  : undefined
              }
            >
              {linkDisplay}
              {topicCount != null && topicCount > 0 ? (
                <Text style={styles.inlineCountWrap}>
                  {" "}
                  <Text style={styles.inlineCountNum}>{formatCount(topicCount)} posts</Text>
                </Text>
              ) : null}
              {citeCount != null && citeCount > 0 ? (
                <Text style={styles.inlineCountWrap}>
                  {" "}
                  <Text style={styles.inlineCountNum}>{formatCount(citeCount)} cites</Text>
                </Text>
              ) : null}
            </Text>,
          );
        } else if (match[13]) {
          // @mention — inline text with small avatar dot or image
          const handle = match[13].substring(1);
          const isValidMention =
            validMentionHandles == null || validMentionHandles.has(handle);
          if (isValidMention) {
            const initial = handle.charAt(0).toUpperCase();
            parts.push(
              <Text
                key={`${lineKey}-${match.index}`}
                style={[lineStyle, styles.mentionText]}
                onPress={() => router.push(`/user/${handle}`)}
              >
                <Text style={styles.mentionDot}>{initial}</Text>
                {" @"}{handle}
              </Text>,
            );
          } else {
            parts.push(
              <Text key={`${lineKey}-${match.index}`} style={lineStyle}>
                {handle}
              </Text>,
            );
          }
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(
          <Text key={`${lineKey}-end`} style={lineStyle}>
            {content.substring(lastIndex)}
          </Text>,
        );
      }
      return parts;
    };

    let content = children;
    if (titleToStrip && content.trim()) {
      const firstLine = content.split("\n")[0].trim();
      if (
        firstLine === "# " + titleToStrip ||
        firstLine === "#" + titleToStrip
      ) {
        content = content.slice(content.indexOf("\n") + 1).trimStart();
      }
    }
    // Collapse line breaks around inline elements so they flow naturally
    content = content.replace(/\n+\s*(\[\[[^\]]+\]\])/g, " $1");
    content = content.replace(/(\[\[[^\]]+\]\])\s*\n+\s*/g, "$1 ");
    content = content.replace(/\n+\s*(\[[^\]]+\]\([^)]+\))/g, " $1");
    content = content.replace(/(\[[^\]]+\]\([^)]+\))\s*\n+\s*/g, "$1 ");
    content = content.replace(/\n+\s*(@[a-zA-Z0-9_.]+)/g, " $1");
    content = content.replace(/(@[a-zA-Z0-9_.]+)\s*\n+\s*/g, "$1 ");
    const lines = content.split("\n");
    type Segment =
      | { type: "normal"; lines: string[] }
      | { type: "code"; lines: string[] };
    const segments: Segment[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const isFence = line.trim().startsWith("```");
      if (isFence) {
        i += 1;
        const codeLines: string[] = [];
        while (i < lines.length) {
          if (lines[i].trim().startsWith("```")) {
            i += 1;
            break;
          }
          codeLines.push(lines[i]);
          i += 1;
        }
        segments.push({ type: "code", lines: codeLines });
      } else {
        const normalLines: string[] = [];
        while (i < lines.length) {
          const l = lines[i];
          if (l.trim().startsWith("```")) break;
          normalLines.push(l);
          i += 1;
        }
        segments.push({ type: "normal", lines: normalLines });
      }
    }

    const nodes: React.ReactNode[] = [];
    let nodeKey = 0;

    segments.forEach((seg) => {
      if (seg.type === "code") {
        const blockKey = `code-${nodeKey++}`;
        nodes.push(
          (
            <View key={blockKey} style={styles.codeBlockContainer}>
              {seg.lines.map((codeLine, idx) => (
                <Text
                  key={`${blockKey}-${idx}`}
                  style={styles.codeBlockLine}
                  selectable
                >
                  {codeLine || " "}
                </Text>
              ))}
            </View>
          ) as React.ReactNode,
        );
        return;
      }

      seg.lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trimStart();
        let lineStyle = styles.text;
        let content = trimmedLine;
        let prefix = null;
        if (trimmedLine.startsWith("### ")) {
          lineStyle = styles.h3;
          content = trimmedLine.substring(4).trimStart();
        } else if (trimmedLine.startsWith("## ")) {
          lineStyle = styles.h2;
          content = trimmedLine.substring(3).trimStart();
        } else if (
          trimmedLine.startsWith("# ") &&
          !trimmedLine.startsWith("## ")
        ) {
          lineStyle = styles.h1;
          content = trimmedLine.substring(2).trimStart();
        } else if (trimmedLine.startsWith("> ")) {
          lineStyle = styles.blockquote;
          content = trimmedLine.substring(2).trimStart();
          prefix = <View style={styles.blockquoteBar} />;
        } else if (trimmedLine.startsWith("- ")) {
          lineStyle = styles.listItem;
          content = trimmedLine.substring(2).trimStart();
          prefix = <Text style={styles.bullet}>• </Text>;
        } else if (/^\d+\. /.test(trimmedLine)) {
          lineStyle = styles.listItem;
          const m = trimmedLine.match(/^(\d+)\. /);
          const num = m ? m[1] : "1";
          content = trimmedLine.substring(m ? m[0].length : 3).trimStart();
          prefix = <Text style={styles.number}>{num}. </Text>;
        } else {
          content = trimmedLine;
        }
        const lineKey = `l-${nodeKey}-${lineIndex}`;
        if (content.trim() === "") {
          nodes.push(
            (
              <View key={lineKey} style={{ height: SPACING.m }} />
            ) as React.ReactNode,
          );
        } else {
          const parts = parseLineContent(content, lineStyle, lineKey);
          const hasBlockInLine = parts.some(
            (p) => isValidElement(p) && (p as { type?: unknown }).type === View,
          );
          const isHeading =
            (lineStyle as object) === (styles.h1 as object) ||
            (lineStyle as object) === (styles.h2 as object) ||
            (lineStyle as object) === (styles.h3 as object);
          const isBlockquote =
            (lineStyle as object) === (styles.blockquote as object);
          const lineRowStyle = [
            styles.lineRow,
            isHeading && styles.lineRowHeading,
            isBlockquote && styles.lineRowBlockquote,
          ];
          if (!hasBlockInLine && parts.length > 0) {
            nodes.push(
              (
                <View key={lineKey} style={lineRowStyle}>
                  {prefix}
                  <Text style={lineStyle}>{parts}</Text>
                </View>
              ) as React.ReactNode,
            );
          } else {
            nodes.push(
              (
                <View key={lineKey} style={lineRowStyle}>
                  {prefix}
                  {parts.length > 0 ? (
                    parts
                  ) : (
                    <Text style={lineStyle}>{content}</Text>
                  )}
                </View>
              ) as React.ReactNode,
            );
          }
        }
      });
      nodeKey += 1;
    });

    return nodes;
  }, [children, titleToStrip, referenceMetadata, validMentionHandles, inlineEnrichment]);

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
                key={`target-${target}-${index}`}
                style={styles.targetItem}
                onPress={() => {
                  setModalVisible(false);
                  handleLinkPress(target);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  t("post.linkedItems", "Linked Items") + `: ${target}`
                }
              >
                <Text style={styles.targetText}>{target}</Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t("common.close", "Close")}
            >
              <Text style={styles.closeButtonText}>
                {t("common.close", "Close")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Long-press post preview popover */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={previewPostId != null}
        onRequestClose={() => setPreviewPostId(null)}
      >
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setPreviewPostId(null)}
        >
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {previewMeta?.title ?? t("post.untitled", "Untitled")}
            </Text>
            {previewMeta?.bodyExcerpt ? (
              <Text style={styles.previewExcerpt} numberOfLines={3}>
                {previewMeta.bodyExcerpt}
              </Text>
            ) : null}
            {previewMeta?.deletedAt ? (
              <Text style={styles.previewDeleted}>
                {t("post.deletedContent", "(deleted content)")}
              </Text>
            ) : null}
            <Pressable
              style={styles.previewOpenButton}
              onPress={() => {
                setPreviewPostId(null);
                if (previewPostId) router.push(`/post/${previewPostId}`);
              }}
              accessibilityRole="button"
              accessibilityLabel={t("post.openPost", "Open post")}
            >
              <Text style={styles.previewOpenText}>
                {t("post.openPost", "Open post")} →
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export const MarkdownText = memo(
  MarkdownTextInner as React.FunctionComponent<MarkdownTextProps>,
) as (props: MarkdownTextProps) => React.ReactElement | null;

const styles = createStyles({
  container: {
    marginBottom: SPACING.m,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
    marginBottom: SPACING.xs,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginVertical: SPACING.l,
    marginBottom: SPACING.l,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginVertical: SPACING.l,
    marginBottom: SPACING.l,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginVertical: SPACING.m,
    marginBottom: SPACING.m,
  },
  blockquote: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: "italic",
    color: COLORS.secondary,
    fontFamily: FONTS.serifRegular,
    flex: 1,
    marginBottom: SPACING.xs,
  },
  blockquoteBar: {
    width: 4,
    marginRight: SPACING.m,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
    opacity: 0.5,
    alignSelf: "stretch",
    marginTop: 4,
    marginBottom: 4,
  },
  lineRowBlockquote: {
    paddingLeft: SPACING.s,
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
  },
  listItem: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
    flex: 1,
    marginBottom: SPACING.xs,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "bold",
    color: COLORS.tertiary,
    width: 20,
    fontFamily: FONTS.serifRegular,
  },
  number: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "bold",
    color: COLORS.tertiary,
    minWidth: 24,
    fontFamily: FONTS.serifRegular,
  },
  bold: {
    fontWeight: "700",
    fontFamily: FONTS.serifSemiBold,
    color: COLORS.paper,
  },
  italic: {
    fontStyle: "italic",
    fontFamily: FONTS.serifRegular,
  },
  inlineCode: {
    fontFamily: CODE_FONT,
    fontSize: 15,
    backgroundColor: COLORS.pressed,
    color: COLORS.paper,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  inlineCodeBlockWrap: {
    backgroundColor: COLORS.codeBackground,
    borderRadius: 8,
    padding: SPACING.m,
    marginVertical: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.pressed,
  },
  inlineCodeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 14,
    color: COLORS.codeText,
    lineHeight: 22,
  },
  codeBlockContainer: {
    backgroundColor: COLORS.codeBackground,
    borderRadius: 8,
    padding: SPACING.m,
    marginVertical: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.pressed,
  },
  codeBlockLine: {
    fontFamily: CODE_FONT,
    fontSize: 14,
    color: COLORS.codeText,
    lineHeight: 22,
  },
  lineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 0,
    position: "relative",
  },
  lineRowHeading: {
    marginBottom: SPACING.xs,
  },
  inlineLinkWrap: {
    alignSelf: "baseline",
  },
  /**
   * Inline text styles — all same font size as body text.
   * No View wrappers, no pills, no chips. Pure text that flows naturally.
   */
  postLinkText: {
    fontWeight: "600",
    fontStyle: "italic",
    color: COLORS.postLink,
    fontFamily: FONTS.serifSemiBold,
  },
  mentionText: {
    fontWeight: "600",
    color: COLORS.mention,
    fontFamily: FONTS.serifSemiBold,
  },
  /** Small colored circle with initial letter before @handle */
  mentionDot: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: COLORS.mentionDot ?? COLORS.mention,
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 4.5,
    paddingVertical: 1.5,
    fontFamily: FONTS.semiBold,
    lineHeight: 15,
  },
  topicTagText: {
    fontWeight: "600",
    color: COLORS.topic,
    fontFamily: FONTS.serifSemiBold,
  },
  urlLinkText: {
    fontWeight: "600",
    color: COLORS.link,
    fontFamily: FONTS.serifSemiBold,
    textDecorationLine: "none",
  },
  /** Wrapper for inline count — resets parent bold/color inheritance */
  inlineCountWrap: {
    fontWeight: "400",
    fontFamily: FONTS.regular,
  },
  /** Subscript-style number shown after topic/post names */
  inlineCountNum: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.inlineCount ?? "rgba(255,255,255,0.45)",
    fontFamily: FONTS.regular,
    letterSpacing: 0.3,
  },
  inlineLinkPressed: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: "center",
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
    alignItems: "center",
    padding: SPACING.m,
  },
  closeButtonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  // Long-press post preview
  previewOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  previewContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxWidth: 340,
    width: "100%",
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
  },
  previewExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.secondary,
    fontFamily: FONTS.serifRegular,
    marginBottom: SPACING.m,
  },
  previewDeleted: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontStyle: "italic",
    fontFamily: FONTS.serifRegular,
    marginBottom: SPACING.m,
  },
  previewOpenButton: {
    paddingVertical: SPACING.s,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.s,
  },
  previewOpenText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: FONTS.medium,
  },
});
