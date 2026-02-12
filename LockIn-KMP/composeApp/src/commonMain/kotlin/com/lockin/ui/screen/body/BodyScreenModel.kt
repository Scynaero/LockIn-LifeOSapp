package com.lockin.ui.screen.body

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.lockin.model.MuscleSplit
import com.lockin.model.SportsLog
import com.lockin.model.WeightLog
import com.lockin.model.Workout
import com.lockin.model.WorkoutSet
import com.lockin.repository.BodyRepository
import com.lockin.usecase.body.MuscleSplitUseCase
import com.lockin.usecase.body.SetLoggingUseCase
import com.lockin.usecase.body.SportsLoggingUseCase
import com.lockin.usecase.body.WorkoutSessionUseCase
import com.lockin.util.DateUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class BodyUiState(
    // LIFT tab
    val activeWorkout: Workout? = null,
    val currentSets: List<WorkoutSet> = emptyList(),
    val todayWorkouts: List<Workout> = emptyList(),

    // LIVE tab
    val todaySportsLogs: List<SportsLog> = emptyList(),
    val totalCalories: Int = 0,
    val totalActiveMinutes: Int = 0,

    // PROGRESS tab
    val muscleSplit: List<MuscleSplit> = emptyList(),
    val todayMuscles: List<String> = emptyList(),
    val weekVolume: Double = 0.0,
    val monthVolume: Double = 0.0,
    val volumeHistory: List<Pair<String, Double>> = emptyList(),
    val weightHistory: List<WeightLog> = emptyList(),

    val isLoading: Boolean = true
)

class BodyScreenModel(
    private val bodyRepo: BodyRepository,
    private val workoutUseCase: WorkoutSessionUseCase,
    private val setLogging: SetLoggingUseCase,
    private val sportsUseCase: SportsLoggingUseCase,
    private val muscleSplitUseCase: MuscleSplitUseCase
) : ScreenModel {

    private val _state = MutableStateFlow(BodyUiState())
    val state: StateFlow<BodyUiState> = _state.asStateFlow()

    init {
        loadAllData()
    }

    fun loadAllData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            withContext(Dispatchers.Default) {
                val today = DateUtils.getTodayDateString()

                // LIFT data
                val activeWorkout = workoutUseCase.getActiveWorkout()
                val sets = activeWorkout?.let { workoutUseCase.getSetsForWorkout(it.id) } ?: emptyList()
                val todayWorkouts = workoutUseCase.getWorkoutsForDate(today)

                // LIVE data
                val sportsLogs = sportsUseCase.getSportsLogs(today)
                val totalCals = sportsLogs.sumOf { it.calories }.toInt()
                val totalMin = sportsLogs.sumOf { it.durationMin }

                // PROGRESS data
                val muscleSplit = muscleSplitUseCase.getMuscleSplit(30)
                val todayMuscles = muscleSplitUseCase.getMusclesForDate(today)
                val weekVol = muscleSplitUseCase.getVolumeForRange(7)
                val monthVol = muscleSplitUseCase.getVolumeForRange(30)
                val volHistory = muscleSplitUseCase.getVolumeHistory(30)
                val weightHistory = bodyRepo.getWeightHistory()

                _state.update {
                    it.copy(
                        activeWorkout = activeWorkout,
                        currentSets = sets,
                        todayWorkouts = todayWorkouts,
                        todaySportsLogs = sportsLogs,
                        totalCalories = totalCals,
                        totalActiveMinutes = totalMin,
                        muscleSplit = muscleSplit,
                        todayMuscles = todayMuscles,
                        weekVolume = weekVol,
                        monthVolume = monthVol,
                        volumeHistory = volHistory,
                        weightHistory = weightHistory,
                        isLoading = false
                    )
                }
            }
        }
    }

    // --- LIFT actions ---

    fun startWorkout(name: String? = null) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { workoutUseCase.startWorkout(name) }
            loadAllData()
        }
    }

    fun finishWorkout(workoutId: String, durationSec: Int, bodyweight: Double?) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { workoutUseCase.finishWorkout(workoutId, durationSec, bodyweight) }
            loadAllData()
        }
    }

    fun addSet(workoutId: String, exerciseId: String, weight: Double, reps: Int, rpe: Double? = null) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { setLogging.addSet(workoutId, exerciseId, weight, reps, rpe) }
            loadAllData()
        }
    }

    fun updateSet(setId: String, weight: Double, reps: Int, isCompleted: Boolean) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { setLogging.updateSet(setId, weight, reps, isCompleted) }
            loadAllData()
        }
    }

    fun deleteSet(setId: String) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { setLogging.deleteSet(setId) }
            loadAllData()
        }
    }

    // --- LIVE actions ---

    fun logSport(activity: String, durationMin: Int, met: Double) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { sportsUseCase.logSport(activity, durationMin, met) }
            loadAllData()
        }
    }

    fun deleteSportsLog(id: String) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) { sportsUseCase.deleteSportsLog(id) }
            loadAllData()
        }
    }

    // --- PROGRESS actions ---

    fun logWeight(weight: Double) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) {
                bodyRepo.logWeight(weight, DateUtils.getTodayDateString())
            }
            loadAllData()
        }
    }
}
