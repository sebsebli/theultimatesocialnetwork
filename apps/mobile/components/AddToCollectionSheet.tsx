import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

import { Collection } from '../types';

export interface AddToCollectionSheetRef {
  open: (postId: string) => void;
  close: () => void;
}

interface AddToCollectionSheetProps { }

const AddToCollectionSheetBase = forwardRef<AddToCollectionSheetRef, AddToCollectionSheetProps>((props, ref): React.ReactElement | null => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [visible, setVisible] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setPostId(id);
      setVisible(true);
      loadCollections(id);
    },
    close: () => setVisible(false),
  }));

  const loadCollections = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/collections?postId=${id}`);
      setCollections(data);
    } catch (error) {
      showError(t('collections.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const newCollection = await api.post('/collections', {
        title: newTitle,
        isPublic: newIsPublic,
      });

      setCollections([newCollection, ...collections]);
      setCreating(false);
      setNewTitle('');

      // Auto-add post to new collection
      if (postId) {
        handleToggle(newCollection.id, false);
      }
    } catch (error) {
      showError(t('collections.createFailed'));
    }
  };

  const handleToggle = async (collectionId: string, currentHasPost: boolean) => {
    // Optimistic update
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, hasPost: !currentHasPost } : c
    ));

    try {
      if (currentHasPost) {
        await api.delete(`/collections/${collectionId}/items?postId=${postId}`);
      } else {
        await api.post(`/collections/${collectionId}/items`, { postId });
      }
    } catch (error) {
      // Revert
      setCollections(prev => prev.map(c =>
        c.id === collectionId ? { ...c, hasPost: currentHasPost } : c
      ));
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e: any) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('post.addToCollection', 'Add to collection')}</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={10}>
                <MaterialIcons name="close" size={24} color={COLORS.secondary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={collections}
                keyExtractor={(item: Collection) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }: { item: Collection }) => (
                  <Pressable
                    style={styles.item}
                    onPress={() => handleToggle(item.id, !!item.hasPost)}
                  >
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemPrivacy}>
                          {item.isPublic ? t('common.public') : t('common.private')}
                        </Text>
                        {item.itemCount > 0 && (
                          <Text style={styles.itemCount}>• {t('collections.itemsCount', { count: item.itemCount })}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[
                      styles.checkbox,
                      item.hasPost && styles.checkboxChecked
                    ]}>
                      {item.hasPost && (
                        <MaterialIcons name="check" size={16} color="#FFF" />
                      )}
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={!creating ? (
                  <Text style={styles.emptyText}>{t('collections.empty')}</Text>
                ) : null}
              />
            )}

            <View style={styles.footer}>
              {creating ? (
                <View style={styles.createForm}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('collections.titlePlaceholder')}
                    placeholderTextColor={COLORS.secondary}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />
                  <View style={styles.createActions}>
                    <Pressable
                      style={styles.privacyToggle}
                      onPress={() => setNewIsPublic(!newIsPublic)}
                    >
                      <View style={[styles.switch, newIsPublic && styles.switchActive]}>
                        <View style={[styles.thumb, newIsPublic && styles.thumbActive]} />
                      </View>
                      <Text style={styles.privacyText}>
                        {newIsPublic ? t('common.public') : t('common.private')}
                      </Text>
                    </Pressable>
                    <View style={styles.buttons}>
                      <Pressable onPress={() => setCreating(false)} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreate}
                        disabled={!newTitle.trim()}
                        style={[styles.createButton, !newTitle.trim() && styles.disabledButton]}
                      >
                        <Text style={styles.createText}>{t('common.create')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.newButton}
                  onPress={() => setCreating(true)}
                >
                  <MaterialIcons name="add" size={24} color={COLORS.primary} />
                  <Text style={styles.newButtonText}>{t('collections.new', 'New Collection')}</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  ) as React.ReactElement;
});

const AddToCollectionSheet = AddToCollectionSheetBase as any;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    maxHeight: '80%',
    paddingBottom: SPACING.xxl,
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  list: {
    padding: SPACING.l,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.paper,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  itemPrivacy: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  itemCount: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    padding: SPACING.l,
    backgroundColor: COLORS.ink, // Match ink background
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    padding: SPACING.m,
    backgroundColor: COLORS.hover, // Use theme hover
    borderRadius: SIZES.borderRadius,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  createForm: {
    gap: SPACING.m,
  },
  input: {
    backgroundColor: COLORS.hover,
    borderRadius: 8,
    padding: SPACING.m,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  createActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  switch: {
    width: 36,
    height: 20,
    backgroundColor: COLORS.hover,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  privacyText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  cancelButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  cancelText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.secondary,
    paddingVertical: SPACING.l,
    fontFamily: FONTS.regular,
  },
});

export default AddToCollectionSheet;
