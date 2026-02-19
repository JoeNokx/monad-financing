import { Pressable, Text } from 'react-native';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function Button({ title, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-md px-4 py-3 ${disabled ? 'bg-gray-300' : 'bg-blue-600'}`}
    >
      <Text className="text-center font-semibold text-white">{title}</Text>
    </Pressable>
  );
}
