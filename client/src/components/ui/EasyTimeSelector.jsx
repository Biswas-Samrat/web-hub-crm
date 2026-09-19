import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Sunrise, Sunset, Moon, Plus, RotateCcw, X, Check } from 'lucide-react';
import { format, addDays } from 'date-fns';

const DAY_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '2 Days', days: 2 },
  { label: '3 Days', days: 3 },
  { label: '5 Days', days: 5 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
  { label: '3 Months', days: 90 },
];

const TIME_SLOTS = [
  { label: 'Morning (9 AM)', hour: 9, min: 0, icon: Sunrise },
  { label: 'Afternoon (2 PM)', hour: 14, min: 0, icon: Sun },
  { label: 'Evening (6 PM)', hour: 18, min: 0, icon: Sunset },
  { label: 'Night (8 PM)', hour: 20, min: 0, icon: Moon },
];

export default function EasyTimeSelector({ value, onChange }) {
  const [selectedDays, setSelectedDays] = useState(null); // number of days offset from today
  const [selectedHour, setSelectedHour] = useState(9); // default 9am
  const [selectedMin, setSelectedMin] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  // Compute ISO string whenever days or hour changes
  const applyPreset = (days, hour = selectedHour, min = selectedMin) => {
    setSelectedDays(days);
    setSelectedHour(hour);
    setSelectedMin(min);

    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, min, 0, 0);
    onChange(date.toISOString());
  };

  const handleTimeSlot = (hour, min) => {
    setSelectedHour(hour);
    setSelectedMin(min);
    const baseDays = selectedDays !== null ? selectedDays : 1; // default to tomorrow if no day selected yet
    applyPreset(baseDays, hour, min);
  };

  const addOffset = (additionalDays) => {
    const current = selectedDays !== null ? selectedDays : 0;
    const nextDays = current + additionalDays;
    applyPreset(nextDays);
  };

  const handleClear = () => {
    setSelectedDays(null);
    setShowCustom(false);
    onChange(null);
  };

  return (
    <div className="space-y-3 bg-surface-50 p-3.5 rounded-xl border border-surface-200">
      {/* Active Selection Summary */}
      {value ? (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 text-brand-900 px-3 py-2 rounded-lg text-xs font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-brand-600 flex-shrink-0" />
            <span>
              Follow-up:{' '}
              <strong className="text-brand-700 font-semibold">
                {format(new Date(value), 'EEE, d MMM yyyy')} at {format(new Date(value), 'h:mm a')}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-brand-100 rounded-md text-brand-600 transition-colors"
            title="Clear follow-up"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="text-xs text-surface-500 flex items-center gap-1.5">
          <Clock size={14} className="text-surface-400" />
          <span>Tap a quick day and time to schedule (No calendar needed):</span>
        </div>
      )}

      {/* 1. Quick Day Presets */}
      <div>
        <div className="grid grid-cols-5 gap-1.5">
          {DAY_PRESETS.map((p) => {
            const isSelected = selectedDays === p.days;
            return (
              <button
                type="button"
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition-all border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-white text-surface-700 border-surface-200 hover:border-brand-400 hover:bg-surface-50 active:scale-95'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Quick Increment Adjusters */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-[11px] text-surface-400 font-medium">Quick add:</span>
        <button
          type="button"
          onClick={() => addOffset(1)}
          className="px-2 py-1 bg-white border border-surface-200 rounded text-[11px] font-medium text-surface-600 hover:bg-surface-100 active:scale-95"
        >
          +1 Day
        </button>
        <button
          type="button"
          onClick={() => addOffset(3)}
          className="px-2 py-1 bg-white border border-surface-200 rounded text-[11px] font-medium text-surface-600 hover:bg-surface-100 active:scale-95"
        >
          +3 Days
        </button>
        <button
          type="button"
          onClick={() => addOffset(7)}
          className="px-2 py-1 bg-white border border-surface-200 rounded text-[11px] font-medium text-surface-600 hover:bg-surface-100 active:scale-95"
        >
          +1 Week
        </button>
        <button
          type="button"
          onClick={() => addOffset(30)}
          className="px-2 py-1 bg-white border border-surface-200 rounded text-[11px] font-medium text-surface-600 hover:bg-surface-100 active:scale-95"
        >
          +1 Month
        </button>
      </div>

      {/* 3. Time of Day Slots */}
      <div>
        <span className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
          Time of Day
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedHour === slot.hour && selectedMin === slot.min;
            const Icon = slot.icon;
            return (
              <button
                type="button"
                key={slot.label}
                onClick={() => handleTimeSlot(slot.hour, slot.min)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected && value
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-surface-700 border-surface-200 hover:border-amber-300 hover:bg-amber-50/50 active:scale-95'
                }`}
              >
                <Icon size={13} className={isSelected && value ? 'text-white' : 'text-amber-500'} />
                <span>{slot.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Custom Datetime (Collapsible) */}
      <div className="pt-1 border-t border-surface-200/60">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
        >
          {showCustom ? 'Hide exact date picker' : '+ Optional exact date/time'}
        </button>
        {showCustom && (
          <div className="mt-2">
            <input
              type="datetime-local"
              value={value ? value.slice(0, 16) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(new Date(e.target.value).toISOString());
                } else {
                  onChange(null);
                }
              }}
              className="input text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
