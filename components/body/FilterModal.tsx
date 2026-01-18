import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (equipment: string | null, muscle: string | null, secondary: string | null) => void;
  exercises: any[];
}

export default function FilterModal({ visible, onClose, onApply, exercises }: FilterModalProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);

  const equipmentOptions = useMemo(() => [...new Set(exercises.map(e => e.equipment))], [exercises]);

  const muscleOptions = useMemo(() => {
    const muscles = new Set<string>();
    exercises.forEach(e => {
      const [group] = e.target_muscle.split('/');
      muscles.add(group);
    });
    return Array.from(muscles).sort();
  }, [exercises]);

  const secondaryOptions = useMemo(() => {
    if (!selectedMuscle) return [];
    const secondaries = new Set<string>();
    exercises.forEach(e => {
      const [group] = e.target_muscle.split('/');
      if (group === selectedMuscle && e.secondary_muscles) {
        e.secondary_muscles.forEach((s: string) => {
          const parts = s.split('/');
          const muscle = parts.length > 1 ? parts[1] : parts[0];
          if (muscle) {
            secondaries.add(muscle);
          }
        });
      }
    });
    return Array.from(secondaries).sort();
  }, [selectedMuscle, exercises]);

  const handleApply = () => {
    onApply(selectedEquipment, selectedMuscle, selectedSecondary);
    onClose();
  };

  const handleReset = () => {
    setSelectedEquipment(null);
    setSelectedMuscle(null);
    setSelectedSecondary(null);
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-surface rounded-t-3xl border-t border-surfaceHighlight flex-1 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-surfaceHighlight">
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-primary font-bold text-sm">Reset</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Equipment Filter */}
            <View className="px-4 py-4 border-b border-surfaceHighlight">
              <Text className="text-white font-bold text-base mb-3">Equipment</Text>
              <View className="flex-row flex-wrap gap-2">
                {equipmentOptions.map(eq => (
                  <TouchableOpacity
                    key={eq}
                    onPress={() => setSelectedEquipment(selectedEquipment === eq ? null : eq)}
                    className={`px-3 py-2 rounded-full border ${selectedEquipment === eq
                      ? 'bg-primary border-primary'
                      : 'bg-background border-surfaceHighlight'
                      }`}
                  >
                    <Text className={`text-xs font-bold capitalize ${selectedEquipment === eq ? 'text-black' : 'text-secondary'
                      }`}>
                      {eq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Muscle Group Filter */}
            <View className="px-4 py-4 border-b border-surfaceHighlight">
              <Text className="text-white font-bold text-base mb-3">Muscle Group</Text>
              <View className="flex-row flex-wrap gap-2">
                {muscleOptions.map(muscle => (
                  <TouchableOpacity
                    key={muscle}
                    onPress={() => {
                      setSelectedMuscle(selectedMuscle === muscle ? null : muscle);
                      setSelectedSecondary(null); // Reset secondary
                    }}
                    className={`px-3 py-2 rounded-full border ${selectedMuscle === muscle
                      ? 'bg-primary border-primary'
                      : 'bg-background border-surfaceHighlight'
                      }`}
                  >
                    <Text className={`text-xs font-bold capitalize ${selectedMuscle === muscle ? 'text-black' : 'text-secondary'
                      }`}>
                      {muscle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Secondary Muscle Filter */}
            {selectedMuscle && secondaryOptions.length > 0 && (
              <View className="px-4 py-4 border-b border-surfaceHighlight">
                <Text className="text-white font-bold text-base mb-3">Specific Muscle</Text>
                <View className="flex-row flex-wrap gap-2">
                  {secondaryOptions.map(secondary => (
                    <TouchableOpacity
                      key={secondary}
                      onPress={() => setSelectedSecondary(selectedSecondary === secondary ? null : secondary)}
                      className={`px-3 py-2 rounded-full border ${selectedSecondary === secondary
                        ? 'bg-primary border-primary'
                        : 'bg-background border-surfaceHighlight'
                        }`}
                    >
                      <Text className={`text-xs font-bold ${selectedSecondary === secondary ? 'text-black' : 'text-secondary'
                        }`}>
                        {secondary}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View className="p-4 border-t border-surfaceHighlight">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary p-4 rounded-xl items-center"
            >
              <Text className="text-black font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>

  );
}
