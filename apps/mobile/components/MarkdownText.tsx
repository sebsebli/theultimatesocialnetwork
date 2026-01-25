import React, { useState } from 'react';
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

  // Basic markdown parser (bold, italic, links)
  // This is a simplified version. Production apps should use a robust parser like react-native-markdown-display
  // customized to handle [[wikilinks]].
  
  const parseText = (text: string) => {
    if (!text) return null;

    const parts = [];
    let lastIndex = 0;
    
    // Regex for [[target|alias]] or [[target]]
    const wikiRegex = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
    let match: RegExpExecArray | null;

    while ((match = wikiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<Text key={lastIndex} style={styles.text}>{text.substring(lastIndex, match.index)}</Text>);
      }

      const content = match[1];
      const display = match[2] || content;
      const alias = match[2];
      
      parts.push(
        <Text
          key={match.index}
          style={styles.link}
          onPress={() => handleWikiLinkPress(content, alias)}
        >
          {display}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<Text key={lastIndex} style={styles.text}>{text.substring(lastIndex)}</Text>);
    }

    return parts;
  };

  return (
    <>
      <Text style={styles.container}>{parseText(children)}</Text>

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
    fontFamily: FONTS.serifRegular, // IBM Plex Serif for content
  },
  link: {
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontFamily: FONTS.serifRegular, // IBM Plex Serif for content links
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
