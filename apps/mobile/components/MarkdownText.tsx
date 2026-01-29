import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface MarkdownTextProps {
  children: string;
  referenceMetadata?: Record<string, { title?: string }>;
}

export function MarkdownText({ children, referenceMetadata = {} }: MarkdownTextProps) {
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
      // Topic - Route to topic page
      // Url is likely the topic name or slug. 
      // We assume simple slugification or passing raw if the route handles it.
      // Ideally we should slugify.
      const slug = url.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      router.push(`/topic/${slug}`);
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

  // Improved markdown parser: headings, bold, italic, wikilinks
  const parseText = useMemo(() => {
    if (!children) return null;

    const lines = children.split('\n');
    const nodes: any[] = [];

    lines.forEach((line, lineIndex) => {
      // 1. Headings & Block Styles
      let lineStyle = styles.text;
      let content = line;
      let prefix = null;

      if (line.startsWith('# ')) {
        lineStyle = styles.h1;
        content = line.substring(2);
      } else if (line.startsWith('## ')) {
        lineStyle = styles.h2;
        content = line.substring(3);
      } else if (line.startsWith('### ')) {
        lineStyle = styles.h3;
        content = line.substring(4);
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
        const match = line.match(/^(\d+)\. /);
        const num = match ? match[1] : '1';
        content = line.substring(match ? match[0].length : 3);
        prefix = <Text style={styles.number}>{num}. </Text>;
      }

      // 2. Parse inline styles (Bold, Italic, Wikilinks)
      // This is a naive parser. For production, use a tokenizer/lexer approach.
      // We'll iterate through the string and match patterns.
      
      const parts: any[] = [];
      let lastIndex = 0;
      
      // Combine patterns: Bold (**), Italic (_), Wikilink ([[...]]), Standard Link [...]((...)), Mention (@...)
      // Note: This regex is simple and might fail on nested/complex cases
      const regex = /(\*\*(.*?)\*\*)|(_(.*?)_)|(\[\[(.*?)(?:\|(.*?))?\]\])|(\[(.*?)\]\((.*?)\))|(@[a-zA-Z0-9_]+)/g;
      
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
          parts.push(<Text key={`${lineIndex}-${lastIndex}`} style={lineStyle}>{content.substring(lastIndex, match.index)}</Text>);
        }

        // Bold (Group 1, 2)
        if (match[1]) {
          parts.push(<Text key={match.index} style={[lineStyle, styles.bold]}>{match[2]}</Text>);
        }
        // Italic (Group 3, 4)
        else if (match[3]) {
          parts.push(<Text key={match.index} style={[lineStyle, styles.italic]}>{match[4]}</Text>);
        }
        // Wikilink (Group 5, 6, 7)
        else if (match[5]) {
          const linkContent = match[6];
          let linkDisplay = match[7] || linkContent;
          const linkAlias = match[7];
          
          if (!linkAlias && linkContent.startsWith('post:')) {
             const id = linkContent.split(':')[1];
             if (referenceMetadata[id]?.title) {
                 linkDisplay = referenceMetadata[id].title;
             }
          }
          
          parts.push(
            <Text
              key={match.index}
              style={[lineStyle, styles.link]}
              onPress={() => handleWikiLinkPress(linkContent, linkAlias)}
            >
              {linkDisplay}
            </Text>
          );
        }
        // Standard Link (Group 8, 9, 10)
        else if (match[8]) {
          const linkText = match[9];
          const linkUrl = match[10];
          
          parts.push(
            <Text
              key={match.index}
              style={[lineStyle, styles.link]}
              onPress={() => handleLinkPress(linkUrl)}
            >
              {linkText}
            </Text>
          );
        }
        // Mention (Group 11)
        else if (match[11]) {
          const handle = match[11];
          parts.push(
            <Text
              key={match.index}
              style={[lineStyle, styles.link]}
              onPress={() => router.push(`/user/${handle.substring(1)}`)}
            >
              {handle}
            </Text>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      // Remaining text
      if (lastIndex < content.length) {
        parts.push(<Text key={`${lineIndex}-end`} style={lineStyle}>{content.substring(lastIndex)}</Text>);
      }

      // Empty line -> Paragraph spacing
      if (content.trim() === '') {
        nodes.push(<View key={lineIndex} style={{ height: SPACING.m }} />);
      } else {
        nodes.push(
          <View 
            key={lineIndex} 
            style={{
              flexDirection: 'row', 
              alignItems: 'flex-start',
              marginBottom: (lineStyle === styles.h1 || lineStyle === styles.h2 || lineStyle === styles.h3) ? SPACING.m : 0 
            }}
          >
            {prefix}
            <Text style={lineStyle}>
              {parts.length > 0 ? parts : content}
            </Text>
          </View>
        );
      }
    });

    return nodes;
  }, [children]);

  return (
    <>
      <Text style={styles.container}>{parseText}</Text>

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
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
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
    fontStyle: 'italic',
    color: COLORS.secondary,
    fontFamily: FONTS.serifRegular,
    paddingLeft: SPACING.m,
  },
  blockquoteBar: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 4,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
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
  link: {
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(110, 122, 138, 0.5)',
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