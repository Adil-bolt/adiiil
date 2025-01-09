import React, { useState, useMemo } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Plus } from 'lucide-react';

export const TreatedPatients: React.FC = () => {
  const { records } = useUnifiedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('01/01');
  const [endDate, setEndDate] = useState('08/01');
  const [year, setYear] = useState('2025');

  // Fonction pour réinitialiser les données
  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Ajout de logs pour déboguer
  console.log('Tous les records:', records);

  const treatedPatients = useMemo(() => {
    const filtered = records.filter(record => 
      record.type === 'patient' && 
      'confirmationRendezVous' in record &&
      record.confirmationRendezVous !== '-' &&
      !record.deleted
    );
    
    console.log('Patients filtrés:', filtered);
    
    return filtered.map(patient => {
      const consultations = records.filter(r => 
        r.type === 'consultation' && 
        'patientId' in r && 
        r.patientId === patient.id
      );

      return {
        ...patient,
        nombreConsultations: consultations.length,
        derniereConsultation: consultations.length > 0 
          ? consultations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : undefined
      };
    });
  }, [records]);

  const getConfirmationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'validé':
        return 'bg-green-100 text-green-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      case 'absent':
        return 'bg-yellow-100 text-yellow-800';
      case 'reporté':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfirmationStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'validé':
        return 'Validé';
      case 'annulé':
        return 'Annulé';
      case 'absent':
        return 'Absent';
      case 'reporté':
        return 'Reporté';
      default:
        return status;
    }
  };

  const filteredPatients = useMemo(() => {
    return treatedPatients.filter(patient => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        patient.numeroPatient?.toLowerCase().includes(searchLower) ||
        patient.nom?.toLowerCase().includes(searchLower) ||
        patient.prenom?.toLowerCase().includes(searchLower) ||
        patient.ville?.toLowerCase().includes(searchLower) ||
        patient.cin?.toLowerCase().includes(searchLower) ||
        patient.mutuelle?.nom?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [treatedPatients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = treatedPatients.length;
    const validated = treatedPatients.filter(p => p.status === 'Validé').length;
    const notValidated = treatedPatients.filter(p => p.status === '-').length;
    const deleted = treatedPatients.filter(p => p.status === 'Supprimé').length;
    return { total, validated, notValidated, deleted };
  }, [treatedPatients]);

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return date;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bouton temporaire de réinitialisation */}
      <button
        onClick={resetData}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Réinitialiser les données
      </button>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Patients ({stats.total})
          </h1>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau Patient
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          {stats.validated} Patients Validés • {stats.notValidated} Patients Non Validés • {stats.deleted} Patients Supprimés
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Tous les patients</option>
            <option value="Validé">Patients Validés</option>
            <option value="-">Patients Non Validés</option>
            <option value="Supprimé">Patients Supprimés</option>
          </select>

          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, numéro, ville, CIN, mutuelle..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Début"
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Fin"
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <input
            type="text"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Année"
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Patient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultations
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ville
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CIN
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mutuelle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière consultation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prochain RDV
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {patient.numeroPatient}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {patient.nom} {patient.prenom}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.nombreConsultations || 0}</div>
                  <div className="text-sm text-gray-500">
                    {patient.derniereConsultation ? formatDate(patient.derniereConsultation) : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.contact}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.ville || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.cin || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.mutuelle?.nom || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(patient.prochainRdv)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfirmationStatusColor(patient.confirmationRendezVous)}`}>
                    {getConfirmationStatusText(patient.confirmationRendezVous)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
