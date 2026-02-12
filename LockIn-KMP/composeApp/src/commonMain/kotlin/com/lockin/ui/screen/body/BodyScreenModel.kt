package com.lockin.ui.screen.body

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.lockin.model.*
import com.lockin.repository.BodyRepository
import com.lockin.util.DateUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus

enum class BodyTab {
    LIFT, LIVE, PROGRESS
}

data class BodyUiState(
    val selectedTab: BodyTab = BodyTab.LIFT,
    val selectedDate: LocalDate = DateUtils.today(),
    val isLoading: Boolean = false,
    
    // LIFT Tab
    val activeWorkout: Workout? = null,
    val exercises: List<Exercise> = emptyList(),
    val workoutSets: List<WorkoutSet> = emptyList(),
    
    // LIVE Tab
    val sportsLogs: List<SportsLog> = emptyList(),
    
    // PROGRESS Tab
    val weightHistory: List<WeightLog> = emptyList(),
    val muscleSplit: List<MuscleSplit> = emptyList(),
    val volumeHistory: List<Pair<String, Double>> = emptyList(),
    val heatmapData: Map<String, Double> = emptyMap(), // Muscle name to intensity
    val bmi: Double = 0.0,
    val heightCm: Double = 0.0,
    val latestWeight: Double = 0.0
)

class BodyScreenModel(
    private val bodyRepository: BodyRepository
) : ScreenModel {

    private val _state = MutableStateFlow(BodyUiState())
    val state: StateFlow<BodyUiState> = _state.asStateFlow()

    init {
        loadData()
    }

    fun selectTab(tab: BodyTab) {
        _state.update { it.copy(selectedTab = tab) }
        loadData()
    }

    fun selectDate(date: LocalDate) {
        _state.update { it.copy(selectedDate = date) }
        loadData()
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            withContext(Dispatchers.Default) {
                val dateStr = _state.value.selectedDate.toString()
                
                // LIFT data
                val activeWorkout = bodyRepository.getActiveWorkout()
                val exercises = bodyRepository.getAllExercises()
                val sets = activeWorkout?.let { bodyRepository.getSetsForWorkout(it.id) } ?: emptyList()
                
                // LIVE data
                val sports = bodyRepository.getSportsLogs(dateStr)
                
                // PROGRESS data
                val weightHistory = bodyRepository.getWeightHistory()
                val latestWeight = bodyRepository.getLatestWeight()
                val height = bodyRepository.getHeight() ?: 175.0
                val bmi = if (height > 0) latestWeight / ((height / 100.0) * (height / 100.0)) else 0.0
                
                val sevenDaysAgo = DateUtils.today().minus(7, DateTimeUnit.DAY).toString()
                val volumeHistory = bodyRepository.getVolumeHistory(sevenDaysAgo)
                val split = bodyRepository.getMuscleSplitForRange(sevenDaysAgo).map { 
                    MuscleSplit(it.first, 0.0, it.second.toInt()) // Percentage calc could be done here
                }
                
                // Heatmap data (aggregate intensity for selected date)
                val muscles = bodyRepository.getMusclesForDate(dateStr)
                val heatmap = muscles.groupingBy { it }.eachCount().mapValues { it.value.toDouble() / 5.0 } // Normalize
                
                _state.update {
                    it.copy(
                        isLoading = false,
                        activeWorkout = activeWorkout,
                        exercises = exercises,
                        workoutSets = sets,
                        sportsLogs = sports,
                        weightHistory = weightHistory,
                        latestWeight = latestWeight,
                        heightCm = height,
                        bmi = bmi,
                        volumeHistory = volumeHistory,
                        muscleSplit = split,
                        heatmapData = heatmap
                    )
                }
            }
        }
    }

    // --- LIFT Actions ---
    
    fun startWorkout(name: String? = null) {
        screenModelScope.launch {
            bodyRepository.startWorkout(name, _state.value.selectedDate.toString())
            loadData()
        }
    }
    
    fun addSet(exerciseId: String, weight: Double, reps: Int, type: String = "normal") {
        val workoutId = _state.value.activeWorkout?.id ?: return
        screenModelScope.launch {
            bodyRepository.addSet(workoutId, exerciseId, weight, reps, null, type)
            loadData()
        }
    }

    fun updateSet(setId: String, weight: Double, reps: Int, isCompleted: Boolean) {
        screenModelScope.launch {
            bodyRepository.updateSet(setId, weight, reps, isCompleted)
            loadData()
        }
    }

    fun finishWorkout() {
        val workout = _state.value.activeWorkout ?: return
        screenModelScope.launch {
            bodyRepository.finishWorkout(workout.id, 3600, _state.value.latestWeight)
            loadData()
        }
    }

    // --- LIVE Actions ---

    fun logSport(activityName: String, durationMin: Int, calories: Double, metValue: Double) {
        screenModelScope.launch {
            bodyRepository.logSport(activityName, durationMin, calories, metValue, _state.value.selectedDate.toString())
            loadData()
        }
    }
}
