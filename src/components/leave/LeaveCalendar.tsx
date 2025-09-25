/**
 * İzin Takvim Görünümü Komponenti
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isWithinInterval,
  isSameDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ILeaveRequest, LEAVE_TYPES } from '../../types/leave.types';

interface LeaveCalendarProps {
  requests: ILeaveRequest[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  requests,
  currentMonth,
  onMonthChange
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Günün izinli personellerini bul
  const getLeaveRequestsForDay = (date: Date): ILeaveRequest[] => {
    return requests.filter(request => {
      if (request.status !== 'onaylandi') return false;
      
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      return isWithinInterval(date, { start: startDate, end: endDate }) ||
             isSameDay(date, startDate) ||
             isSameDay(date, endDate);
    });
  };

  // Haftanın günleri
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <Card className="p-6">
      {/* Takvim Başlığı */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          İzin Takvimi
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 py-1 font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
            className="ml-2"
          >
            Bugün
          </Button>
        </div>
      </div>

      {/* Hafta Günleri */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        {weekDays.map(day => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-700 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Takvim Günleri */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-b-lg overflow-hidden">
        {days.map((day, idx) => {
          const dayRequests = getLeaveRequestsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={`
                bg-white min-h-[100px] p-2 relative
                ${!isCurrentMonth ? 'bg-gray-50' : ''}
                ${isCurrentDay ? 'bg-blue-50' : ''}
              `}
            >
              {/* Gün Numarası */}
              <div className={`
                text-sm font-medium mb-1
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                ${isCurrentDay ? 'text-blue-600' : ''}
              `}>
                {format(day, 'd')}
              </div>

              {/* İzinli Personeller */}
              <div className="space-y-1">
                {dayRequests.slice(0, 3).map((request, i) => {
                  const leaveType = LEAVE_TYPES[request.leaveType as keyof typeof LEAVE_TYPES];
                  return (
                    <div
                      key={i}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate
                        bg-${leaveType?.color || 'gray'}-100
                        text-${leaveType?.color || 'gray'}-800
                      `}
                      title={`${request.userName} - ${leaveType?.label}`}
                    >
                      {request.userName.split(' ')[0]}
                    </div>
                  );
                })}
                {dayRequests.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayRequests.length - 3} kişi
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alt Bilgi */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-6">
          {Object.entries(LEAVE_TYPES).slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded bg-${value.color}-100`}></div>
              <span className="text-sm text-gray-600">{value.label}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto text-sm text-gray-500">
          Toplam {requests.filter(r => r.status === 'onaylandi').length} onaylı izin
        </div>
      </div>
    </Card>
  );
};

export default LeaveCalendar;
