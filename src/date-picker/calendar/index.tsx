// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useEffect, useRef, useState } from 'react';
import { addDays, addMonths, isSameMonth, startOfMonth } from 'date-fns';
import styles from '../styles.css.js';
import { FocusNextElement } from '../../internal/components/tab-trap';
import { BaseComponentProps } from '../../internal/base-component';
import useFocusVisible from '../../internal/hooks/focus-visible/index.js';
import { DatePickerProps } from '../interfaces';
import { CalendarTypes } from './definitions';
import CalendarHeader from './header';
import Grid from './grid';
import moveFocusHandler from './utils/move-focus-handler';
import { useUniqueId } from '../../internal/hooks/use-unique-id/index.js';
import { useMergeRefs } from '../../internal/hooks/use-merge-refs/index.js';
import { getWeekStartByLocale } from 'weekstart';
import { formatDate, memoizedDate } from './utils/date';

export interface DateChangeHandler {
  (detail: CalendarTypes.DateDetail): void;
}

export interface MonthChangeHandler {
  (newMonth: Date): void;
}

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface HeaderChangeMonthHandler {
  (isPreviousButtonClick?: boolean): void;
}

interface CalendarProps extends BaseComponentProps {
  locale: string;
  startOfWeek: number | undefined;
  selectedDate: Date | null;
  displayedDate: Date;
  isDateEnabled: DatePickerProps.IsDateEnabledFunction;
  nextMonthLabel: string;
  previousMonthLabel: string;
  todayAriaLabel: string;

  onChangeMonth: MonthChangeHandler;
  onSelectDate: DateChangeHandler;
}

const Calendar = React.forwardRef(
  (
    {
      locale,
      startOfWeek,
      displayedDate,
      todayAriaLabel,
      selectedDate,
      isDateEnabled,
      onChangeMonth,
      onSelectDate,
      previousMonthLabel,
      nextMonthLabel,
    }: CalendarProps,
    ref
  ) => {
    const normalizedStartOfWeek = (
      typeof startOfWeek === 'number' ? startOfWeek : getWeekStartByLocale(locale)
    ) as DayIndex;

    const [focusedDate, setFocusedDate] = useState<Date | null>(null);

    const onDateFocusHandler = ({ date }: CalendarTypes.DateDetailNullable) => {
      if (date) {
        const value = formatDate(date);
        setFocusedDate(memoizedDate('focused', value));
      }
    };

    const focusVisible = useFocusVisible();
    const headerId = useUniqueId('calendar-dialog-title-');
    const elementRef = useRef<HTMLDivElement>(null);
    const calendarRef = useMergeRefs(elementRef, ref);
    const gridWrapperRef = useRef<HTMLDivElement>(null);

    const selectFocusedDate = (selected: Date | null, baseDate: Date): Date | null => {
      if (selected && isDateEnabled(selected) && isSameMonth(selected, baseDate)) {
        return selected;
      }
      const today = new Date();
      if (isDateEnabled(today) && isSameMonth(today, baseDate)) {
        return today;
      }
      if (isDateEnabled(baseDate)) {
        return baseDate;
      }
      return null;
    };

    const getBaseDate = (date: Date) => {
      const startDate = startOfMonth(date);
      if (isDateEnabled(startDate)) {
        return startDate;
      }
      return moveFocusHandler(startDate, isDateEnabled, (date: Date) => addDays(date, 1));
    };

    const baseDate: Date = getBaseDate(displayedDate);

    const focusCurrentDate: FocusNextElement = () =>
      (elementRef.current?.querySelector(`.${styles['calendar-day-focusable']}`) as HTMLDivElement)?.focus();

    const onHeaderChangeMonthHandler: HeaderChangeMonthHandler = isPrevious => {
      setFocusedDate(null);
      onChangeMonth(addMonths(baseDate, isPrevious ? -1 : 1));
    };

    useEffect(() => {
      // focus current date if the focus is already inside the calendar grid
      if (focusedDate instanceof Date && isSameMonth(focusedDate, baseDate)) {
        focusCurrentDate();
      }
    }, [baseDate, focusedDate]);

    useEffect(() => {
      const calendarActuallyHasFocus = elementRef.current?.contains(document.activeElement);

      if (!calendarActuallyHasFocus) {
        elementRef.current?.focus();
      }

      // When the baseDate or isDateEnabled changes, there might not be a focusable date in the grid anymore
    }, [baseDate, isDateEnabled]);

    if (!focusedDate) {
      const nextFocusedDate = selectFocusedDate(selectedDate, baseDate);
      if (nextFocusedDate) {
        setFocusedDate(nextFocusedDate);
      }
    }

    return (
      <div
        {...focusVisible}
        className={styles.calendar}
        tabIndex={0}
        role="application"
        aria-describedby={headerId}
        ref={calendarRef}
      >
        <div className={styles['calendar-inner']}>
          <CalendarHeader
            headerId={headerId}
            baseDate={baseDate}
            locale={locale}
            onChangeMonth={onHeaderChangeMonthHandler}
            previousMonthLabel={previousMonthLabel}
            nextMonthLabel={nextMonthLabel}
          />
          <div ref={gridWrapperRef}>
            <Grid
              locale={locale}
              baseDate={baseDate}
              isDateEnabled={isDateEnabled}
              focusedDate={focusedDate}
              onSelectDate={e => {
                onSelectDate(e);
                setFocusedDate(null);
              }}
              onFocusDate={onDateFocusHandler}
              onChangeMonth={e => {
                onChangeMonth(e);
              }}
              startOfWeek={normalizedStartOfWeek}
              todayAriaLabel={todayAriaLabel}
              selectedDate={selectedDate}
              handleFocusMove={moveFocusHandler}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default Calendar;
