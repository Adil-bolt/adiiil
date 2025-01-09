import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { useAppointments } from '../contexts/AppointmentContext';
import { useData } from '../contexts/DataContext';
import { formatters } from '../utils/formatters';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import { DateInput } from '../components/DateInput';
import { YearInput } from '../components/YearInput';
import { usePersistedState } from '../hooks/usePersistedState';
import { formatPatientName, formatFullName, isPatientValidated, formatAppointmentData, getPaymentStatus, getStatusColor, getStatusBgColor } from '../utils/formatDisplayData';
import ExportOptionsModal from '../components/ExportOptionsModal';
import MutuelleSelect from '../components/MutuelleSelect';
import { usePaymentAmount } from '../hooks/usePaymentAmount';
import { ConsultationType, CONSULTATION_TYPES } from '../types/payment';

const MUTUELLES = ['RMA', 'CNSS', 'CNOPS', 'SAHAM', 'AXA', 'MCMA', 'Allianz', 'Sanad', 'MGPAP', 'AtlantaSanad'];

export default function Billing() {
  const { appointments, updateAppointment } = useAppointments();
  const { patients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = usePersistedState<string>('billing_year', '');
  const [startDate, setStartDate] = usePersistedState<string>('billing_start_date', '');
  const [endDate, setEndDate] = usePersistedState<string>('billing_end_date', '');
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, {
    amount: string;
    paymentMethod: string;
    mutuelle: { active: boolean; nom: string };
    type: ConsultationType;
    customType?: string;
    status: string;
  }>>({});
  const [invalidEndDate, setInvalidEndDate] = useState(false);

  const { handleAmountChange, handleAmountFocus, handleAmountBlur, formatDisplayAmount } = usePaymentAmount({
    onAmountChange: (amount, paymentMethod) => {
      if (editingAppointment) {
        setEditValues(prev => ({
          ...prev,
          [editingAppointment]: {
            ...prev[editingAppointment],
            amount,
            paymentMethod: paymentMethod === '-' ? '-' : prev[editingAppointment]?.paymentMethod || '-'
          }
        }));
      }
    }
  });

  const handleEdit = (appointmentId: string) => {
    const appointment = paidAppointments.find(apt => apt.id === appointmentId);
    if (appointment) {
      let type = appointment.type as string;
      let customType = '';
      
      if (appointment.type?.startsWith('Autre -')) {
        type = 'Autre';
        customType = appointment.type.substring(8).trim();
      }

      setEditingAppointment(appointmentId);
      setEditValues({
        [appointmentId]: {
          amount: appointment.amount || '0,00',
          paymentMethod: appointment.paymentMethod || '-',
          mutuelle: appointment.mutuelle || { active: false, nom: '' },
          type,
          customType,
          status: appointment.status as string || 'En attente'
        }
      });
    }
  };

  const handleSave = async (appointmentId: string) => {
    const editValue = editValues[appointmentId];
    if (editValue) {
      // Nettoyer le montant de tout formatage
      let cleanAmount = editValue.amount.replace(' Dhs', '').trim();
      
      // Si le montant est vide ou invalide, ne pas sauvegarder
      if (!cleanAmount || cleanAmount === '-' || cleanAmount === '0,00') {
        setEditingAppointment(null);
        return;
      }

      // S'assurer que le montant est au format correct (avec virgule)
      if (!cleanAmount.includes(',')) {
        cleanAmount = cleanAmount + ',00';
      } else if (cleanAmount.endsWith(',')) {
        cleanAmount = cleanAmount + '00';
      }

      const finalType = editValue.type === 'Autre' && editValue.customType
        ? `Autre - ${editValue.customType}`
        : editValue.type === '-' ? '-' : editValue.type;

      // Faire la mise à jour en une seule fois
      await updateAppointment(appointmentId, {
        amount: cleanAmount,
        montant: cleanAmount,
        paymentMethod: editValue.paymentMethod,
        mutuelle: editValue.mutuelle,
        type: finalType,
        status: 'Validé',
        paid: true
      });
      
      setEditingAppointment(null);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent, appointmentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(appointmentId);
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    if (newStartDate) {
      setStartDate(newStartDate);
      // Si la date de fin est vide, on la met au 31/12
      if (!endDate) {
        setEndDate('31/12');
      }
    } else {
      setStartDate('');
      // Si la date de fin est remplie, on met la date de début au 01/01
      if (endDate) {
        setStartDate('01/01');
      }
    }
    setInvalidEndDate(false);
  };

  const handleEndDateChange = (newEndDate: string) => {
    if (newEndDate) {
      // Si la date de début est vide, on la met au 01/01
      if (!startDate) {
        setStartDate('01/01');
      }

      // Vérifier si la date de fin est valide par rapport à la date de début
      const [startDay, startMonth] = (startDate || '01/01').split('/').map(Number);
      const [endDay, endMonth] = newEndDate.split('/').map(Number);
      
      const yearToUse = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
      const startDateObj = new Date(yearToUse, startMonth - 1, startDay);
      const endDateObj = new Date(yearToUse, endMonth - 1, endDay);

      if (endDateObj >= startDateObj) {
        setEndDate(newEndDate);
        setInvalidEndDate(false);
      } else {
        setInvalidEndDate(true);
      }
    } else {
      setEndDate('');
      // Si la date de début est remplie, on met la date de fin au 31/12
      if (startDate) {
        setEndDate('31/12');
      }
    }
  };

  const paidAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        // Filtrer par plage de dates si sélectionnée
        if (startDate && endDate) {
          try {
            const appointmentDate = parseISO(apt.time);
            const [startDay, startMonth] = startDate.split('/').map(Number);
            const [endDay, endMonth] = endDate.split('/').map(Number);
            
            // Utiliser l'année sélectionnée pour la comparaison, sinon utiliser l'année de l'appointmentDate
            const yearToUse = selectedYear ? parseInt(selectedYear) : appointmentDate.getFullYear();
            const start = new Date(yearToUse, startMonth - 1, startDay, 0, 0, 0);
            const end = new Date(yearToUse, endMonth - 1, endDay, 23, 59, 59);

            // Comparer directement avec la date du rendez-vous
            if (appointmentDate < start || appointmentDate > end) {
              return false;
            }
          } catch (error) {
            console.error('Erreur lors du filtrage des dates:', error);
            return false;
          }
        }

        // Trouver le patient soit par ID soit par nom
        let patient = null;
        if (apt.patientId) {
          patient = patients.find(p => p.id === apt.patientId);
        } else if (apt.patient) {
          patient = patients.find(p => 
            `${p.nom} ${p.prenom}`.toLowerCase() === apt.patient.toLowerCase() ||
            formatPatientName(p.nom, p.prenom).toLowerCase() === apt.patient.toLowerCase()
          );
        }
        
        // Si on ne trouve pas de patient mais que le rendez-vous est validé,
        // on l'affiche quand même
        if (!patient && apt.status === 'Validé') {
          return true;
        }

        if (!patient) return false;

        // Enrichir le patient avec ses rendez-vous
        const patientAppointments = appointments.filter(a => 
          (a.patientId === patient.id) || 
          (a.patient && a.patient.toLowerCase() === `${patient.nom} ${patient.prenom}`.toLowerCase())
        );
        
        // Vérifier si le patient est validé
        const isValid = isPatientValidated(patient, patientAppointments);

        // Filtrer par année si sélectionnée
        if (selectedYear) {
          const appointmentYear = format(parseISO(apt.time), 'yyyy');
          if (appointmentYear !== selectedYear) {
            return false;
          }
        }

        // Filtrer par terme de recherche
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const searchFields = [
            patient?.numeroPatient || '',
            patient ? `${patient.nom} ${patient.prenom}` : '',
            format(parseISO(apt.time), 'dd/MM/yyyy HH:mm'),
            apt.amount ? `${apt.amount} Dhs` : '',
            apt.paymentMethod || '',
            apt.mutuelle?.nom || '',
            getPaymentStatus(apt.amount),
            apt.type || '',
          ].map(field => field.toLowerCase());

          return searchFields.some(field => field.includes(searchLower));
        }

        return isValid;
      })
      .map(apt => {
        // Trouver le patient soit par ID soit par nom
        let patient = null;
        if (apt.patientId) {
          patient = patients.find(p => p.id === apt.patientId);
        } else if (apt.patient) {
          patient = patients.find(p => 
            `${p.nom} ${p.prenom}`.toLowerCase() === apt.patient.toLowerCase() ||
            formatPatientName(p.nom, p.prenom).toLowerCase() === apt.patient.toLowerCase()
          );
        }

        // Si pas de patient trouvé mais que le rendez-vous a des informations patient
        if (!patient && (apt.nom || apt.prenom)) {
          patient = {
            id: apt.id,
            nom: apt.nom || '',
            prenom: apt.prenom || '',
            numeroPatient: apt.numeroPatient || '-',
            status: apt.status,
            deleted: false
          };
        }

        const amount = apt.montant || apt.amount;
        const paymentStatus = getPaymentStatus(amount);

        const formattedData = formatAppointmentData(
          {
            ...apt,
            amount: amount,
            status: paymentStatus
          },
          patient
        );

        return {
          ...apt,
          patientName: formattedData.patientName,
          patientNumero: formattedData.patientNumber,
          displayTime: formattedData.displayTime,
          displayAmount: formattedData.displayAmount,
          displayPaymentMethod: formattedData.displayPaymentMethod,
          displayMutuelle: formattedData.displayMutuelle,
          displayStatus: paymentStatus,
          displayType: formattedData.displayType,
          statusColor: getStatusColor(paymentStatus)
        };
      })
      .sort((a, b) => parseISO(b.time).getTime() - parseISO(a.time).getTime());
  }, [appointments, patients, searchTerm, selectedYear, startDate, endDate]);

  // Calculer la somme totale des paiements filtrés
  const totalFilteredAmount = useMemo(() => {
    return paidAppointments.reduce((sum, apt) => {
      const amount = apt.amount ? parseFloat(apt.amount.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0;
      return sum + amount;
    }, 0);
  }, [paidAppointments]);

  return (
    <div className="p-4">
      <div>
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Paiements ({paidAppointments.length})
          </h1>
          <div className="text-sm text-gray-900">
            {`Total${searchTerm || selectedYear || startDate || endDate ? ' filtré' : ''}: ${totalFilteredAmount.toLocaleString('fr-FR')} Dhs`}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mt-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par numero, nom, date, Montant, type Paie, Mutuelle, Statut, type Const..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Sélecteur d'année */}
            <div className="w-32">
              <YearInput
                value={selectedYear}
                onChange={setSelectedYear}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Sélecteur de dates */}
            <div className="flex items-center gap-2">
              <DateInput
                value={startDate}
                onChange={handleStartDateChange}
                placeholder="01/01"
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onFocus={(e) => e.target.select()}
              />
              <span className="text-gray-500">à</span>
              <div className="relative">
                <DateInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder="31/12"
                  min={startDate || '01/01'}
                  className={`block w-40 px-3 py-2 border ${
                    invalidEndDate 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                  onFocus={(e) => e.target.select()}
                />
                {invalidEndDate && (
                  <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                    Date doit être ≥ date début
                  </div>
                )}
              </div>
            </div>

            {/* Bouton d'export */}
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-5 w-5 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant dernière consultation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mutuelle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de consultation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paidAppointments.map((appointment) => {
                const isEditing = editingAppointment === appointment.id;
                const editValue = editValues[appointment.id] || {
                  amount: appointment.amount || '0,00',
                  paymentMethod: appointment.paymentMethod || '-',
                  mutuelle: appointment.mutuelle || { active: false, nom: '' },
                  type: appointment.type || '-',
                  customType: '',
                  status: appointment.status as string || 'En attente'
                };

                const numAmount = parseFloat(editValue.amount.replace(',', '.'));
                const showPaymentMethod = numAmount > 0;

                // Fonction pour gérer les classes CSS des cellules
                const getCellClass = (value: string | undefined) => {
                  const baseClass = "px-6 py-4 whitespace-nowrap text-sm";
                  if (!value || value === '-') {
                    return `${baseClass} text-center text-gray-400`;
                  }
                  return `${baseClass} text-gray-500`;
                };

                // Fonction pour afficher le type de consultation
                const displayConsultationType = (type: string | undefined) => {
                  if (!type || type === '-' || type === 'NOUVELLE CONSULTATION') return '-';
                  return type;
                };

                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className={getCellClass(appointment.patientNumero)}>
                      {appointment.patientNumero || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.displayTime}
                    </td>
                    <td className={getCellClass(appointment.lastConsultAmount)}>
                      {appointment.lastConsultAmount === '-' ? '-' : formatters.amount(appointment.lastConsultAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex flex-col space-y-2">
                          <input
                            type="text"
                            value={editValue.amount}
                            onChange={(e) => {
                              const newValue = handleAmountChange(e.target.value);
                              setEditValues({
                                ...editValues,
                                [appointment.id]: {
                                  ...editValue,
                                  amount: newValue
                                }
                              });
                            }}
                            onFocus={(e) => {
                              const newValue = handleAmountFocus(editValue.amount);
                              setEditValues({
                                ...editValues,
                                [appointment.id]: {
                                  ...editValue,
                                  amount: newValue
                                }
                              });
                            }}
                            onBlur={(e) => {
                              const newValue = handleAmountBlur(editValue.amount);
                              setEditValues({
                                ...editValues,
                                [appointment.id]: {
                                  ...editValue,
                                  amount: newValue
                                }
                              });
                            }}
                            onKeyPress={(e) => handleKeyPress(e, appointment.id)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          {editValue.paymentMethod !== '-' && editValue.amount !== '0,00' && (
                            <span className="text-sm text-gray-500">{editValue.paymentMethod}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {formatDisplayAmount(appointment.amount)}
                        </span>
                      )}
                    </td>
                    <td className={getCellClass(editValue.paymentMethod)}>
                      {isEditing && showPaymentMethod ? (
                        <select
                          value={editValue.paymentMethod}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [appointment.id]: { ...editValue, paymentMethod: e.target.value }
                          })}
                          onKeyPress={(e) => handleKeyPress(e, appointment.id)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="Carte Bancaire">Carte Bancaire</option>
                          <option value="Espèces">Espèces</option>
                          <option value="Virement">Virement</option>
                          <option value="Chèque">Chèque</option>
                          <option value="-">-</option>
                        </select>
                      ) : (
                        editValue.paymentMethod || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MutuelleSelect
                        value={editValue.mutuelle}
                        onChange={(mutuelle) => setEditValues({
                          ...editValues,
                          [appointment.id]: { ...editValue, mutuelle }
                        })}
                        mutuelles={MUTUELLES}
                        isEditing={isEditing}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.displayStatus
                        )} ${getStatusBgColor(appointment.displayStatus)}`}
                      >
                        {appointment.displayStatus}
                      </span>
                    </td>
                    <td className={getCellClass(displayConsultationType(appointment.type))}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            value={editValue.type}
                            onChange={(e) => setEditValues({
                              ...editValues,
                              [appointment.id]: { 
                                ...editValue, 
                                type: e.target.value as ConsultationType,
                                customType: e.target.value === 'Autre' ? editValue.customType : ''
                              }
                            })}
                            onKeyPress={(e) => handleKeyPress(e, appointment.id)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="-">-</option>
                            {CONSULTATION_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          {editValue.type === 'Autre' && (
                            <input
                              type="text"
                              value={editValue.customType || ''}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [appointment.id]: { 
                                  ...editValue, 
                                  customType: e.target.value 
                                }
                              })}
                              onKeyPress={(e) => handleKeyPress(e, appointment.id)}
                              placeholder="Préciser le type..."
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          )}
                        </div>
                      ) : (
                        displayConsultationType(appointment.type)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(appointment.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Enregistrer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(appointment.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Modifier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ExportOptionsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={() => setShowExportModal(false)}
        totalPatients={paidAppointments.length}
        patientsWithMutuelle={paidAppointments.filter(apt => apt.patientDetails?.mutuelle?.active).length}
        filteredData={paidAppointments}
        dateRange={{ startDate, endDate }}
      />
    </div>
  );
}