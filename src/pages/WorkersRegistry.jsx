import React, { useState, useEffect } from 'react';
import { Users, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import * as workerService from '../services/workerService';

export const WorkersRegistry = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkersList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await workerService.getWorkers();
      setWorkers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load workers registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkersList();
  }, []);

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this laborer profile?')) return;
    try {
      await workerService.deleteWorker(id);
      await fetchWorkersList();
    } catch (err) {
      alert(err.message || 'Failed to delete worker profile.');
    }
  };

  return (
    <div>
      {/* List and persistent details */}
      <div className="space-y-6">
        {/* Workers Registry */}
        <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm min-h-[300px] flex flex-col">
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
            <span>Labourers Registry (Backend API)</span>
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 flex-grow text-slate-400">
              <Loader2 className="animate-spin text-emerald-600 mb-2" size={36} />
              <p className="text-xs font-extrabold">Contacting api/workers backend...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 flex-grow text-red-500 bg-red-50/10 rounded-2xl border border-red-100 border-dashed">
              <AlertCircle size={40} className="mb-2 text-red-550" />
              <p className="text-xs font-extrabold">Failed to retrieve registry data</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{error}</p>
              <button 
                onClick={fetchWorkersList}
                className="mt-4 px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition"
              >
                Retry Request
              </button>
            </div>
          ) : workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 flex-grow text-slate-400">
              <Users size={48} className="text-slate-200 mb-2" />
              <p className="text-xs font-extrabold">No workers registered on backend servers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map((worker) => (
                <div key={worker.id} className="bg-emerald-50/10 border border-emerald-100/30 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-base">{worker.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold flex items-center gap-1">
                          <CheckCircle size={10} /> Active
                        </span>
                        <button
                          onClick={() => handleDeleteItem(worker.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-slate-500 text-xs font-semibold">{worker.phone}</p>
                      {worker.state && (
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-extrabold border border-emerald-100/30">
                          {worker.state}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {worker.skills?.map((skill, sIdx) => (
                        <span key={sIdx} className="bg-white/80 border border-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          {skill}
                        </span>
                      )) || <span className="text-[10px] text-slate-450 italic font-medium">No skills registered</span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Daily Wage</span>
                    <strong className="text-emerald-800 font-extrabold">₹{worker.daily_rate} / Day</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
