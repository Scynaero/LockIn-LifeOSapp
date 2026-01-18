# 🏋️ Body Module - Exercise Tracking System

## Overview
The Body Module is a comprehensive workout tracking system with anatomically precise exercise data and a searchable exercise picker interface. It's designed to support future 3D anatomy visualization.

---

## 📊 Exercise Database

### File: `assets/exercises.json`
**Total Exercises:** 122+ exercises with anatomical targeting

### Data Structure
Each exercise includes:
```json
{
  "id": "bench_press_barbell",
  "name": "Bench Press (Barbell)",
  "target_muscle": "chest/pectoralis major",
  "secondary_muscles": ["chest/pectoralis minor", "arms/triceps", "shoulders/anterior deltoid"],
  "equipment": "barbell",
  "category_icon": "🏋️",
  "is_custom": 0
}
```

### Key Fields Explained

#### `target_muscle` (Anatomical Format)
Format: `{body_region}/{specific_muscle}`

**Examples:**
- `chest/pectoralis major` - Main chest muscle
- `back/latissimus dorsi` - Lat muscle
- `legs/quadriceps` - Front thigh
- `core/rectus abdominis` - Six-pack muscle
- `shoulders/anterior deltoid` - Front shoulder

#### `secondary_muscles`
Array of muscles that get worked as secondary targets
- Empty array `[]` = isolation exercise
- Multiple entries = compound exercise

#### `equipment`
- `barbell` - Olympic barbell
- `dumbbell` - Free weights
- `machine` - Gym machine
- `cable` - Cable machine
- `bodyweight` - No equipment

#### `category_icon`
Visual emoji for UI representation:
- `🏋️` - Barbell & Dumbbell
- `💪` - Bodyweight
- `🤖` - Machine
- `🔌` - Cable

---

## 🏗️ Architecture

### Core Services

#### `BodyService.ts`
Main service for workout management:
```typescript
- getExercises() → Exercise[]
- startWorkout(name, date) → string (id)
- getWorkoutsForDate(dateStr) → Workout[]
- finishWorkout(id, duration, bodyweight) → void
- addSet(workoutId, exerciseId, weight, reps, rpe, type) → string
- getSetsForWorkout(workoutId) → WorkoutSet[]
```

#### `Exercise` Interface (Updated)
```typescript
interface Exercise {
  id: string;
  name: string;
  target_muscle: string;              // New: Anatomical format
  secondary_muscles?: string[];        // New: Secondary targets
  equipment: string;
  category_icon?: string;              // New: Visual emoji
  is_custom: number;
}
```

---

## 🎨 UI Components

### File: `components/body/ExercisePicker.tsx` (Updated)

**Features:**
1. **Search Functionality**
   - Search by exercise name
   - Search by muscle group

2. **Equipment Filter**
   - Filter by: barbell, dumbbell, machine, cable, bodyweight
   - Visual emoji indicators

3. **Muscle Group Filter**
   - Filter by body region: chest, back, legs, arms, shoulders, core, forearm, glutes
   - Organized by anatomical grouping

4. **Exercise Display**
   - Exercise name
   - Primary muscle targeted
   - Equipment type
   - Secondary muscle count
   - Visual icon

### File: `app/(tabs)/body.tsx`

**Tabs:**
1. **LIFT** - Active workout logging
2. **LIVE** - Real-time workout tracking (coming soon)
3. **PROGRESS** - Workout statistics

---

## 💪 Exercise Categories by Target Muscle

### Chest (14 exercises)
- `chest/pectoralis major` - Main chest
- `chest/pectoralis minor` - Underneath pec
- `chest/clavicular pectoralis` - Upper chest
- `chest/sternal pectoralis` - Lower chest
- `chest/serratus anterior` - Side ribs

### Back (21 exercises)
- `back/latissimus dorsi` - Lat pulldown, rows
- `back/erector spinae` - Lower back, deadlifts
- `back/rhomboid` - Upper back
- `back/trapezius` - Shoulders/upper back
- `back/posterior deltoid` - Rear shoulder

### Legs (33 exercises)
- `legs/quadriceps` - Front thigh
- `legs/hamstring` - Back thigh
- `legs/glutes` / `legs/gluteus maximus` - Glute muscles
- `legs/gluteus medius` - Side hip
- `legs/adductors` - Inner thigh
- `legs/gastrocnemius` - Calf
- `legs/soleus` - Lower calf

### Shoulders (9 exercises)
- `shoulders/anterior deltoid` - Front shoulder
- `shoulders/lateral deltoid` - Side shoulder
- `shoulders/posterior deltoid` - Rear shoulder

### Arms (18 exercises)
- `arms/biceps` - Front arm
- `arms/triceps` - Back arm
- `arms/brachialis` - Under bicep

### Core (11 exercises)
- `core/rectus abdominis` - Six-pack abs
- `core/obliques` - Side abs
- `core/transverse abdominis` - Deep core

### Forearm (2 exercises)
- `forearm/flexors` - Inner forearm
- `forearm/extensors` - Outer forearm

---

## 📱 Usage Flow

### 1. Start Workout
- User taps "START" button on LIFT tab
- Creates new workout record for selected date

### 2. Add Exercise
- User taps "+" button
- Exercise picker modal opens
- User searches/filters exercises
- Taps exercise to add

### 3. Log Sets
- Exercise appears in active workout
- User logs weight, reps, RPE
- Can add multiple sets per exercise

### 4. Finish Workout
- User taps "FINISH"
- Logs workout duration and bodyweight
- Saves all workout data

---

## 🔜 Future Enhancements

### 3D Anatomy Silhouette (Placeholder Ready)
**Location:** `app/(tabs)/body.tsx` (Coming Soon section)

The UI is prepared with:
- Muscle targeting data (anatomical format)
- Secondary muscle tracking
- Interactive visualization space

**Next Steps for Implementation:**
1. Create 3D human body model
2. Map exercises to 3D mesh regions
3. Highlight muscles based on logged exercises
4. Show heat map of most-worked muscles

### Database Schema
The exercises table will need:
```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_muscle TEXT NOT NULL,
  secondary_muscles TEXT,    -- JSON array stored as string
  equipment TEXT NOT NULL,
  category_icon TEXT,
  is_custom INTEGER DEFAULT 0
);
```

---

## 🎯 Search Examples

### By Exercise Name
- Search "bench" → Shows all bench press variants
- Search "squat" → Shows all squat variations
- Search "row" → Shows all row exercises

### By Muscle Group
- Search "chest" → Shows all chest exercises
- Search "quadriceps" → Shows leg pressing/extension
- Search "biceps" → Shows arm curling exercises

### By Equipment
- Filter "barbell" → Olympic barbell exercises
- Filter "bodyweight" → No equipment needed
- Filter "machine" → Gym machine exercises

---

## 🔧 Configuration

### Adding New Exercises
Add to `assets/exercises.json`:
```json
{
  "id": "custom_exercise_id",
  "name": "Exercise Name",
  "target_muscle": "muscle_group/specific_muscle",
  "secondary_muscles": ["group1/muscle1", "group2/muscle2"],
  "equipment": "barbell|dumbbell|machine|cable|bodyweight",
  "category_icon": "🏋️",
  "is_custom": 0
}
```

### Customizing Icons
Update `category_icon` mapping in ExercisePicker.tsx:
```typescript
const getIconForEquipment = (equipment: string) => {
  const iconMap: Record<string, string> = {
    barbell: '🏋️',
    dumbbell: '🏋️',
    machine: '🤖',
    cable: '🔌',
    bodyweight: '💪'
  };
  return iconMap[equipment] || '🎯';
};
```

---

## 📈 Analytics Ready
All exercise data is structured to enable:
- ✅ Muscle group distribution per workout
- ✅ Exercise frequency tracking
- ✅ Equipment usage patterns
- ✅ 3D visualization of muscle work
- ✅ Strength progression by muscle group

---

## 🚀 Status
- ✅ Exercise database (122+ exercises)
- ✅ Enhanced UI with filters
- ✅ Anatomical muscle naming
- ✅ Service layer integration
- ⏳ 3D anatomy visualization (ready for implementation)
- ⏳ Real-time workout tracking
