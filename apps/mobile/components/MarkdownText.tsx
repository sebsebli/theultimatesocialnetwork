import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Linking, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface MarkdownTextProps {
  children: string;
}

export function MarkdownText({ children }: MarkdownTextProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [targets, setTargets] = useState<string[]>([]);
  const [alias, setAlias] = useState('');

  const handleLinkPress = (url: string) => {
    if (url.startsWith('http')) {
      Linking.openURL(url);
    } else if (url.startsWith('post:')) {
      const id = url.split(':')[1];
      router.push(`/post/${id}`);
    } else {
      // Topic
      router.push(`/explore?tab=topics&q=${url}`);
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
      // 1. Headings
      let lineStyle = styles.text;
      let content = line;

      if (line.startsWith('# ')) {
        lineStyle = styles.h1;
        content = line.substring(2);
      } else if (line.startsWith('## ')) {
        lineStyle = styles.h2;
        content = line.substring(3);
      } else if (line.startsWith('### ')) {
        lineStyle = styles.h3;
        content = line.substring(4);
      }

      // 2. Parse inline styles (Bold, Italic, Wikilinks)
      // This is a naive parser. For production, use a tokenizer/lexer approach.
      // We'll iterate through the string and match patterns.
      
      const parts: any[] = [];
      let lastIndex = 0;
      
      // Combine patterns: Bold (**), Italic (_), Wikilink ([[...]])
      // Note: This regex is simple and might fail on nested/complex cases
      const regex = /(\*\*(.*?)\*\*)|(_(.*?)_)|(\[\[(.*?)(?:\|(.*?))?\]\])/g;
      
      let match;
      while ((match = regex.exec(content)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
          parts.push(<Text key={`${lineIndex}-${lastIndex}`} style={lineStyle}>{content.substring(lastIndex, match.index)}</Text>);
        }

        // Bold
        if (match[1]) {
          parts.push(<Text key={match.index} style={[lineStyle, styles.bold]}>{match[2]}</Text>);
        }
        // Italic
        else if (match[3]) {
          parts.push(<Text key={match.index} style={[lineStyle, styles.italic]}>{match[4]}</Text>);
        }
        // Wikilink
        else if (match[5]) {
          const linkContent = match[6];
          const linkDisplay = match[7] || linkContent;
          const linkAlias = match[7];
          
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

        lastIndex = match.index + match[0].length;
      }

      // Remaining text
      if (lastIndex < content.length) {
        parts.push(<Text key={`${lineIndex}-end`} style={lineStyle}>{content.substring(lastIndex)}</Text>);
      }

      nodes.push(
        <Text key={lineIndex} style={lineStyle}>
          {parts.length > 0 ? parts : content}
          {lineIndex < lines.length - 1 ? '\n' : ''}
        </Text>
      );
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
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
  },
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
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
    textDecorationLine: 'underline',
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