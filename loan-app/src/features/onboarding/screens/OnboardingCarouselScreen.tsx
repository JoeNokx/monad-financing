import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, ImageBackground, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  description: string;
  image: any;
};

function Dots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={String(i)}
            className={active ? 'h-2.5 w-8 rounded-full bg-white' : 'h-2.5 w-2.5 rounded-full bg-white/40'}
          />
        );
      })}
    </View>
  );
}

export default function OnboardingCarouselScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 'easy-loans',
        title: 'Easy Loans',
        description:
          'Get instant access to personal and business\nloans with minimal requirements. Apply in\nminutes and get approved fast.',
        image: require('../../../../assets/onboarding/easy-loans.jpg'),
      },
      {
        key: 'flexible-repayment',
        title: 'Flexible Repayment',
        description:
          'Choose your repayment schedule that works for\nyou. Pay early and save on interest. We reward\nresponsible borrowers.',
        image: require('../../../../assets/onboarding/flexible-repayment.jpg'),
      },
      {
        key: 'secure-trusted',
        title: 'Secure & Trusted',
        description:
          'Bank-level security protects your data. Your\ninformation is encrypted and safe. Join\nthousands of satisfied customers.',
        image: require('../../../../assets/onboarding/secure-trusted.jpg'),
      },
    ],
    [],
  );

  const listRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }

  function finish() {
    router.replace('/(auth)/sign-in');
  }

  const isLast = activeIndex === slides.length - 1;

  return (
    <View className="flex-1 bg-black">
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(next);
        }}
        renderItem={({ item }) => {
          return (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
              <ImageBackground source={item.image} resizeMode="cover" style={{ flex: 1 }}>
                <View className="absolute inset-0 bg-black/20" />
                <View className="absolute bottom-0 left-0 right-0 h-40 bg-black/35" />
                <View className="absolute bottom-0 left-0 right-0 h-64 bg-black/55" />
                <View className="absolute bottom-0 left-0 right-0 h-96 bg-black/70" />
              </ImageBackground>
            </View>
          );
        }}
      />

      <View style={{ paddingTop: insets.top + 16 }} className="absolute left-0 right-0 top-0 px-5">
        <View className="flex-row justify-end">
          <Pressable onPress={finish} className="rounded-full bg-gray-200/40 px-5 py-2">
            <Text className="font-semibold text-white">Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="absolute bottom-0 left-0 right-0 px-5">
        <View className="px-1">
          <Text className="text-4xl font-semibold text-white">{slides[activeIndex]?.title}</Text>
          <View className="h-3" />
          <Text className="text-base leading-6 text-white/80">{slides[activeIndex]?.description}</Text>
        </View>

        <View className="h-6" />
        <Dots total={slides.length} activeIndex={activeIndex} />
        <View className="h-5" />

        <Pressable
          onPress={() => {
            if (isLast) {
              finish();
              return;
            }
            goTo(activeIndex + 1);
          }}
          className="h-14 items-center justify-center rounded-2xl bg-white"
        >
          <Text className="text-base font-semibold text-blue-700">{isLast ? 'Get Started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
