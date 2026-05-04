import { Link } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import { BRICK, INK, PARCHMENT, PARCHMENT_DEEP, SERIF } from '@/lib/theme';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

const mockChats: ChatUser[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastMessage:
      'Hey, how are you doing? Just checking in to see if you received the files I sent.',
    timestamp: '2m ago',
    unread: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'The meeting has been rescheduled to tomorrow at 2 PM.',
    timestamp: '1h ago',
    unread: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Thanks for your help!',
    timestamp: '2h ago',
    unread: false,
  },
];

export default function ChatListScreen() {
  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <Link href={`/screens/chat/${item.id}`} asChild>
      <Pressable
        className="flex-row items-center rounded-2xl p-4"
        style={{ backgroundColor: item.unread ? PARCHMENT_DEEP : 'rgba(239,236,230,0.62)' }}>
        <Avatar size="md" src={item.avatar} name={item.name} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text style={{ color: INK, fontFamily: SERIF, fontSize: 15, letterSpacing: -0.1 }}>
              {item.name}
            </Text>
            <Text className="ml-auto" style={{ color: INK, fontSize: 11, opacity: 0.5 }}>
              {item.timestamp}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center">
            <Text
              numberOfLines={1}
              className="flex-1 pr-3"
              style={{
                color: INK,
                fontSize: 12,
                fontStyle: item.unread ? 'normal' : 'italic',
                opacity: item.unread ? 0.72 : 0.52,
              }}>
              {item.lastMessage}
            </Text>
            {item.unread ? (
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: BRICK }} />
            ) : (
              <Icon name="ChevronRight" size={14} color={INK} />
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <Header title="Messages" showBackButton />
      <FlatList
        data={mockChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="pb-4">
            <Text style={{ color: INK, fontFamily: SERIF, fontSize: 30, letterSpacing: -0.3 }}>
              Messages
            </Text>
            <Text
              className="mt-1"
              style={{ color: INK, fontSize: 13, fontStyle: 'italic', opacity: 0.6 }}>
              Travel threads and trip support in one place.
            </Text>
          </View>
        }
      />
    </View>
  );
}
