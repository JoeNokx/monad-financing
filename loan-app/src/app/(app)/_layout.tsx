import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <>
      <SignedIn>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#7C3AED',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarIcon: ({ color, size }) => {
              const name = (() => {
                switch (route.name) {
                  case 'home':
                    return 'home-outline';
                  case 'loans':
                    return 'briefcase-outline';
                  case 'more':
                    return 'menu-outline';
                  case 'profile':
                    return 'person-outline';
                  default:
                    return 'ellipse-outline';
                }
              })();

              return <Ionicons name={name as any} size={size} color={color} />;
            },
          })}
        >
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="loans" options={{ title: 'Loans' }} />
          <Tabs.Screen name="more" options={{ title: 'More' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </SignedIn>

      <SignedOut>
        <Redirect href="/(auth)/sign-in" />
      </SignedOut>
    </>
  );
}
