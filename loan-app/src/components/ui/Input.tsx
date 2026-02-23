import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
};

export function Input({ value, placeholder, onChangeText, secureTextEntry }: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const showToggle = useMemo(() => Boolean(secureTextEntry), [secureTextEntry]);

  return (
    <View className="w-full flex-row items-center rounded-md border border-gray-200 bg-white px-3 py-3">
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={showToggle ? hidden : secureTextEntry}
        className="flex-1"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
      />

      {showToggle ? (
        <Pressable
          onPress={() => setHidden((v) => !v)}
          accessibilityRole="button"
          hitSlop={10}
        >
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
        </Pressable>
      ) : null}
    </View>
  );
}
