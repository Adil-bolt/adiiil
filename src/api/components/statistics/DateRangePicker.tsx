import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateRange {
  startDate: string;
  endDate: string;
  year: string;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (newDateRange: DateRange) => void;
}

export default function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr.match(/^\d{2}\/\d{2}$/)) return false;

    const [day, month] = dateStr.split('/').map(Number);
    const date = new Date(parseInt(dateRange.year), month - 1, day);
    
    return isValid(date) && 
           date.getDate() === day && 
           date.getMonth() === month - 1 &&
           month >= 1 && 
           month <= 12 && 
           day >= 1 && 
           day <= new Date(parseInt(dateRange.year), month, 0).getDate();
  };

  const validateDateRange = (start: string, end: string): boolean => {
    if (!validateDate(start) || !validateDate(end)) return false;

    const startDate = parse(`${start}/${dateRange.year}`, 'dd/MM/yyyy', new Date());
    const endDate = parse(`${end}/${dateRange.year}`, 'dd/MM/yyyy', new Date());

    return startDate <= endDate;
  };

  const handleStartDateChange = (value: string) => {
    const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5);
    
    if (formattedValue.length === 5) {
      if (!validateDate(formattedValue)) {
        setStartDateError('Date invalide');
      } else if (!validateDateRange(formattedValue, dateRange.endDate)) {
        setStartDateError('La date de début doit être avant la date de fin');
      } else {
        setStartDateError('');
        onDateRangeChange({
          ...dateRange,
          startDate: formattedValue
        });
      }
    } else {
      setStartDateError('');
      onDateRangeChange({
        ...dateRange,
        startDate: formattedValue
      });
    }
  };

  const handleEndDateChange = (value: string) => {
    const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').slice(0, 5);
    
    if (formattedValue.length === 5) {
      if (!validateDate(formattedValue)) {
        setEndDateError('Date invalide');
      } else if (!validateDateRange(dateRange.startDate, formattedValue)) {
        setEndDateError('La date de fin doit être après la date de début');
      } else {
        setEndDateError('');
        onDateRangeChange({
          ...dateRange,
          endDate: formattedValue
        });
      }
    } else {
      setEndDateError('');
      onDateRangeChange({
        ...dateRange,
        endDate: formattedValue
      });
    }
  };

  const handleYearChange = (value: string) => {
    onDateRangeChange({
      ...dateRange,
      year: value
    });
  };

  const applySuggestion = (suggestion: 'currentMonth' | 'currentYear' | 'previousYear') => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (suggestion) {
      case 'currentMonth':
        onDateRangeChange({
          startDate: '01/' + format(now, 'MM'),
          endDate: format(new Date(currentYear, now.getMonth() + 1, 0), 'dd/MM'),
          year: currentYear.toString()
        });
        break;
      case 'currentYear':
        onDateRangeChange({
          startDate: '01/01',
          endDate: '31/12',
          year: currentYear.toString()
        });
        break;
      case 'previousYear':
        onDateRangeChange({
          startDate: '01/01',
          endDate: '31/12',
          year: (currentYear - 1).toString()
        });
        break;
    }
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="JJ/MM"
            value={dateRange.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={`w-20 px-2 py-1 border rounded-md ${
              startDateError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <span className="text-gray-500">à</span>
          <input
            type="text"
            placeholder="JJ/MM"
            value={dateRange.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={`w-20 px-2 py-1 border rounded-md ${
              endDateError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <input
            type="number"
            value={dateRange.year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-24 px-2 py-1 border border-gray-300 rounded-md"
            min={2000}
            max={2100}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </button>

          {showSuggestions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => applySuggestion('currentMonth')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Mois en cours
                </button>
                <button
                  onClick={() => applySuggestion('currentYear')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Année en cours
                </button>
                <button
                  onClick={() => applySuggestion('previousYear')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Année précédente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(startDateError || endDateError) && (
        <div className="text-sm text-red-500">
          {startDateError && <div>{startDateError}</div>}
          {endDateError && <div>{endDateError}</div>}
        </div>
      )}
    </div>
  );
}