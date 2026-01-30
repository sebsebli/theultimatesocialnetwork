import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS, HEADER, MODAL } from '../constants/theme';

import { Collection } from '../types';

export interface AddToCollectionSheetRef {
  open: (postId: string) => void;
  close: () => void;
}

interface AddToCollectionSheetProps { }

const AddToCollectionSheetBase = forwardRef<AddToCollectionSheetRef, AddToCollectionSheetProps>((props, ref): React.ReactElement | null => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const [visible, setVisible] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('post.addToCollection', 'Add to collection')}</Text>
            <Pressable onPress={() => setVisible(false)} hitSlop={10} style={({ pressed }: { pressed: boolean }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}>
              <MaterialIcons name="close" size={HEADER.iconSize} color={COLORS.tertiary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={collections}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item: Collection) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: Collection }) => (
                <Pressable
                  style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && styles.itemPressed]}
                  onPress={() => handleToggle(item.id, !!item.hasPost)}
                >
                  <View style={styles.itemIconWrap}>
                    <MaterialIcons name="folder" size={HEADER.iconSize} color={item.hasPost ? COLORS.primary : COLORS.tertiary} />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemMetaText}>
                        {item.itemCount != null && item.itemCount > 0 ? `${item.itemCount} ${item.itemCount === 1 ? t('collections.item', 'item') : t('collections.items', 'items')}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.checkbox, item.hasPost && styles.checkboxChecked]}>
                    {item.hasPost && <MaterialIcons name="check" size={16} color={COLORS.ink} />}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={!creating ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="folder-open" size={32} color={COLORS.tertiary} />
                  <Text style={styles.emptyText}>{t('collections.empty', 'No collections yet')}</Text>
                  <Text style={styles.emptyHint}>{t('collections.emptyHint', 'Create one below.')}</Text>
                </View>
              ) : null}
            />
          )}

          <View style={styles.footer}>
            {creating ? (
              <View style={styles.createForm}>
                <TextInput
                  style={styles.input}
                  placeholder={t('collections.titlePlaceholder', 'Collection name')}
                  placeholderTextColor={COLORS.tertiary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <View style={styles.actions}>
                  <Pressable onPress={() => setCreating(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreate}
                    disabled={!newTitle.trim()}
                    style={[styles.createBtn, !newTitle.trim() && styles.createBtnDisabled]}
                  >
                    <Text style={styles.createBtnText}>{t('common.create')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.newBtn, pressed && styles.newBtnPressed]}
                onPress={() => setCreating(true)}
              >
                <MaterialIcons name="add" size={HEADER.iconSize} color={COLORS.ink} style={styles.newBtnIcon} />
                <Text style={styles.newBtnText}>{t('collections.new', 'New Collection')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  ) as React.ReactElement;
});

const AddToCollectionSheet = AddToCollectionSheetBase as any;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL.backdropBackgroundColor,
  },
  sheet: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderTopLeftRadius: MODAL.sheetBorderRadius,
    borderTopRightRadius: MODAL.sheetBorderRadius,
    borderWidth: MODAL.sheetBorderWidth,
    borderBottomWidth: MODAL.sheetBorderBottomWidth,
    borderColor: MODAL.sheetBorderColor,
    paddingHorizontal: MODAL.sheetPaddingHorizontal,
    paddingTop: MODAL.sheetPaddingTop,
    maxHeight: '85%',
  },
  handle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: 'center',
    marginTop: MODAL.handleMarginTop,
    marginBottom: MODAL.handleMarginBottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: MODAL.sheetTitleFontSize,
    fontWeight: MODAL.sheetTitleFontWeight,
    color: MODAL.sheetTitleColor,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  closeBtn: {
    padding: SPACING.s,
  },
  closeBtnPressed: { opacity: 0.7 },
  loader: { marginVertical: SPACING.xl },
  listContent: {
    paddingBottom: SPACING.m,
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  itemPressed: { opacity: 0.85 },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontSize: 15,
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  itemMeta: { marginTop: 2 },
  itemMetaText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.s,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.s,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
    marginTop: SPACING.s,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    backgroundColor: MODAL.primaryButtonBackgroundColor,
    borderRadius: MODAL.buttonBorderRadius,
  },
  newBtnPressed: { opacity: 0.9 },
  newBtnIcon: { marginRight: SPACING.s },
  newBtnText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.primaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
  createForm: { gap: SPACING.m },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  privacyLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  privacyOptionActive: {
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    borderColor: COLORS.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  privacyOptionTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  actions: { flexDirection: 'row', gap: SPACING.m },
  cancelBtn: {
    flex: 1,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MODAL.buttonBorderRadius,
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  cancelBtnText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
  createBtn: {
    flex: 1,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MODAL.buttonBorderRadius,
    backgroundColor: MODAL.primaryButtonBackgroundColor,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.primaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});

export default AddToCollectionSheet;
