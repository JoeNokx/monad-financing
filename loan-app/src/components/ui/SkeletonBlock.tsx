import { View } from 'react-native';

export function SkeletonBlock(props: { className?: string }) {
  return <View className={props.className ?? 'h-4 w-24 rounded bg-gray-200'} />;
}
