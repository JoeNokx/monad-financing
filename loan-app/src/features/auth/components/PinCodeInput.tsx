import { useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
};

export function PinCodeInput({ value, onChange, length = 4 }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(id);
  }, []);

  const digits = Array.from({ length }).map((_, idx) => value[idx] ?? '');

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      className="flex-row justify-center gap-4"
      accessibilityRole="button"
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const next = text.replace(/\D+/g, '').slice(0, length);
          onChange(next);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        className="absolute h-0 w-0 opacity-0"
      />

      {digits.map((d, i) => {
        const isActive = i === Math.min(value.length, length - 1);
        const filled = Boolean(d);
        return (
          <View
            key={String(i)}
            className={`h-14 w-14 items-center justify-center rounded-2xl border ${filled || isActive ? 'border-blue-700' : 'border-gray-200'} bg-white`}
          >
            <Text className="text-2xl font-semibold text-gray-900">{d}</Text>
          </View>
        );
      })}
    </Pressable>
  );
}
