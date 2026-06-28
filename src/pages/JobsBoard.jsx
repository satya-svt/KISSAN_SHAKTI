import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, AlertCircle, MapPin, Trash2, Search, Briefcase, Loader2, CheckCircle } from 'lucide-react';
import { SKILL_OPTIONS } from '../db/constants';
import * as workerService from '../services/workerService';
import { MatchmakerModal } from '../components/MatchmakerModal';

export const JobsBoard = ({
  jobTitle,
  setJobTitle,
  jobDesc,
  setJobDesc,
  jobLocation,
  setJobLocation,
  jobPayment,
  setJobPayment,
  requiredSkill,
  setRequiredSkill,
  assignedWorkerId,
  setAssignedWorkerId,
  jobErrors,
  setJobErrors,
  jobFilledStatus,
  setJobFilledStatus,
  logSystem
}) => {
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Matchmaker state
  const [selectedJobForMatching, setSelectedJobForMatching] = useState(null);
  const [matchingWorkers, setMatchingWorkers] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, workersData] = await Promise.all([
        workerService.getJobs(),
        workerService.getWorkers()
      ]);
      setJobs(jobsData || []);
      setWorkers(workersData || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks and registry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runMatchingQuery = (job, allWorkersList = workers) => {
    const matched = allWorkersList.map(worker => {
      let score = 0;
      
      if (worker.skills?.includes(job.required_skill)) {
        score += 70;
      } else {
        const hasOtherSkills = worker.skills && worker.skills.length > 0;
        if (hasOtherSkills) score += 35;
      }

      const isNearby = worker.phone && (
        job.location.toLowerCase().includes("village") || 
        job.location.toLowerCase().includes("region") || 
        job.location.toLowerCase().includes("field") ||
        job.location.toLowerCase().includes("pimplad") ||
        job.location.toLowerCase().includes("sinnar")
      );
      if (isNearby) score += 30;

      return {
        ...worker,
        match_score: score
      };
    })
    .filter(w => w.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score);

    setMatchingWorkers(matched);
  };

  const openMatchmaker = (job) => {
    setSelectedJobForMatching(job);
    runMatchingQuery(job, workers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!jobTitle || jobTitle.trim().length < 5) {
      errors.title = "Task title must be at least 5 characters.";
    }

    if (!jobDesc || jobDesc.trim().length < 15) {
      errors.desc = "Description must specify work details (at least 15 characters).";
    }

    if (!jobLocation || jobLocation.trim().length < 3) {
      errors.location = "Specify a valid farming locality or region.";
    }

    const payment = parseFloat(jobPayment);
    if (isNaN(payment) || payment < 500) {
      errors.payment = "Payout pool must be at least a positive ₹500.";
    }

    if (Object.keys(errors).length > 0) {
      setJobErrors(errors);
      if (logSystem) logSystem('error', `Form submission blocked: ${Object.keys(errors).length} job validation failures.`);
      return;
    }

    setJobErrors({});
    setActionLoading(true);
    try {
      await workerService.createJob({
        title: jobTitle,
        description: jobDesc,
        location: jobLocation,
        payment: jobPayment,
        required_skill: requiredSkill,
        worker_id: assignedWorkerId || null
      });

      // Reset parent form states
      setJobTitle('');
      setJobDesc('');
      setJobLocation('');
      setJobPayment('');
      setRequiredSkill('Harvesting');
      setAssignedWorkerId('');
      setJobFilledStatus({ title: false, desc: false, location: false, payment: false, skill: false });
      
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to list task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this farm task?')) return;
    try {
      await workerService.deleteJob(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  const handleAssignWorker = async (jobId, workerId) => {
    try {
      await workerService.assignWorkerToJob(jobId, workerId);
      setSelectedJobForMatching(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to hire laborer.');
    }
  };

  const handleUnassignWorker = async (jobId) => {
    try {
      await workerService.unassignWorker(jobId);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to release laborer.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Validated Posting Form */}
      <div className="glass p-6 rounded-3xl shadow-sm border border-emerald-100/50 h-fit">
        <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="text-emerald-600" size={18} />
          Post Agricultural Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Task Title</span>
              {jobFilledStatus.title && <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse"><Sparkles size={10} /> Auto-filled</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. Wheat Harvesting"
              value={jobTitle}
              onChange={e => {
                setJobTitle(e.target.value);
                setJobFilledStatus(prev => ({ ...prev, title: false }));
              }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                jobFilledStatus.title ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
              } ${
                jobErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
              }`}
            />
            {jobErrors.title && (
              <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> {jobErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Description Details</span>
              {jobFilledStatus.desc && <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse"><Sparkles size={10} /> Auto-filled</span>}
            </label>
            <textarea
              placeholder="e.g. Needs immediate tilling of 5 acres near the canal..."
              value={jobDesc}
              onChange={e => {
                setJobDesc(e.target.value);
                setJobFilledStatus(prev => ({ ...prev, desc: false }));
              }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 h-20 resize-none transition-all focus:ring-2 focus:ring-emerald-500 ${
                jobFilledStatus.desc ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
              } ${
                jobErrors.desc ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
              }`}
            />
            {jobErrors.desc && (
              <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> {jobErrors.desc}
              </p>
            )}
          </div>

          {/* Location and Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Location</span>
                {jobFilledStatus.location && <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><Sparkles size={8} /> Sync</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Sinnar Region"
                value={jobLocation}
                onChange={e => {
                  setJobLocation(e.target.value);
                  setJobFilledStatus(prev => ({ ...prev, location: false }));
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                  jobFilledStatus.location ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                } ${
                  jobErrors.location ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Payout (₹)</span>
                {jobFilledStatus.payment && <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><Sparkles size={8} /> Sync</span>}
              </label>
              <input
                type="number"
                placeholder="₹1200"
                value={jobPayment}
                onChange={e => {
                  setJobPayment(e.target.value);
                  setJobFilledStatus(prev => ({ ...prev, payment: false }));
                }}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                  jobFilledStatus.payment ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                } ${
                  jobErrors.payment ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Inline Errors for location & payment */}
          {(jobErrors.location || jobErrors.payment) && (
            <div className="space-y-1 mt-1">
              {jobErrors.location && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle size={10} /> {jobErrors.location}
                </p>
              )}
              {jobErrors.payment && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle size={10} /> {jobErrors.payment}
                </p>
              )}
            </div>
          )}

          {/* Skill selector required */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Required Skill</span>
              {jobFilledStatus.skill && <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse"><Sparkles size={10} /> Auto-filled</span>}
            </label>
            <select
              value={requiredSkill}
              onChange={e => {
                setRequiredSkill(e.target.value);
                setJobFilledStatus(prev => ({ ...prev, skill: false }));
              }}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 cursor-pointer focus:ring-2 focus:ring-emerald-500 ${
                jobFilledStatus.skill ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : 'border-slate-200'
              }`}
            >
              {SKILL_OPTIONS.map((skill, idx) => (
                <option key={idx} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 disabled:opacity-50 text-sm"
          >
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            <span>List Task on Board</span>
          </button>
        </form>
      </div>

      {/* List and persistent details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Jobs Board listing */}
        <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm min-h-[400px] flex flex-col">
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
            <span>Farming Tasks Board (Backend API)</span>
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 flex-grow text-slate-400">
              <Loader2 className="animate-spin text-emerald-600 mb-2" size={36} />
              <p className="text-xs font-extrabold">Contacting api/jobs backend...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 flex-grow text-red-500 bg-red-50/10 rounded-2xl border border-red-100 border-dashed animate-none">
              <AlertCircle size={40} className="mb-2 text-red-550" />
              <p className="text-xs font-extrabold">Failed to retrieve jobs registry</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-4 px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition"
              >
                Retry Request
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 flex-grow text-slate-400">
              <Briefcase size={48} className="text-slate-200 mb-2" />
              <p className="text-xs font-extrabold">No jobs registered on backend servers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const workerMatch = workers.find(w => w.id === job.worker_id);
                return (
                  <div key={job.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 animate-none">
                          <h3 className="font-extrabold text-slate-900 text-base">{job.title}</h3>
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full border border-emerald-100 font-bold uppercase select-none">
                            {job.required_skill} Needed
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium mt-1 select-none flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {job.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold flex items-center gap-1">
                          <CheckCircle size={10} /> Live
                        </span>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 font-semibold leading-relaxed">
                      {job.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold">Assigned Labourer:</span>
                        {workerMatch ? (
                          <div className="flex items-center gap-1.5 animate-none">
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-100 font-extrabold">
                              {workerMatch.name}
                            </span>
                            <button
                              onClick={() => handleUnassignWorker(job.id)}
                              className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                            >
                              Release
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-md border border-slate-200 font-extrabold uppercase">
                                Open
                              </span>
                              <button
                                onClick={() => openMatchmaker(job)}
                                className="text-xs text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                              >
                                <Search size={11} /> Find Matches
                              </button>
                            </div>
                            {job.applicants && job.applicants.length > 0 && (
                              <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-2 w-full">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Applicants ({job.applicants.length}):</span>
                                <div className="flex flex-wrap gap-2">
                                  {job.applicants.map(app => {
                                    const applicantWorker = workers.find(w => w.id === app.worker_id);
                                    if (!applicantWorker) return null;
                                    return (
                                      <div key={app.worker_id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg shadow-sm">
                                        <span className="text-[11px] font-extrabold text-indigo-800">{applicantWorker.name}</span>
                                        <button 
                                          onClick={() => handleAssignWorker(job.id, app.worker_id)}
                                          className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded cursor-pointer transition font-bold shadow-sm"
                                        >
                                          Accept
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <strong className="text-emerald-800 font-extrabold text-sm">Payout: ₹{job.payment}</strong>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Render Matchmaker Modal in-place */}
      {selectedJobForMatching && (
        <MatchmakerModal
          selectedJobForMatching={selectedJobForMatching}
          setSelectedJobForMatching={setSelectedJobForMatching}
          matchingWorkers={matchingWorkers}
          assignWorkerToJob={handleAssignWorker}
        />
      )}
    </div>
  );
};
