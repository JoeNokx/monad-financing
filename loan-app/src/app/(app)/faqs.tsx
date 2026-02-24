import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

function AccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white">
      <Pressable onPress={onToggle} accessibilityRole="button" className="flex-row items-center justify-between px-5 py-4">
        <Text className="flex-1 pr-4 text-base font-semibold text-gray-900">{item.question}</Text>
        <Ionicons name={open ? 'remove' : 'add'} size={22} color="#111827" />
      </Pressable>

      {open ? (
        <View className="px-5 pb-4">
          <Text className="leading-6 text-gray-600">{item.answer}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function FaqsScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo<FaqItem[]>(
    () => [
      {
        question: 'What is MONaD Financing?',
        answer:
          'MONaD Financing is a digital lending platform that helps you request and manage loans directly from the app. Placeholder text: this section will contain a clear description of the service.',
      },
      {
        question: 'Who can apply for a loan?',
        answer:
          'Anyone who meets the basic eligibility requirements can apply. Placeholder text: include age requirements, valid ID, and any verification steps needed.',
      },
      {
        question: 'How do I apply for a loan?',
        answer:
          'Open the app, go to Request Loan, choose your loan type, enter the amount and duration, then confirm. Placeholder text: steps will be finalized later.',
      },
      {
        question: 'How long does it take to get my loan?',
        answer:
          'Loan processing time varies. Placeholder text: typically approvals and disbursements can happen quickly depending on verification and network availability.',
      },
      {
        question: 'What is the interest rate?',
        answer:
          'Interest depends on the loan product and selected duration. Placeholder text: rates will be shown in-app before you confirm the loan request.',
      },
      {
        question: 'How do I repay my loan?',
        answer:
          'You can repay using the repayment option in the app. Placeholder text: the available payment methods and steps will be listed here.',
      },
      {
        question: 'What happens if I miss a repayment?',
        answer:
          'Missing a repayment may result in penalties and may affect your eligibility for future loans. Placeholder text: the exact policy will be documented here.',
      },
      {
        question: 'Is my personal information safe?',
        answer:
          'We take security seriously and protect your data. Placeholder text: this section will describe encryption, access controls, and privacy practices.',
      },
      {
        question: 'Can I borrow again after repaying?',
        answer:
          'Yes, after successful repayment you may be eligible to borrow again. Placeholder text: eligibility depends on your repayment history and available limits.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'You can contact support from the More tab. Placeholder text: include WhatsApp number, in-app chat, and support hours.',
      },
    ],
    [],
  );

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="px-5 pb-10 pt-12">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-xl font-semibold text-gray-900">Frequently Asked Questions</Text>
      </View>

      <View className="h-6" />

      <View className="gap-3">
        {items.map((item, idx) => {
          const open = openIndex === idx;
          return (
            <AccordionItem
              key={item.question}
              item={item}
              open={open}
              onToggle={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
