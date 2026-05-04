import { Link, Stack } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import GeoGlyph from '@/components/GeoGlyph';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import { BRICK, INK, PARCHMENT, PARCHMENT_DEEP, SERIF } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen />
      <Header title=" " showBackButton />
      <View className="flex-1 justify-center px-global" style={{ backgroundColor: PARCHMENT }}>
        <View className="rounded-3xl p-5" style={{ backgroundColor: PARCHMENT_DEEP }}>
          <View className="flex-row items-start justify-between">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: INK }}>
              <Icon name="AlertCircle" size={19} color={PARCHMENT} />
            </View>
            <GeoGlyph kind="compass" size={58} color={INK} accent={BRICK} />
          </View>
          <Text
            className="mt-16"
            style={{ color: INK, fontFamily: SERIF, fontSize: 28, letterSpacing: -0.35 }}>
            This route is off-map
          </Text>
          <Text
            className="mt-2"
            style={{
              color: INK,
              fontSize: 13,
              fontStyle: 'italic',
              lineHeight: 19,
              opacity: 0.62,
            }}>
            The page you were looking for does not exist or has moved.
          </Text>
          <Link href="/" asChild>
            <Pressable
              className="mt-6 flex-row items-center justify-center rounded-full px-5 py-3.5"
              style={{ backgroundColor: INK }}>
              <Text style={{ color: PARCHMENT, fontFamily: SERIF, fontSize: 15 }}>Back home</Text>
              <Icon name="ArrowRight" size={14} color={PARCHMENT} />
            </Pressable>
          </Link>
        </View>
      </View>
    </>
  );
}
