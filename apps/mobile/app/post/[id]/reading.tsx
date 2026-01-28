import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../../../utils/api';
import { MarkdownText } from '../../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReadingModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const [postData, sourcesData] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/sources`).catch(() => [])
      ]);
      setPost(postData);
      setSources(sourcesData);
    } catch (error) {
      console.error('Failed to load post', error);
      Alert.alert(t('common.error'), t('post.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const [fontSize, setFontSize] = useState(18);

  const toggleTextSize = () => {
    setFontSize(prev => prev >= 24 ? 16 : prev + 2);
  };

  const printToPdf = async () => {
    if (!post) return;
    
    try {
      const html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;600&display=swap');
              body { 
                font-family: 'IBM Plex Serif', serif; 
                padding: 40px; 
                color: #1a1a1a; 
                line-height: 1.6; 
                max-width: 800px; 
                margin: 0 auto; 
              }
              h1 { font-size: 32px; margin-bottom: 8px; font-weight: 600; line-height: 1.2; }
              .meta { font-size: 14px; color: #666; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; font-family: sans-serif; }
              .content { font-size: 18px; color: #333; }
              .content p { margin-bottom: 1.4em; }
              .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-family: sans-serif; }
            </style>
          </head>
          <body>
            <h1>${post.title || 'Untitled Post'}</h1>
            <div class="meta">
              By ${post.author?.displayName || post.author?.handle} • ${new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="content">
              ${post.body.split('\n').map((p: string) => p.trim() ? `<p>${p}</p>` : '').join('')}
            </div>
            <div class="footer">
              Archived via CITE (https://cite.app/post/${post.id})
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation failed', error);
      Alert.alert(t('common.error'), 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color={COLORS.secondary} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={toggleTextSize} style={styles.iconButton}>
            <MaterialIcons name="format-size" size={22} color={COLORS.secondary} />
          </Pressable>
          <Pressable onPress={printToPdf} style={styles.iconButton}>
            <MaterialIcons name="print" size={22} color={COLORS.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.article}>
          {post.title && <Text style={styles.title}>{post.title}</Text>}
          
          <Pressable 
            style={styles.authorLine}
            onPress={() => router.push(`/user/${post.author?.handle}`)}
          >
            <View style={styles.authorAvatar}>
               <Text style={styles.avatarText}>{post.author?.displayName?.charAt(0) || '?'}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle}</Text>
              <Text style={styles.readTime}>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </Pressable>

          {/* Reading Mode Content - Uses Serif Font */}
          <MarkdownText 
            fontSize={fontSize} 
            fontFamily={FONTS.serifRegular}
            lineHeight={fontSize * 1.6}
            color={COLORS.paper} // slightly softer white?
          >
            {post.body}
          </MarkdownText>
        </View>

        {/* Sources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>
          {sources.length === 0 ? (
            <Text style={styles.emptyText}>No external sources found.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {sources.map((source: any, index: number) => {
                const domain = source.url ? new URL(source.url).hostname.replace('www.', '') : 'source';
                return (
                  <Pressable
                    key={index}
                    style={styles.sourceItem}
                    onPress={() => source.url && Linking.openURL(source.url)}
                  >
                    <Text style={styles.sourceIndex}>{index + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sourceDomain}>{domain}</Text>
                      <Text style={styles.sourceTitle} numberOfLines={2}>
                        {source.title || source.url}
                      </Text>
                    </View>
                    <MaterialIcons name="north-east" size={16} color={COLORS.tertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable 
          style={styles.bottomBarButton}
          onPress={() => {/* Toggle keep */}}
        >
          <MaterialIcons name="bookmark-border" size={24} color={COLORS.tertiary} />
        </Pressable>
        <Pressable 
          style={styles.bottomBarButton}
          onPress={() => {
             const url = `https://cite.app/post/${post.id}`;
             Sharing.shareAsync(url);
          }}
        >
          <MaterialIcons name="share" size={24} color={COLORS.tertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: SPACING.l, paddingBottom: 100 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.l, 
    paddingBottom: SPACING.m,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.divider 
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.l },
  iconButton: { padding: SPACING.xs },
  
  article: { marginTop: SPACING.xl, marginBottom: SPACING.xxl },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.paper, 
    marginBottom: SPACING.l, 
    fontFamily: FONTS.serifSemiBold,
    lineHeight: 34,
  },
  authorLine: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.m, 
    marginBottom: SPACING.xl, 
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  authorAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  authorName: { 
    fontSize: 15, 
    color: COLORS.paper, 
    fontFamily: FONTS.medium 
  },
  readTime: { 
    fontSize: 13, 
    color: COLORS.tertiary, 
    fontFamily: FONTS.regular 
  },
  
  section: {
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  emptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  sourceIndex: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontFamily: FONTS.mono,
    marginTop: 2,
  },
  sourceDomain: {
    color: COLORS.primary,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
  },
  sourceTitle: {
    color: COLORS.secondary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  
  bottomBar: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: SPACING.xxxl, 
    paddingTop: SPACING.l, 
    backgroundColor: COLORS.ink,
    borderTopWidth: 1, 
    borderTopColor: COLORS.divider 
  },
  bottomBarButton: { padding: SPACING.s },
  errorText: { color: COLORS.error, fontSize: 16, fontFamily: FONTS.medium },
});
