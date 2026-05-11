import { Redirect } from 'expo-router';

/**
 * The Scan tab is an action button (see app/(tabs)/_layout.tsx — its
 * tabBarButton fires the camera instead of navigating). This route exists
 * only as a fallback in case someone reaches /scan via deep link or
 * back-stack — bounce them home, where the scan affordance lives.
 */
export default function ScanRedirect() {
  return <Redirect href="/" />;
}
