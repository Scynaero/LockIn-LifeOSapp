import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../services/BodyService';

interface AddCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (exercise: { name: string; target_muscle: string; secondary_muscles: string[]; equipment: string }) => void;
  exercises: Exercise[];
}

export default function AddCustomExerciseModal({ visible, onClose, onSave, exercises }: AddCustomExerciseModalProps) {
  const [name, setName] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<Set<string>>(new Set());
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [showSecondaryDropdown, setShowSecondaryDropdown] = useState(false);

  // Get unique muscles
  const muscleOptions = useMemo(() => {
    const muscles = new Set<string>();
    exercises.forEach(e => {
      const [group] = e.target_muscle.split('/');
      muscles.add(group);
    });
    return Array.from(muscles).sort();
  }, [exercises]);

  // Get unique equipment
  const equipmentOptions = useMemo(() => {
    return [...new Set(exercises.map(e => e.equipment))].sort();
  }, [exercises]);

  // Get secondary muscles for selected muscle
  const secondaryOptions = useMemo(() => {
    if (!selectedMuscle) return [];
    const secondaries = new Set<string>();
    exercises.forEach(e => {
      const [group] = e.target_muscle.split('/');
      if (group === selectedMuscle && e.secondary_muscles) {
        e.secondary_muscles.forEach((s: string) => {
          const [, muscle] = s.split('/');
          secondaries.add(muscle);
        });
      }
    });
    return Array.from(secondaries).sort();
  }, [selectedMuscle, exercises]);

  const handleToggleSecondary = (secondary: string) => {
    const newSet = new Set(selectedSecondary);
    if (newSet.has(secondary)) {
      newSet.delete(secondary);
    } else {
      newSet.add(secondary);
    }
    setSelectedSecondary(newSet);
  };

  const handleSave = () => {
    if (!name.trim() || !selectedMuscle || !selectedEquipment) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      name: name.trim(),
      target_muscle: selectedMuscle,
      secondary_muscles: Array.from(selectedSecondary),
      equipment: selectedEquipment,
    });

    // Reset form
    setName('');
    setSelectedMuscle(null);
    setSelectedEquipment(null);
    setSelectedSecondary(new Set());
  };

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-surface rounded-t-3xl border-t border-surfaceHighlight flex-1 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-surfaceHighlight">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-secondary text-sm font-bold">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg">Add Custom Exercise</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text className="text-primary font-bold text-sm">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
            {/* Exercise Name Input */}
            <View className="py-4 border-b border-surfaceHighlight">
              <Text className="text-white font-bold text-base mb-2">Exercise Name *</Text>
              <View className="bg-background rounded-lg px-4 py-3 border border-surfaceHighlight">
                <TextInput
                  className="text-white text-base"
                  placeholder="Enter exercise name"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Target Muscle Dropdown */}
            <View className="py-4 border-b border-surfaceHighlight">
              <Text className="text-white font-bold text-base mb-2">Target Muscle *</Text>
              <TouchableOpacity
                onPress={() => setShowMuscleDropdown(!showMuscleDropdown)}
                className="bg-background rounded-lg px-4 py-3 border border-surfaceHighlight flex-row items-center justify-between"
              >
                <Text className={selectedMuscle ? 'text-white text-base capitalize' : 'text-secondary text-base'}>
                  {selectedMuscle || 'Select target muscle'}
                </Text>
                <Ionicons
                  name={showMuscleDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              {showMuscleDropdown && (
                <View className="mt-2 bg-background rounded-lg border border-surfaceHighlight">
                  <FlatList
                    data={muscleOptions}
                    keyExtractor={item => item}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMuscle(item);
                          setSelectedSecondary(new Set()); // Reset secondary when muscle changes
                          setShowMuscleDropdown(false);
                        }}
                        className={`px-4 py-3 border-b border-surfaceHighlight ${selectedMuscle === item ? 'bg-primary/20' : ''
                          }`}
                      >
                        <Text className={`capitalize ${selectedMuscle === item ? 'text-primary font-bold' : 'text-secondary'}`}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            {/* Equipment Dropdown */}
            <View className="py-4 border-b border-surfaceHighlight">
              <Text className="text-white font-bold text-base mb-2">Equipment *</Text>
              <TouchableOpacity
                onPress={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                className="bg-background rounded-lg px-4 py-3 border border-surfaceHighlight flex-row items-center justify-between"
              >
                <Text className={selectedEquipment ? 'text-white text-base capitalize' : 'text-secondary text-base'}>
                  {selectedEquipment || 'Select equipment'}
                </Text>
                <Ionicons
                  name={showEquipmentDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              {showEquipmentDropdown && (
                <View className="mt-2 bg-background rounded-lg border border-surfaceHighlight">
                  <FlatList
                    data={equipmentOptions}
                    keyExtractor={item => item}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedEquipment(item);
                          setShowEquipmentDropdown(false);
                        }}
                        className={`px-4 py-3 border-b border-surfaceHighlight ${selectedEquipment === item ? 'bg-primary/20' : ''
                          }`}
                      >
                        <Text className={`capitalize ${selectedEquipment === item ? 'text-primary font-bold' : 'text-secondary'}`}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

            {/* Secondary Muscles Multi-select */}
            {selectedMuscle && secondaryOptions.length > 0 && (
              <View className="py-4 border-b border-surfaceHighlight">
                <Text className="text-white font-bold text-base mb-2">Secondary Muscles (Optional)</Text>
                <TouchableOpacity
                  onPress={() => setShowSecondaryDropdown(!showSecondaryDropdown)}
                  className="bg-background rounded-lg px-4 py-3 border border-surfaceHighlight flex-row items-center justify-between"
                >
                  <Text className={selectedSecondary.size > 0 ? 'text-white text-base' : 'text-secondary text-base'}>
                    {selectedSecondary.size > 0 ? `${selectedSecondary.size} selected` : 'Select secondary muscles'}
                  </Text>
                  <Ionicons
                    name={showSecondaryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>

                {showSecondaryDropdown && (
                  <View className="mt-2 bg-background rounded-lg border border-surfaceHighlight">
                    <FlatList
                      data={secondaryOptions}
                      keyExtractor={item => item}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => handleToggleSecondary(item)}
                          className={`px-4 py-3 border-b border-surfaceHighlight flex-row items-center ${selectedSecondary.has(item) ? 'bg-primary/20' : ''
                            }`}
                        >
                          <Ionicons
                            name={selectedSecondary.has(item) ? 'checkbox' : 'checkbox-outline'}
                            size={20}
                            color={selectedSecondary.has(item) ? '#CCFF00' : '#666'}
                            style={{ marginRight: 12 }}
                          />
                          <Text className={`capitalize ${selectedSecondary.has(item) ? 'text-primary font-bold' : 'text-secondary'}`}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>

  );
}
