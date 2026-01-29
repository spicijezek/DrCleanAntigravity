/**
 * DateTimePicker - Native iOS-compatible date and time picker components
 * Uses native HTML5 inputs with styled overlays for consistent cross-platform behavior
 */

import * as React from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Vyberte datum",
  disabled = false,
  disabledDates,
  className,
}: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Calculate min date if disabledDates is provided
  const minDate = React.useMemo(() => {
    if (!disabledDates) return undefined;
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Find first enabled date (max 30 days ahead to avoid infinite loop)
    let found = false;
    for (let i = 0; i < 30; i++) {
      if (!disabledDates(date)) {
        found = true;
        break;
      }
      date.setDate(date.getDate() + 1);
    }

    return found ? date.toISOString().split('T')[0] : undefined;
  }, [disabledDates]);

  // Calculate max date for date of birth (must be in the past)
  const maxDate = React.useMemo(() => {
    if (!disabledDates) return undefined;
    const today = new Date();
    // If future dates are disabled (like for date of birth)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (disabledDates(tomorrow)) {
      return today.toISOString().split('T')[0];
    }
    return undefined;
  }, [disabledDates]);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const newDate = new Date(dateValue + 'T00:00:00');
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  };

  const inputValue = value ? format(value, 'yyyy-MM-dd') : '';

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        {/* Visual display button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-3 rounded-lg border border-input bg-background",
            "flex items-center justify-start text-left font-normal",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value ? format(value, "d. M. yyyy", { locale: cs }) : placeholder}
          </span>
        </button>

        {/* Hidden native input for iOS compatibility */}
        <input
          ref={inputRef}
          type="date"
          value={inputValue}
          onChange={handleChange}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>
    </div>
  );
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = "Vyberte čas",
  disabled = false,
  className,
}: TimePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        {/* Visual display button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "w-full h-11 px-3 rounded-lg border border-input bg-background",
            "flex items-center justify-start text-left font-normal",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">
            {value || placeholder}
          </span>
        </button>

        {/* Hidden native input for iOS compatibility */}
        <input
          ref={inputRef}
          type="time"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>
    </div>
  );
}

interface DateTimeRowProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  className?: string;
  singleRow?: boolean;
}

export function DateTimeRow({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel = "Datum",
  timeLabel = "Čas",
  datePlaceholder,
  timePlaceholder,
  disabled = false,
  disabledDates,
  className,
  singleRow = true,
}: DateTimeRowProps) {
  return (
    <div className={cn(
      singleRow ? "grid grid-cols-[1fr,auto] gap-3" : "grid grid-cols-2 gap-3",
      className
    )}>
      <DatePicker
        value={date}
        onChange={onDateChange}
        label={dateLabel}
        placeholder={datePlaceholder}
        disabled={disabled}
        disabledDates={disabledDates}
      />
      <TimePicker
        value={time}
        onChange={onTimeChange}
        label={timeLabel}
        placeholder={timePlaceholder}
        disabled={disabled}
        className={singleRow ? "w-28" : undefined}
      />
    </div>
  );
}