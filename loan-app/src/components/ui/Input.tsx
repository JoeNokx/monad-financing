import { TextInput } from 'react-native';

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
};

export function Input({ value, placeholder, onChangeText, secureTextEntry }: Props) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      className="w-full rounded-md border border-gray-200 bg-white px-3 py-3"
      placeholderTextColor="#9CA3AF"
      autoCapitalize="none"
    />
  );
}
