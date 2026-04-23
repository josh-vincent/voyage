import { View, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import { Chip } from '@/components/Chip';
import SkeletonLoader from '@/components/SkeletonLoader';
import List from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import { Link } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import TabScreenWrapper from '@/components/TabScreenWrapper';
import Icon, { IconName } from '@/components/Icon';

type NotificationType = 'purchase' | 'message' | 'review' | 'offer' | 'seller' | 'all' | 'booking' | 'payment' | 'inquiry' | 'cancellation';

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: IconName;
  user?: User; // Optional user field for notifications from other users
}

const SEEDED_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'offer',
    title: 'Fare dropped to Tokyo',
    message: 'JFK → HND fell by $84. It is now the lowest price this week.',
    time: '8 min ago',
    read: false,
    icon: 'TrendingDown',
  },
  {
    id: 2,
    type: 'booking',
    title: 'Booking confirmed',
    message: 'Your New York → Los Angeles trip is ticketed and ready to go.',
    time: '1 hour ago',
    read: true,
    icon: 'Ticket',
  },
  {
    id: 3,
    type: 'message',
    title: 'Concierge update',
    message: 'I found a cheaper weekend option via Austin with a shorter layover.',
    time: '2 hours ago',
    read: false,
    icon: 'MessageCircle',
  },
  {
    id: 4,
    type: 'booking',
    title: 'Check-in opens tomorrow',
    message: 'Tap through to save your seat and finish check-in when the window opens.',
    time: '5 hours ago',
    read: true,
    icon: 'Clock',
  },
  {
    id: 5,
    type: 'payment',
    title: 'Price lock reminder',
    message: 'Your fare hold for Lisbon expires tonight at 11:45 PM.',
    time: '1 day ago',
    read: false,
    icon: 'CreditCard',
  },
  {
    id: 6,
    type: 'offer',
    title: 'New deal from San Francisco',
    message: 'SFO → Austin is back under $240 round-trip for next weekend.',
    time: '2 days ago',
    read: true,
    icon: 'Sparkles',
  },
  {
    id: 7,
    type: 'message',
    title: 'Itinerary ready',
    message: 'Your 4-day Lisbon plan is saved with museums, late dinners, and a day trip.',
    time: '3 days ago',
    read: false,
    icon: 'Map',
  },
  {
    id: 8,
    type: 'cancellation',
    title: 'Watch ended',
    message: 'The London fare hold expired, but I can keep tracking fresh prices for you.',
    time: '5 days ago',
    read: true,
    icon: 'RefreshCcw',
  },
];

export default function NotificationsScreen() {
  const [selectedType, setSelectedType] = useState<NotificationType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsData, setNotificationsData] = useState<Notification[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotificationsData(SEEDED_NOTIFICATIONS);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter notifications based on selected type
  const filteredNotifications = notificationsData.filter(notification =>
    selectedType === 'all' ? true : notification.type === selectedType
  );

  

  return (
    <>
      <Header 
        showBackButton 
        title="Notifications" 
      />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <View className="p-4 flex-row gap-1">
          <Chip
            label="All"
            isSelected={selectedType === 'all'}
            onPress={() => setSelectedType('all')}
          />
          <Chip label="Trips" isSelected={selectedType === 'booking'} onPress={() => setSelectedType('booking')} />
          <Chip
            label="Messages"
            isSelected={selectedType === 'message'}
            onPress={() => setSelectedType('message')}
          />
          <Chip
            label="Fares"
            isSelected={selectedType === 'offer'}
            onPress={() => setSelectedType('offer')}
          />
          <Chip
            label="Payments"
            isSelected={selectedType === 'payment'}
            onPress={() => setSelectedType('payment')}
          />
        </View>

        <ThemedScroller>
          {isLoading ? (
            <View className="p-4">
              <SkeletonLoader variant="list" count={6} />
            </View>
          ) : (
            <List variant="divided">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <View key={notification.id}>
                    {renderNotification(notification)}
                  </View>
                ))
              ) : (
                <View className="p-8 items-center">
                  <ThemedText>No notifications found</ThemedText>
                </View>
              )}
            </List>
          )}
        </ThemedScroller>
      </View>
    </>
  );
}

export const renderNotification = (notification: Notification) => (

    <ListItem
      leading={
        notification.user ? (
          <Image
            source={{ uri: notification.user.avatar }}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <View className="bg-light-secondary/30 dark:bg-dark-subtext/30 w-10 h-10 rounded-full items-center justify-center">
            <Icon name={notification.icon} size={20} />
          </View>
        )
      }
      title={
        <ThemedText className="font-bold">{notification.title}</ThemedText>
      }
      subtitle={notification.message}
      trailing={
        <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
          {notification.time}
        </ThemedText>
      }
      className={`py-4 ${!notification.read ? 'bg-light-secondary/5 dark:bg-dark-secondary/5' : ''}`}
    />

);
