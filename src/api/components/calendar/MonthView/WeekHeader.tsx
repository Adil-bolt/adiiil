import React from 'react';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function WeekHeader() {
  return (
    <>
      {WEEK_DAYS.map((day) => (
        <div key={day} className="p-2 text-center font-semibold text-gray-600">
          {day}
        </div>
      ))}
    </>
  );
}