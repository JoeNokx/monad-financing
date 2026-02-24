import { View } from 'react-native';

import { SkeletonBlock } from './SkeletonBlock';

export function AppSkeleton() {
  return (
    <View className="flex-1 bg-white px-5 pt-12">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 rounded-full bg-gray-200" />
          <View>
            <SkeletonBlock className="h-5 w-28 rounded bg-gray-200" />
            <View className="h-2" />
            <SkeletonBlock className="h-4 w-40 rounded bg-gray-200" />
          </View>
        </View>
        <View className="h-12 w-12 rounded-full bg-gray-200" />
      </View>

      <View className="h-8" />

      <View className="rounded-3xl bg-white p-5">
        <SkeletonBlock className="h-3 w-28 rounded bg-gray-200" />
        <View className="h-4" />
        <View className="rounded-2xl bg-gray-50 p-4">
          <SkeletonBlock className="h-5 w-44 rounded bg-gray-200" />
          <View className="h-2" />
          <SkeletonBlock className="h-4 w-64 rounded bg-gray-200" />
        </View>
        <View className="h-4" />
        <SkeletonBlock className="h-12 w-full rounded-full bg-gray-200" />
      </View>

      <View className="h-5" />

      <View className="rounded-3xl bg-gray-100 p-5">
        <SkeletonBlock className="h-5 w-48 rounded bg-gray-200" />
        <View className="h-3" />
        <SkeletonBlock className="h-4 w-72 rounded bg-gray-200" />
        <View className="h-4" />
        <SkeletonBlock className="h-11 w-32 rounded-full bg-gray-200" />
      </View>
    </View>
  );
}
