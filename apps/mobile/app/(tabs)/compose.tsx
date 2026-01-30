import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ComposeRedirect() {
  const params = useLocalSearchParams<{ quote?: string; replyTo?: string }>();
  const query = new URLSearchParams();
  if (params.quote) query.set('quote', params.quote);
  if (params.replyTo) query.set('replyTo', params.replyTo);
  const qs = query.toString();
  return <Redirect href={qs ? `/post/compose?${qs}` : '/post/compose'} />;
}
