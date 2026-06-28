import React, { useState, useEffect } from 'react';
import { Plus, Sprout, Trash2, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import * as cropService from '../services/cropService';

export const CropsBoard = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states - Crops
  const [cropName, setCropName] = useState('');
  const [cropCategory, setCropCategory] = useState('vegetable');
  const [cropQuantity, setCropQuantity] = useState('');
  const [cropPrice, setCropPrice] = useState('');
  const [cropHarvestDate, setCropHarvestDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCropsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cropService.getCrops();
      setCrops(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load crops from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCropsList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cropName || !cropQuantity || !cropPrice || !cropHarvestDate) return;

    setActionLoading(true);
    try {
      await cropService.createCrop({
        name: cropName,
        category: cropCategory,
        quantity: parseFloat(cropQuantity),
        price: parseFloat(cropPrice),
        harvestDate: cropHarvestDate
      });

      setCropName('');
      setCropQuantity('');
      setCropPrice('');
      setCropHarvestDate('');
      await fetchCropsList();
    } catch (err) {
      alert(err.message || 'Failed to submit crop listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this crop listing?')) return;
    try {
      await cropService.deleteCrop(id);
      await fetchCropsList();
    } catch (err) {
      alert(err.message || 'Failed to delete crop listing.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="glass p-6 rounded-3xl shadow-sm border border-emerald-100/50 h-fit">
        <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="text-emerald-600" size={18} />
          List Harvest Crop
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Crop Name</label>
            <input
              type="text"
              placeholder="e.g. Alphonso Mango, Wheat"
              value={cropName}
              onChange={e => setCropName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold transition-all duration-200 bg-white/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={cropCategory}
                onChange={e => setCropCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white/50"
              >
                <option value="vegetable">Vegetable</option>
                <option value="grain">Grain</option>
                <option value="fruit">Fruit</option>
                <option value="legume">Legume</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Quantity (kg)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={cropQuantity}
                onChange={e => setCropQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white/50 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Price / kg (₹)</label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={cropPrice}
                onChange={e => setCropPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white/50 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Harvest Date</label>
              <input
                type="date"
                value={cropHarvestDate}
                onChange={e => setCropHarvestDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white/50 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 disabled:opacity-50 text-sm"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            <span>List Harvested Crop</span>
          </button>
        </form>
      </div>

      {/* List and Sync drawer */}
      <div className="lg:col-span-2 space-y-6">
        {/* Table of Crops */}
        <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm min-h-[300px] flex flex-col">
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
            <span>Crops List (Backend API)</span>
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 flex-grow text-slate-400">
              <Loader2 className="animate-spin text-emerald-600 mb-2" size={36} />
              <p className="text-xs font-extrabold">Contacting api/crops backend...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 flex-grow text-red-500 bg-red-50/10 rounded-2xl border border-red-100 border-dashed">
              <AlertCircle size={40} className="mb-2 text-red-550" />
              <p className="text-xs font-extrabold">Failed to retrieve crop data</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{error}</p>
              <button 
                onClick={fetchCropsList}
                className="mt-4 px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition"
              >
                Retry Request
              </button>
            </div>
          ) : crops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 flex-grow text-slate-400">
              <Sprout size={48} className="text-slate-200 mb-2" />
              <p className="text-xs font-extrabold">No crop listings registered on backend servers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Crop Name</th>
                    <th className="pb-3">Qty & Price</th>
                    <th className="pb-3">Harvest Date</th>
                    <th className="pb-3 text-center">Sync State</th>
                    <th className="pb-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                  {crops.map((crop) => (
                    <tr key={crop.id} className="hover:bg-slate-50/30">
                      <td className="py-3">
                        <div className="font-extrabold text-slate-900">{crop.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">{crop.category}</div>
                      </td>
                      <td className="py-3">
                        <div>{crop.quantity_kg?.toLocaleString() || crop.quantity?.toLocaleString()} kg</div>
                        <div className="text-[11px] font-bold text-emerald-700">₹{crop.price_per_kg || crop.price}/kg</div>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        {crop.harvest_date || crop.harvestDate}
                      </td>
                      <td className="py-3 text-center">
                        <div className="inline-flex">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold flex items-center gap-1">
                            <CheckCircle size={10} /> Live
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDelete(crop.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
