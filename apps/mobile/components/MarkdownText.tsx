import React, { useState, useMemo, memo, isValidElement } from "react";
import { Text, View, Modal, Pressable, Platform, TextStyle } from "react-native";
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

interface MarkdownTextProps {
  children: string;
  referenceMetadata?: Record<
    string,
    { title?: string; deletedAt?: string; isProtected?: boolean }
  >;
  /** When set, only @handle that are in this set render as mention chips; others render as plain text (no @). Omit for published content to render all @ as mentions. */
  validMentionHandles?: Set<string> | null;
  /** When set (e.g. post.title in full view), the first line "# &lt;title&gt;" is not rendered so the title is not shown twice. */
  stripLeadingH1IfMatch?: string | null;
}

function MarkdownTextInner({
  children,
  referenceMetadata = {},
  validMentionHandles,
  stripLeadingH1IfMatch: titleToStrip,
}: MarkdownTextProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { openExternalLink } = useOpenExternalLink();
  const [modalVisible, setModalVisible] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [alias, setAlias] = useState("");

  const handleLinkPress = async (url: string | null | undefined) => {
    if (url == null || typeof url !== "string") return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("http")) {
      await openExternalLink(trimmed);
    } else if (trimmed.startsWith("post:")) {
      const id = trimmed.split(":")[1];
      if (id) router.push(`/post/${id}`);
    } else {
      // Topic: use exact wikilink target as topic ID (no slugification).
      // [[Artificial Intelligence]] → /topic/Artificial%20Intelligence, [[AI]] → /topic/AI
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

  // Supported: H1/H2/H3, bold **, italic _, blockquote > , list - , ordered 1. , inline code `, fenced code ```...```, [[wikilink]], [link](url), @mention
  const parseText = useMemo(() => {
    /** Single unified rule for [text](url) display: use label when provided, else for external URLs show hostname. Used in composer preview and all reading views. */
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
      // Only composer-supported inline: Bold (**), Italic (_), Inline code (`), Link [...](...), Wikilink ([[...]]), Mention (@...)
      // Match single-bracket [text](url) BEFORE double-bracket [[...]] so [name](https://...) is always an external link, never mis-parsed as topic/post.
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
          // Recursively parse bold content so inline code (and other markdown) inside renders correctly
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
          // Recursively parse italic content so inline code (and other markdown) inside renders correctly
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
          // Markdown link [text](url) or [url](text) — matched before wikilink so [name](https://...) is always external
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
              numberOfLines={1}
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
          if (!aliasVal && linkContentVal.startsWith("post:")) {
            const id = linkContentVal.split(":")[1] ?? "";
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
          const wikilinkStyle = linkContentVal.toLowerCase().startsWith("post:")
            ? styles.postLinkText
            : linkContentVal.startsWith("http")
              ? styles.urlLinkText
              : styles.topicTagText;
          parts.push(
            <Text
              key={`${lineKey}-${match.index}`}
              style={[lineStyle, wikilinkStyle]}
              onPress={() => handleWikiLinkPress(linkContentVal, aliasVal)}
              numberOfLines={1}
            >
              {linkDisplay}
            </Text>,
          );
        } else if (match[13]) {
          const handle = match[13].substring(1);
          const isValidMention =
            validMentionHandles == null || validMentionHandles.has(handle);
          if (isValidMention) {
            parts.push(
              <Text
                key={`${lineKey}-${match.index}`}
                style={[lineStyle, styles.mentionText]}
                onPress={() => router.push(`/user/${handle}`)}
              >
                {match[13]}
              </Text>,
            );
          } else {
            // Don't render @ when user wasn't selected from suggestions / doesn't exist — show handle only (no @)
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
    // No line breaks before/after [[]], [text](url), @mention: collapse to space so they render inline
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
        i += 1; // skip opening ``` or ```lang
        const codeLines: string[] = [];
        while (i < lines.length) {
          if (lines[i].trim().startsWith("```")) {
            i += 1; // skip closing ```
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
          </View> as React.ReactNode,
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
          nodes.push(<View key={lineKey} style={{ height: SPACING.m }} /> as React.ReactNode);
        } else {
          const parts = parseLineContent(content, lineStyle, lineKey);
          const hasBlockInLine = parts.some(
            (p) =>
              isValidElement(p) && (p as { type?: unknown }).type === View,
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
              <View key={lineKey} style={lineRowStyle}>
                {prefix}
                <Text style={lineStyle}>{parts}</Text>
              </View> as React.ReactNode,
            );
          } else {
            nodes.push(
              <View key={lineKey} style={lineRowStyle}>
                {prefix}
                {parts.length > 0 ? (
                  parts
                ) : (
                  <Text style={lineStyle}>{content}</Text>
                )}
              </View> as React.ReactNode,
            );
          }
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
                key={`target-${target}-${index}`}
                style={styles.targetItem}
                onPress={() => {
                  setModalVisible(false);
                  handleLinkPress(target);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("post.linkedItems", "Linked Items") + `: ${target}`}
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
              <Text style={styles.closeButtonText}>{t("common.close", "Close")}</Text>
            </Pressable>
          </View>
        </View>
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
    fontFamily: FONTS.serifRegular, // Body text = Serif
    marginBottom: SPACING.xs,
  },
  /* H1/H2/H3: distinct sizes – H1 (title-level) > H2 (section) > H3 (subsection) */
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
    fontFamily: FONTS.serifRegular, // Quote = Serif
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
    fontFamily: FONTS.serifRegular, // List = Serif
    flex: 1,
    marginBottom: SPACING.xs,
  },
  bullet: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "bold",
    color: COLORS.tertiary,
    width: 20,
    fontFamily: FONTS.serifRegular, // Bullet matches text font
  },
  number: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "bold",
    color: COLORS.tertiary,
    minWidth: 24,
    fontFamily: FONTS.serifRegular, // Number matches text font
  },
  bold: {
    fontWeight: "700",
    fontFamily: FONTS.serifSemiBold, // Bold body = Serif SemiBold
    color: COLORS.paper,
  },
  italic: {
    fontStyle: "italic",
    fontFamily: FONTS.serifRegular,
  },
  /* Inline code `code` – darker bg, mono font */
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
  /* Multi-line inline code (backticks with newlines) */
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
  /* Fenced code block ```...``` */
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
  /* Tags, links, mentions – same font as body (serif), bold and distinct colors from design-tokens */
  inlineLinkWrap: {
    alignSelf: "baseline",
  },
  /** [[post:id]] in-body links */
  postLinkText: {
    fontWeight: "700",
    color: COLORS.postLink ?? COLORS.primary,
    fontFamily: FONTS.serifSemiBold,
  },
  /** @mention – design-tokens COLORS.mention */
  mentionText: {
    fontWeight: "700",
    color: COLORS.mention ?? COLORS.primary,
    fontFamily: FONTS.serifSemiBold,
  },
  /** [[Topic]] tags – design-tokens COLORS.topic */
  topicTagText: {
    fontWeight: "700",
    color: COLORS.topic ?? COLORS.primary,
    fontFamily: FONTS.serifSemiBold,
  },
  /* External URL links – design-tokens COLORS.link; open in-app browser */
  urlLinkText: {
    fontWeight: "600",
    color: COLORS.link,
    fontFamily: FONTS.serifSemiBold,
    textDecorationLine: "none",
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
});
