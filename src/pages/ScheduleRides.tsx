
import React, { useState } from 'react';
import { Calendar, CheckSquare, Plus, Trash2, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { mockRecurringRides, SERVICE_CATALOG } from '../services/mockService';
import { RecurringRide, ServiceId } from '../types';

const ScheduleRides: React.FC = () => {
  const { user, connectGoogle } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [schedules, setSchedules] = useState<RecurringRide[]>(mockRecurringRides);

  // Form State
  const [formData, setFormData] = useState<Partial<RecurringRide>>({
    name: '',
    origin: '',
    destination: '',
    time: '08:00',
    days: [],
    forWhom: 'ME',
    beneficiaryName: '',
    syncCalendar: true,
    syncTasks: false,
    serviceId: 'mototaxi'
  });

  const daysOfWeek = [
    { id: 1, label: 'L' },
    { id: 2, label: 'M' },
    { id: 3, label: 'M' },
    { id: 4, label: 'J' },
    { id: 5, label: 'V' },
    { id: 6, label: 'S' },
    { id: 0, label: 'D' },
  ];

  const handleDayToggle = (dayId: number) => {
    const currentDays = formData.days || [];
    if (currentDays.includes(dayId)) {
      setFormData({ ...formData, days: currentDays.filter(d => d !== dayId) });
    } else {
      setFormData({ ...formData, days: [...currentDays, dayId] });
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.origin || !formData.destination || (formData.days?.length === 0)) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const newSchedule: RecurringRide = {
      id: `rec-${Date.now()}`,
      name: formData.name!,
      origin: formData.origin!,
      destination: formData.destination!,
      time: formData.time || '08:00',
      days: formData.days!,
      active: true,
      serviceId: (formData.serviceId as ServiceId) || 'mototaxi',
      syncCalendar: !!formData.syncCalendar,
      syncTasks: !!formData.syncTasks,
      forWhom: (formData.forWhom as 'ME' | 'OTHER') || 'ME',
      beneficiaryName: formData.beneficiaryName
    };

    setSchedules([...schedules, newSchedule]);
    setIsCreating(false);

    if (user?.googleProfile && newSchedule.syncCalendar) {
      alert(`✅ Viajes programados sincronizados con Google Calendar de ${user.googleProfile.email}`);
    } else if (newSchedule.syncCalendar) {
      alert('⚠️ Conecta tu cuenta Google para sincronizar con el calendario.');
    }
  };

  const handleDelete = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-slide-up pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white flex items-center gap-2">
            <Calendar className="text-mipana-mediumBlue" />
            Agenda de Viajes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Programación recurrente integrada con Google</p>
        </div>

        {!user.googleProfile ? (
          <button
            onClick={connectGoogle}
            className="flex items-center gap-3 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Conectar con Google
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm border border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sincronizado con {user.googleProfile.email}
          </div>
        )}
      </div>

      {!isCreating ? (
        <div className="grid grid-cols-1 gap-4">
          <Button variant="action" icon={<Plus />} onClick={() => setIsCreating(true)}>
            Programar Nuevo Viaje
          </Button>

          {schedules.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Calendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No tienes viajes programados.</p>
            </div>
          )}

          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-mipana-mediumBlue flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">{schedule.name}</h3>
                  {schedule.forWhom === 'OTHER' && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      Para: {schedule.beneficiaryName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <span className="flex items-center gap-1"><Clock size={14} /> {schedule.time}</span>
                  <span className="flex items-center gap-1">
                    {schedule.days.map(d => daysOfWeek.find(wd => wd.id === d)?.label).join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{schedule.origin}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                  <span className="font-medium">{schedule.destination}</span>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-between items-end gap-2">
                <div className="flex gap-2">
                  {schedule.syncCalendar && (
                    <div title="Sync Calendar">
                      <Calendar size={18} className="text-blue-500" />
                    </div>
                  )}
                  {schedule.syncTasks && (
                    <div title="Sync Tasks">
                      <CheckSquare size={18} className="text-green-500" />
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(schedule.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-6 text-mipana-darkBlue dark:text-white">Configurar Frecuencia</h3>

          <div className="space-y-4">
            <Input
              label="Nombre del Evento (Ej: Ir al trabajo, Escuela de Mamá)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Origen"
                icon={<MapPin size={16} />}
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
              />
              <Input
                label="Destino"
                icon={<MapPin size={16} />}
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora de Recogida</label>
                <input
                  type="time"
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mipana-mediumBlue"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
                <select
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mipana-mediumBlue"
                  value={formData.serviceId}
                  onChange={e => setFormData({ ...formData, serviceId: e.target.value as ServiceId })}
                >
                  {SERVICE_CATALOG.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frecuencia (Días)</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    onClick={() => handleDayToggle(day.id)}
                    className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${formData.days?.includes(day.id)
                        ? 'bg-mipana-mediumBlue text-white shadow-md scale-110'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium mb-3 dark:text-white flex items-center gap-2"><Users size={16} /> ¿Para quién es el viaje?</p>
              <div className="flex gap-4 mb-3">
                <button
                  onClick={() => setFormData({ ...formData, forWhom: 'ME' })}
                  className={`px-4 py-2 rounded-lg text-sm border ${formData.forWhom === 'ME' ? 'border-mipana-mediumBlue bg-blue-50 text-mipana-mediumBlue font-bold' : 'border-gray-200 text-gray-500'}`}
                >
                  Para Mí
                </button>
                <button
                  onClick={() => setFormData({ ...formData, forWhom: 'OTHER' })}
                  className={`px-4 py-2 rounded-lg text-sm border ${formData.forWhom === 'OTHER' ? 'border-mipana-mediumBlue bg-blue-50 text-mipana-mediumBlue font-bold' : 'border-gray-200 text-gray-500'}`}
                >
                  Para un Familiar/Amigo
                </button>
              </div>
              {formData.forWhom === 'OTHER' && (
                <Input
                  label="Nombre del Pasajero"
                  placeholder="Ej: Mamá, Hermano..."
                  value={formData.beneficiaryName}
                  onChange={e => setFormData({ ...formData, beneficiaryName: e.target.value })}
                />
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-mipana-mediumBlue focus:ring-mipana-mediumBlue"
                  checked={formData.syncCalendar}
                  onChange={e => setFormData({ ...formData, syncCalendar: e.target.checked })}
                />
                <div>
                  <span className="block text-sm font-medium dark:text-white">Sincronizar con Google Calendar</span>
                  <span className="block text-xs text-gray-500">Creará eventos recurrentes en tu calendario.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-mipana-mediumBlue focus:ring-mipana-mediumBlue"
                  checked={formData.syncTasks}
                  onChange={e => setFormData({ ...formData, syncTasks: e.target.checked })}
                />
                <div>
                  <span className="block text-sm font-medium dark:text-white">Añadir a Google Tasks</span>
                  <span className="block text-xs text-gray-500">Recordatorio de "Pedir Taxi" en tu lista de tareas.</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsCreating(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1">Guardar Programación</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRides;
