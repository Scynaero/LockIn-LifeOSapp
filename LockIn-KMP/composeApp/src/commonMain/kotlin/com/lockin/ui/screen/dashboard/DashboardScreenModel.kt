package com.lockin.ui.screen.dashboard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.lockin.model.Habit
import com.lockin.model.HabitBreakdown
import com.lockin.model.HabitStats
import com.lockin.model.UserXp
import com.lockin.repository.HabitRepository
import com.lockin.usecase.habit.AutoFreezeGapsUseCase
import com.lockin.usecase.habit.CalculateStreakUseCase
import com.lockin.usecase.habit.GetHabitStatsUseCase
import com.lockin.usecase.habit.GetHeatmapDataUseCase
import com.lockin.usecase.habit.LogCompletionUseCase
import com.lockin.usecase.habit.XpLevelingUseCase
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

data class DashboardUiState(
    val habits: List<Habit> = emptyList(),
    val selectedDate: LocalDate = DateUtils.today(),
    val heatmapData: Map<String, Int> = emptyMap(),
    val stats: HabitStats = HabitStats(),
    val userXp: UserXp = UserXp(),
    val xpProgress: Float = 0f,
    val trendData: List<TrendPoint> = emptyList(),
    val bestStreaks: List<Habit> = emptyList(),
    val isLoading: Boolean = true,
    val logModalHabit: Habit? = null
)

data class TrendPoint(
    val label: String, // Day number
    val rate: Int      // Completion rate %
)

class DashboardScreenModel(
    private val habitRepo: HabitRepository,
    private val logCompletionUseCase: LogCompletionUseCase,
    private val calculateStreakUseCase: CalculateStreakUseCase,
    private val autoFreezeGapsUseCase: AutoFreezeGapsUseCase,
    private val getHeatmapDataUseCase: GetHeatmapDataUseCase,
    private val getHabitStatsUseCase: GetHabitStatsUseCase,
    private val xpLevelingUseCase: XpLevelingUseCase
) : ScreenModel {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    init {
        initAndLoad()
    }

    private fun initAndLoad() {
        screenModelScope.launch {
            withContext(Dispatchers.Default) {
                // Auto-freeze gaps and recalculate streaks on startup
                autoFreezeGapsUseCase.executeAll()
                calculateStreakUseCase.recalculateAll()
            }
            loadData()
        }
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            withContext(Dispatchers.Default) {
                val dateStr = _state.value.selectedDate.toString()

                // Load habits for selected date
                val habits = habitRepo.getActiveHabits(dateStr)

                // Load heatmap data
                val heatmap = getHeatmapDataUseCase.execute()

                // Load stats for selected date
                val stats = getHabitStatsUseCase.execute(dateStr)

                // Load XP
                val userXp = xpLevelingUseCase.getUserXp()
                val xpProgress = xpLevelingUseCase.getProgressToNextLevel()

                // Load trend data (last 14 days)
                val today = DateUtils.today()
                val trendData = (13 downTo 0).map { i ->
                    val d = today.minus(i, DateTimeUnit.DAY)
                    val dayStats = getHabitStatsUseCase.execute(d.toString())
                    TrendPoint(
                        label = d.dayOfMonth.toString(),
                        rate = dayStats.completionRate.toInt()
                    )
                }

                // Best streaks (top 5 habits by streak)
                val allHabits = habitRepo.getActiveHabits(DateUtils.getTodayDateString())
                val bestStreaks = allHabits
                    .sortedByDescending { it.currentStreak }
                    .take(5)

                _state.update {
                    it.copy(
                        habits = habits,
                        heatmapData = heatmap,
                        stats = stats,
                        userXp = userXp,
                        xpProgress = xpProgress,
                        trendData = trendData,
                        bestStreaks = bestStreaks,
                        isLoading = false
                    )
                }
            }
        }
    }

    fun selectDate(date: LocalDate) {
        _state.update { it.copy(selectedDate = date) }
        loadData()
    }

    fun toggleHabit(habitId: String) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) {
                val dateStr = _state.value.selectedDate.toString()
                logCompletionUseCase.execute(habitId, dateStr)
            }
            loadData()
        }
    }

    fun logHabitValue(habitId: String, value: Double) {
        screenModelScope.launch {
            withContext(Dispatchers.Default) {
                val dateStr = _state.value.selectedDate.toString()
                logCompletionUseCase.logValue(habitId, dateStr, value)
            }
            _state.update { it.copy(logModalHabit = null) }
            loadData()
        }
    }

    fun showLogModal(habit: Habit) {
        _state.update { it.copy(logModalHabit = habit) }
    }

    fun dismissLogModal() {
        _state.update { it.copy(logModalHabit = null) }
    }

    fun reorderHabits(reorderedHabits: List<Habit>) {
        _state.update { it.copy(habits = reorderedHabits) }
        screenModelScope.launch {
            withContext(Dispatchers.Default) {
                reorderedHabits.forEachIndexed { index, habit ->
                    habitRepo.updateHabitOrder(habit.id, index)
                }
            }
        }
    }
}
