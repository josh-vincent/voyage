import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Switch from '@/components/forms/Switch';
import Section from '@/components/layout/Section';
import { INK, PARCHMENT_DEEP, SERIF } from '@/lib/theme';

const NotificationsScreen = () => {
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    bookingUpdates: true,
    hostMessages: true,
    paymentConfirmations: true,
    reviewRequests: true,
    checkInReminders: true,
    specialOffers: false,
    hostPromotions: false,
    travelTips: false,
    marketingEmails: false,
  });

  const handleToggle = (setting: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const saveSettings = () => {
    navigation.goBack();
  };

  return (
    <View className="bg-light-bg dark:bg-dark-bg flex-1">
      <Header
        showBackButton
        rightComponents={[<Button title="Save changes" onPress={saveSettings} />]}
      />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="mt-10 pb-10"
          title="Notifications"
          subtitle="Stay updated on your bookings and travel plans"
        />

        <View className="mb-8">
          <ThemedText
            className="mb-4"
            style={{ color: INK, fontFamily: SERIF, fontSize: 18, letterSpacing: -0.2 }}>
            Booking & Travel
          </ThemedText>

          <Switch
            label="Booking Updates"
            description="Confirmations, changes, and cancellations"
            value={notifications.bookingUpdates}
            onChange={(value) => handleToggle('bookingUpdates', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Host Messages"
            description="Messages from your hosts and property owners"
            value={notifications.hostMessages}
            onChange={(value) => handleToggle('hostMessages', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Payment Confirmations"
            description="Receipts and payment processing updates"
            value={notifications.paymentConfirmations}
            onChange={(value) => handleToggle('paymentConfirmations', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Review Requests"
            description="Reminders to review your stays and experiences"
            value={notifications.reviewRequests}
            onChange={(value) => handleToggle('reviewRequests', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Check-in Reminders"
            description="Important information before your arrival"
            value={notifications.checkInReminders}
            onChange={(value) => handleToggle('checkInReminders', value)}
            disabled={!notifications.pushEnabled}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />
        </View>

        <View className="mt-8">
          <ThemedText
            className="mb-4"
            style={{ color: INK, fontFamily: SERIF, fontSize: 18, letterSpacing: -0.2 }}>
            Promotions & Marketing
          </ThemedText>

          <Switch
            label="Special Offers"
            description="Discounts and deals on accommodations"
            value={notifications.specialOffers}
            onChange={(value) => handleToggle('specialOffers', value)}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Host Promotions"
            description="Exclusive offers from your favorite hosts"
            value={notifications.hostPromotions}
            onChange={(value) => handleToggle('hostPromotions', value)}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Travel Tips"
            description="Destination guides and travel recommendations"
            value={notifications.travelTips}
            onChange={(value) => handleToggle('travelTips', value)}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />

          <Switch
            label="Marketing Emails"
            description="Newsletters and destination inspiration"
            value={notifications.marketingEmails}
            onChange={(value) => handleToggle('marketingEmails', value)}
            className="mb-2 rounded-2xl px-4 py-4"
            style={{ backgroundColor: PARCHMENT_DEEP }}
          />
        </View>
      </ThemedScroller>
    </View>
  );
};

export default NotificationsScreen;
