import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { useThemeColors } from '@/contexts/ThemeColors';
import {
  BRICK,
  INK,
  MOSS,
  MOSS_SOFT,
  PARCHMENT,
  PARCHMENT_COOL,
  PARCHMENT_DEEP,
  SERIF,
} from '@/lib/theme';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type LoopStep = {
  title: string;
  status: 'ready' | 'running' | 'gated';
  detail: string;
  command: string;
};

const LOOP_STEPS: LoopStep[] = [
  {
    title: 'Capture',
    status: 'ready',
    detail: 'Screenshot, AX tree, and device state are stored in the review bundle.',
    command: 'agent-sim serve --port 8421',
  },
  {
    title: 'Markup',
    status: 'ready',
    detail: 'Comments attach to elements, frames, and source-search hints.',
    command: 'open http://127.0.0.1:8421/reviews',
  },
  {
    title: 'Enhance',
    status: 'running',
    detail: 'Source edits, diffs, and task events are recorded for review.',
    command: 'agent-sim review-tasks add-code-change <task-id> --path <file>',
  },
  {
    title: 'Verify',
    status: 'gated',
    detail: 'A screen only passes with score >= 8/10 and no high recommendation.',
    command: 'agent-sim agent quality-gate <task-id> --score 8.5 --highest-recommendation none',
  },
];

const REVIEW_CRITERIA = [
  'Home search folio',
  'Tracked routes',
  'Trip timeline',
  'Assistant chat',
  'Profile and settings',
  'Agent Sim loop',
];

export default function AgentSimScreen() {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const [copied, setCopied] = useState<string | null>(null);
  const command = useMemo(
    () =>
      [
        'agent-sim agent bootstrap',
        '--project /Users/miniai/jv/voyage',
        '--bundle-id com.tocld.voyage',
        '--name "Voyage dev-build review"',
      ].join(' '),
    [],
  );

  const copy = (_value: string, label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Agent Sim' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: isDark ? INK : PARCHMENT }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 18 }}>
        <View style={{ gap: 10 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              backgroundColor: isDark ? 'rgba(241,236,228,0.10)' : PARCHMENT_COOL,
            }}>
            <Text style={{ color: isDark ? PARCHMENT : INK, fontSize: 12, fontWeight: '700' }}>
              DX TOOLCHAIN
            </Text>
          </View>
          <Text
            selectable
            style={{
              color: isDark ? PARCHMENT : INK,
              fontFamily: SERIF,
              fontSize: 34,
              lineHeight: 40,
            }}>
            Agent Sim
          </Text>
          <Text
            selectable
            style={{
              color: isDark ? 'rgba(241,236,228,0.76)' : 'rgba(19,26,42,0.72)',
              fontSize: 15,
              lineHeight: 22,
            }}>
            Simulator capture, markup, source change audit, and screen review are run as one
            feedback loop for the Voyage dev build.
          </Text>
        </View>

        <View
          style={{
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: isDark ? 'rgba(241,236,228,0.08)' : PARCHMENT_DEEP,
            padding: 16,
            gap: 14,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: isDark ? PARCHMENT : INK, fontWeight: '800', fontSize: 15 }}>
                Bootstrap loop
              </Text>
              <Text style={{ color: isDark ? 'rgba(241,236,228,0.64)' : 'rgba(19,26,42,0.58)', fontSize: 13 }}>
                Creates the review session and starter tasks.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => copy(command, 'bootstrap')}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? PARCHMENT : INK,
              }}>
              <Icon name="Copy" size={18} color={isDark ? INK : PARCHMENT} />
            </Pressable>
          </View>
          <Text
            selectable
            style={{
              color: isDark ? PARCHMENT : INK,
              fontSize: 12,
              lineHeight: 18,
              fontVariant: ['tabular-nums'],
            }}>
            {command}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          {LOOP_STEPS.map((step, index) => (
            <LoopRow
              key={step.title}
              step={step}
              index={index}
              isDark={isDark}
              copied={copied === step.title}
              onCopy={() => copy(step.command, step.title)}
            />
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="BadgeCheck" size={19} color={MOSS} />
            <ThemedText style={{ color: isDark ? PARCHMENT : INK, fontWeight: '800', fontSize: 17 }}>
              Review gate
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REVIEW_CRITERIA.map((item) => (
              <View
                key={item}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: isDark ? 'rgba(31,107,67,0.28)' : MOSS_SOFT,
                }}>
                <Text style={{ color: isDark ? PARCHMENT : MOSS, fontSize: 12, fontWeight: '700' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function LoopRow({
  step,
  index,
  isDark,
  copied,
  onCopy,
}: {
  step: LoopStep;
  index: number;
  isDark: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const statusColor = step.status === 'gated' ? BRICK : step.status === 'running' ? MOSS : INK;

  return (
    <View
      style={{
        borderRadius: 8,
        borderCurve: 'continuous',
        padding: 14,
        gap: 10,
        backgroundColor: isDark ? 'rgba(241,236,228,0.075)' : '#fbfaf6',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(241,236,228,0.10)' : 'rgba(19,26,42,0.08)',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(241,236,228,0.12)' : PARCHMENT_COOL,
          }}>
          <Text style={{ color: isDark ? PARCHMENT : INK, fontWeight: '800' }}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: isDark ? PARCHMENT : INK, fontSize: 16, fontWeight: '800' }}>
            {step.title}
          </Text>
          <Text style={{ color: isDark ? 'rgba(241,236,228,0.62)' : 'rgba(19,26,42,0.58)', fontSize: 12 }}>
            {step.detail}
          </Text>
        </View>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 5,
            backgroundColor: isDark ? 'rgba(241,236,228,0.10)' : PARCHMENT_DEEP,
          }}>
          <Text style={{ color: isDark ? PARCHMENT : statusColor, fontSize: 11, fontWeight: '800' }}>
            {copied ? 'COPIED' : step.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onCopy}>
        <Text
          selectable
          style={{
            color: isDark ? 'rgba(241,236,228,0.82)' : 'rgba(19,26,42,0.74)',
            fontSize: 12,
            lineHeight: 18,
          }}>
          {step.command}
        </Text>
      </Pressable>
    </View>
  );
}
