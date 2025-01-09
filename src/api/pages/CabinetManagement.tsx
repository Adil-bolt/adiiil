import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Calendar, Edit, Trash2, Check, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { testSupplies } from '../data/testData';
import SupplyModal from '../components/SupplyModal';
import SupplyExportModal from '../components/SupplyExportModal';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '../components/Input';
import { DateInput } from '../components/DateInput';
import { YearInput } from '../components/YearInput';
import { usePersistedState } from '../hooks/usePersistedState';

export default function CabinetManagement() {
  const { hasPermission } = useAuth();
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = usePersistedState<string>('supplies_year', '');
  const [dateRange, setDateRange] = usePersistedState<{ startDate: string; endDate: string }>('supplies_date_range', {
    startDate: '',
    endDate: ''
  });
  const [supplies, setSupplies] = usePersistedState('cabinet_supplies', testSupplies);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    [key: string]: {
      item: string;
      prix: string;
      typePaiement: string;
      taxe: string;
      facture: boolean;
    };
  }>({});

  // Fonctions utilitaires pour la gestion des dates
  const formatDateInput = (value: string) => {
    // Supprime tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Format JJ/MM
    if (numbers.length >= 2) {
      const day = numbers.slice(0, 2);
      const month = numbers.slice(2, 4);
      
      if (month) {
        return `${day}/${month}`;
      }
      return day;
    }
    
    return numbers;
  };

  const validateDateInput = (value: string) => {
    const [day, month] = value.split('/').map(Number);
    
    if (!day || !month) return false;
    
    // Vérifie si le jour est entre 1 et 31
    if (day < 1 || day > 31) return false;
    
    // Vérifie si le mois est entre 1 et 12
    if (month < 1 || month > 12) return false;
    
    return true;
  };

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      // Si la date est déjà au format JJ/MM/AAAA
      if (dateStr.includes('/')) return dateStr;
      
      // Convertir de AAAA-MM-JJ à JJ/MM/AAAA
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateStr;
    }
  };

  // Gestionnaires d'événements pour les dates
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatDateInput(e.target.value);
    setDateRange(prev => ({ ...prev, startDate: formattedValue }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatDateInput(e.target.value);
    setDateRange(prev => ({ ...prev, endDate: formattedValue }));
  };

  // Gestionnaire pour l'année simplifié
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accepte uniquement les chiffres
    const value = e.target.value.replace(/\D/g, '');
    
    // Limite à 4 chiffres
    if (value.length <= 4) {
      setSelectedYear(value);
    }
  };

  const handleEdit = (supplyId: string) => {
    const supply = supplies.find(s => s.id === supplyId);
    if (supply) {
      setEditingSupply(supplyId);
      setEditValues({
        [supplyId]: {
          item: supply.item,
          prix: supply.prix,
          typePaiement: supply.typePaiement,
          taxe: supply.taxe,
          facture: supply.facture
        }
      });
    }
  };

  const handleSave = (supplyId: string) => {
    const editValue = editValues[supplyId];
    if (editValue) {
      setSupplies(prev => prev.map(supply => 
        supply.id === supplyId ? { ...supply, ...editValue } : supply
      ));
      setEditingSupply(null);
    }
  };

  const handleDelete = (id: string) => {
    setSupplies(prev => prev.filter(supply => supply.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleSupplySubmit = (supplyData: any) => {
    setSupplies(prev => [...prev, { ...supplyData, id: Date.now().toString() }]);
    setIsSupplyModalOpen(false);
  };

  const handleExport = (exportDateRange: { startDate: string; endDate: string }) => {
    const dataToExport = filteredSupplies
      .filter(supply => {
        if (!exportDateRange.startDate || !exportDateRange.endDate) return true;
        
        const [day, month, year] = formatDate(supply.dateAchat).split('/').map(Number);
        const supplyDate = new Date(year, month - 1, day);
        const start = new Date(exportDateRange.startDate);
        const end = new Date(exportDateRange.endDate);
        
        return supplyDate >= start && supplyDate <= end;
      })
      .map(supply => ({
        'Article': supply.item,
        'Date d\'achat': formatDate(supply.dateAchat),
        'Facture': supply.facture ? 'Oui' : 'Non',
        'Prix (Dhs)': supply.prix,
        'Type de paiement': supply.typePaiement,
        'Taxe': supply.taxe
      }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Fournitures');

    const startDateStr = exportDateRange.startDate ? format(new Date(exportDateRange.startDate), 'dd-MM', { locale: fr }) : '';
    const endDateStr = exportDateRange.endDate ? format(new Date(exportDateRange.endDate), 'dd-MM', { locale: fr }) : '';
    const currentDate = format(new Date(), 'dd-MM-yyyy', { locale: fr });
    
    let fileName = 'fournitures';
    if (startDateStr && endDateStr) {
      fileName = `fournitures_du_${startDateStr}_au_${endDateStr}_le_${currentDate}`;
    } else {
      fileName = `fournitures_le_${currentDate}`;
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      // Filtre de recherche textuelle
      const searchTerms = searchTerm.toLowerCase().split(' ');
      const matchesSearch = searchTerms.every(term => {
        const formattedDate = formatDate(supply.dateAchat);
        const searchableContent = [
          supply.item,
          supply.prix,
          supply.typePaiement,
          supply.taxe,
          formattedDate,
          supply.facture ? 'avec facture' : 'sans facture'
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableContent.includes(term);
      });

      if (!matchesSearch) return false;

      // Filtre par année
      if (selectedYear && selectedYear.length === 4) {
        try {
          const formattedDate = formatDate(supply.dateAchat);
          const supplyYear = formattedDate.split('/')[2];
          return supplyYear === selectedYear;
        } catch (error) {
          console.error('Erreur lors du filtrage par année:', error);
          return false;
        }
      }

      // Filtre par plage de dates
      if (dateRange.startDate || dateRange.endDate) {
        try {
          const formattedDate = formatDate(supply.dateAchat);
          const [supplyDay, supplyMonth, supplyYear] = formattedDate.split('/').map(Number);
          const supplyDate = new Date(supplyYear, supplyMonth - 1, supplyDay);

          if (dateRange.startDate) {
            const [startDay, startMonth] = dateRange.startDate.split('/').map(Number);
            const startDate = new Date(supplyYear, startMonth - 1, startDay);
            if (supplyDate < startDate) return false;
          }

          if (dateRange.endDate) {
            const [endDay, endMonth] = dateRange.endDate.split('/').map(Number);
            const endDate = new Date(supplyYear, endMonth - 1, endDay);
            if (supplyDate > endDate) return false;
          }
        } catch (error) {
          console.error('Erreur lors du filtrage par date:', error);
          return false;
        }
      }

      return true;
    });
  }, [supplies, searchTerm, dateRange, selectedYear]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fournitures</h2>
          <p className="text-sm text-gray-600">Total: {supplies.length} articles</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Rechercher une fourniture par article, date d'achat, prix, type de paiement, taxe..."
            />
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          value={selectedYear}
          onChange={handleYearChange}
          className="block w-28 pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="AAAA"
          maxLength={4}
        />

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            className="block w-24 pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="01/01"
            maxLength={5}
          />
          <span className="text-gray-500">à</span>
          <input
            type="text"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            className="block w-24 pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="31/12"
            maxLength={5}
          />
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Download className="h-5 w-5 mr-2" />
          Exporter
        </button>

        <button
          onClick={() => setIsSupplyModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle fourniture
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Barre de recherche et filtres de date */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'achat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix (Dhs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSupplies.map((supply) => {
                const isEditing = editingSupply === supply.id;
                const editValue = editValues[supply.id] || {
                  item: supply.item,
                  prix: supply.prix,
                  typePaiement: supply.typePaiement,
                  taxe: supply.taxe,
                  facture: supply.facture
                };

                return (
                  <tr key={supply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <Input
                          type="text"
                          value={editValue.item}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [supply.id]: { ...editValue, item: e.target.value }
                          })}
                          placeholder="Article"
                        />
                      ) : (
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {supply.item}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(supply.dateAchat)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editValue.facture ? 'true' : 'false'}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [supply.id]: { ...editValue, facture: e.target.value === 'true' }
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supply.facture
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {supply.facture ? 'Oui' : 'Non'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <Input
                          type="text"
                          value={editValue.prix}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [supply.id]: { ...editValue, prix: e.target.value }
                          })}
                          placeholder="Prix (Dhs)"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{supply.prix}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editValue.typePaiement}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [supply.id]: { ...editValue, typePaiement: e.target.value }
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option>Carte Bancaire</option>
                          <option>Espèces</option>
                          <option>Virement</option>
                          <option>Chèque</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-500">{supply.typePaiement}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editValue.taxe}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [supply.id]: { ...editValue, taxe: e.target.value }
                          })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option>TTC</option>
                          <option>HT</option>
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supply.taxe === 'TTC'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {supply.taxe}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        {isEditing ? (
                          <button
                            onClick={() => handleSave(supply.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Enregistrer"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit(supply.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(supply.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SupplyModal
        isOpen={isSupplyModalOpen}
        onClose={() => setIsSupplyModalOpen(false)}
        onSubmit={handleSupplySubmit}
      />

      <SupplyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        totalSupplies={filteredSupplies.length}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Êtes-vous sûr de vouloir supprimer cette fourniture ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}