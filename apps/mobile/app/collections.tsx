import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface Collection {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
}

export default function CollectionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await api.get('/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load collections', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollections();
  }, []);

  const renderItem = useCallback(({ item }: { item: Collection }) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.item, pressed && { backgroundColor: COLORS.hover }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/collections/${item.id}`);
      }}
      accessibilityRole="button"
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.itemDescription}>{item.description}</Text>
      )}
      <Text style={styles.itemCount}>
        {t('collections.itemCount', { count: item.itemCount })}
      </Text>
    </Pressable>
  ), [router]);

  const keyExtractor = useCallback((item: Collection) => item.id, []);

  const createCollection = async () => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post('/collections', { title: newTitle.trim(), description: newDescription.trim() });
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      loadCollections();
    } catch (error) {
      console.error('Failed to create collection', error);
      showError(t('collections.failedCreate'));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('collections.title')}</Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityLabel={t('collections.create')}
          accessibilityRole="button"
        >
          <Text style={styles.createButton}>{t('common.create')}</Text>
        </Pressable>
      </View>

      {collections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('collections.empty')}</Text>
          <Pressable
            style={styles.button}
            onPress={() => setModalVisible(true)}
            accessibilityLabel={t('collections.create')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('collections.create')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('collections.newTitle')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('collections.titlePlaceholder')}
              placeholderTextColor={COLORS.tertiary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder={t('collections.descPlaceholder')}
              placeholderTextColor={COLORS.tertiary}
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.modalButtonCreate} onPress={createCollection}>
                <Text style={styles.modalButtonTextCreate}>{t('common.create')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  createButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  loadingText: {
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.secondary,
    marginBottom: SPACING.xl,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  item: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: SPACING.s,
    fontFamily: FONTS.regular,
  },
  itemCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  input: {
    backgroundColor: COLORS.hover,
    color: COLORS.paper,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    marginBottom: SPACING.m,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    fontFamily: FONTS.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  modalButtonCancel: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
  },
  modalButtonCreate: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalButtonTextCreate: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});




