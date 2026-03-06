"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

const MESI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];
const GIORNI = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
  className?: string;
}

function parseValue(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatDisplay(value: string): string {
  const d = parseValue(value);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function toISOLocal(year: number, month: number, day: number, hours: number, minutes: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = parseValue(value);
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());

  const selectedDay = parsed?.getDate() ?? null;
  const selectedMonth = parsed?.getMonth() ?? null;
  const selectedYear = parsed?.getFullYear() ?? null;
  const selectedHours = parsed?.getHours() ?? 20;
  const selectedMinutes = parsed?.getMinutes() ?? 0;

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  }, [viewMonth]);

  const handleSelectDay = useCallback((day: number) => {
    const h = parsed?.getHours() ?? 20;
    const m = parsed?.getMinutes() ?? 0;
    onChange(toISOLocal(viewYear, viewMonth, day, h, m));
  }, [viewYear, viewMonth, parsed, onChange]);

  const handleHourChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = parseInt(e.target.value);
    const d = parsed ?? now;
    onChange(toISOLocal(
      selectedYear ?? d.getFullYear(),
      selectedMonth ?? d.getMonth(),
      selectedDay ?? d.getDate(),
      h,
      selectedMinutes
    ));
  }, [parsed, now, selectedYear, selectedMonth, selectedDay, selectedMinutes, onChange]);

  const handleMinuteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    const d = parsed ?? now;
    onChange(toISOLocal(
      selectedYear ?? d.getFullYear(),
      selectedMonth ?? d.getMonth(),
      selectedDay ?? d.getDate(),
      selectedHours,
      m
    ));
  }, [parsed, now, selectedYear, selectedMonth, selectedDay, selectedHours, onChange]);

  const handleClear = useCallback(() => {
    onChange("");
    setOpen(false);
  }, [onChange]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
    setOpen(isOpen);
  }, [parsed]);

  const isToday = (day: number) => {
    return viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
  };

  const isSelected = (day: number) => {
    return viewYear === selectedYear && viewMonth === selectedMonth && day === selectedDay;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 border rounded-md px-2 py-1.5 text-xs bg-white hover:bg-gray-50 transition-colors text-left",
            "focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent",
            value ? "text-gray-800" : "text-gray-400",
            className
          )}
        >
          <Calendar className="w-3.5 h-3.5 text-brand-accent flex-shrink-0" />
          <span className="truncate">
            {value ? formatDisplay(value) : "Seleziona data"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        {/* Header mese/anno */}
        <div className="flex items-center justify-between px-3 py-2 bg-brand-primary rounded-t-lg">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white">
            {MESI[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Griglia giorni */}
        <div className="p-2">
          {/* Header giorni settimana */}
          <div className="grid grid-cols-7 mb-1">
            {GIORNI.map(g => (
              <div key={g} className="text-center text-[10px] font-medium text-gray-400 py-1">
                {g}
              </div>
            ))}
          </div>
          {/* Griglia */}
          <div className="grid grid-cols-7">
            {/* Celle vuote prima del primo giorno */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {/* Giorni del mese */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-full rounded-md text-xs font-medium transition-all",
                    selected
                      ? "bg-brand-accent text-brand-primary shadow-sm"
                      : today
                        ? "bg-brand-primary/10 text-brand-primary font-bold hover:bg-brand-primary/20"
                        : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Separatore */}
        <div className="border-t border-gray-100" />

        {/* Ora */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-brand-accent" />
            <span className="text-xs font-medium">Ora</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={selectedHours}
              onChange={handleHourChange}
              className="border border-gray-200 rounded-md px-1.5 py-1 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent appearance-none text-center w-[42px]"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-sm font-bold text-gray-400">:</span>
            <select
              value={selectedMinutes}
              onChange={handleMinuteChange}
              className="border border-gray-200 rounded-md px-1.5 py-1 text-xs font-medium text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-accent appearance-none text-center w-[42px]"
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-gray-400 hover:text-loss transition-colors"
          >
            Cancella
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1 rounded-md bg-brand-accent text-brand-primary text-xs font-semibold hover:bg-brand-gold transition-colors"
          >
            OK
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
