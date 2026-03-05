import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CalendarView = ({ completedDays = [], startDate, endDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const challengeStart = new Date(startDate);
  const challengeEnd = new Date(endDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isCompletedDay = (date) => {
    return completedDays.some(d => isSameDay(new Date(d), date));
  };

  const isInChallenge = (date) => {
    return isWithinInterval(date, { start: challengeStart, end: challengeEnd });
  };

  const isToday = (date) => isSameDay(date, new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Progress Calendar</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <span className="text-sm font-medium text-slate-300 min-w-[100px] text-center">
            {format(currentMonth, 'MMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const inMonth = isSameMonth(day, currentMonth);
          const completed = isCompletedDay(day);
          const inChallenge = isInChallenge(day);
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                !inMonth
                  ? 'text-slate-700'
                  : completed
                    ? 'bg-green-500 text-white'
                    : today
                      ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                      : inChallenge
                        ? 'bg-slate-700 text-slate-300'
                        : 'text-slate-500'
              }`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-xs text-slate-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary-600"></div>
          <span className="text-xs text-slate-400">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-700"></div>
          <span className="text-xs text-slate-400">Pending</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
