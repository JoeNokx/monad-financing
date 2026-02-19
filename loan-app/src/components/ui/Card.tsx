import { PropsWithChildren } from 'react';
import { View } from 'react-native';

type Props = PropsWithChildren<{ className?: string }>;

export function Card({ children, className }: Props) {
  return <View className={`rounded-lg border border-gray-200 bg-white p-4 ${className ?? ''}`}>{children}</View>;
}
