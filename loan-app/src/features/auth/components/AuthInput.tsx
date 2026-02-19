import { Input } from '../../../components/ui/Input';

type Props = {
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
};

export function AuthInput(props: Props) {
  return <Input {...props} />;
}
