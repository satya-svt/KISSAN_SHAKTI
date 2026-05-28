import { useState, useEffect, useRef } from 'react'
import { db } from './db'
import { 
  Sprout, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Layers, 
  MapPin, 
  Sparkles, 
  ArrowRightLeft, 
  Briefcase, 
  Users, 
  AlertCircle, 
  FileCode, 
  X, 
  Phone, 
  Search, 
  UserCheck, 
  Mic, 
  Play, 
  Square
} from 'lucide-react'

// Default mock seed data
const SEED_CROPS = [
  {
    id: "7b9d313c-6cb2-4a0d-9b55-6b586bbd7cfa",
    farmer_id: "e3cb89cf-4a3b-4861-84bb-7313a0c5c3fb",
    name: "Basmati Rice",
    category: "grain",
    quantity_kg: 1200,
    price_per_kg: 85,
    status: "available",
    harvest_date: "2026-05-15",
    created_at: "2026-05-15T10:30:00Z",
    updated_at: "2026-05-15T10:30:00Z",
    sync_status: "synced"
  },
  {
    id: "f3c39df5-60b8-444f-a9cb-652f1e679a83",
    farmer_id: "e3cb89cf-4a3b-4861-84bb-7313a0c5c3fb",
    name: "Red Onions",
    category: "vegetable",
    quantity_kg: 2500,
    price_per_kg: 32,
    status: "available",
    harvest_date: "2026-05-20",
    created_at: "2026-05-20T08:15:00Z",
    updated_at: "2026-05-20T08:15:00Z",
    sync_status: "synced"
  }
];

const SEED_WORKERS = [
  {
    id: "w1-9b55-6b586bbd7cfa",
    name: "Suresh Patil",
    phone: "+91 91234 56789",
    skills: ["Harvesting", "Sowing"],
    daily_rate: 450,
    status: "active",
    created_at: "2026-05-26T09:00:00Z",
    updated_at: "2026-05-26T09:00:00Z",
    sync_status: "synced"
  },
  {
    id: "w2-a9cb-652f1e679a83",
    name: "Amit Shinde",
    phone: "+91 99887 76655",
    skills: ["Tractor Driving", "Soil Tilling"],
    daily_rate: 650,
    status: "active",
    created_at: "2026-05-26T10:30:00Z",
    updated_at: "2026-05-26T10:30:00Z",
    sync_status: "synced"
  },
  {
    id: "w3-f3cb-652f1e679b94",
    name: "Ramesh Pawar",
    phone: "+91 98765 43210",
    skills: ["Irrigation", "Sowing"],
    daily_rate: 400,
    status: "active",
    created_at: "2026-05-26T11:00:00Z",
    updated_at: "2026-05-26T11:00:00Z",
    sync_status: "synced"
  }
];

const SEED_JOBS = [
  {
    id: "j1-7cfa-4a0d-9b55-6b586bbd7cfa",
    worker_id: "w2-a9cb-652f1e679a83",
    title: "Tractor Soil Tilling",
    description: "Tilling of 4.5 acres of land in Nashik using modern tractor equipment.",
    location: "Pimplad Village",
    payment: 1800,
    required_skill: "Soil Tilling",
    status: "assigned",
    created_at: "2026-05-27T06:00:00Z",
    updated_at: "2026-05-27T06:00:00Z",
    sync_status: "synced"
  },
  {
    id: "j2-8cfa-4a0d-9b55-6b586bbd7cfb",
    worker_id: null,
    title: "Wheat Crop Harvesting",
    description: "Manual harvesting and gathering of high-grade wheat crop over 2 acres.",
    location: "Sinnar Region",
    payment: 1200,
    required_skill: "Harvesting",
    status: "open",
    created_at: "2026-05-27T08:00:00Z",
    updated_at: "2026-05-27T08:00:00Z",
    sync_status: "synced"
  }
];

function App() {
  // App states mapping to Dexie stores
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'workers', 'jobs', 'sync_audit', 'schema'
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [toast, setToast] = useState(null);

  // Dexie loaded lists
  const [crops, setCrops] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);

  // Form states - Crops
  const [cropName, setCropName] = useState('');
  const [cropCategory, setCropCategory] = useState('vegetable');
  const [cropQuantity, setCropQuantity] = useState('');
  const [cropPrice, setCropPrice] = useState('');
  const [cropHarvestDate, setCropHarvestDate] = useState('');

  // Form states - Workers
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerRate, setWorkerRate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [workerErrors, setWorkerErrors] = useState({});

  // Form states - Jobs
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobPayment, setJobPayment] = useState('');
  const [requiredSkill, setRequiredSkill] = useState('Harvesting');
  const [assignedWorkerId, setAssignedWorkerId] = useState('');
  const [jobErrors, setJobErrors] = useState({});

  // Matchmaker Modal states
  const [selectedJobForMatching, setSelectedJobForMatching] = useState(null);
  const [matchingWorkers, setMatchingWorkers] = useState([]);

  // Developer Simulation console states
  const simulateLatency = 1500; // ms
  const forceServerError = false;
  const [blockNetwork, setBlockNetwork] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'info', text: 'IndexedDB persistent engine initialized via Dexie.js' },
    { id: 2, time: new Date().toLocaleTimeString(), type: 'success', text: 'KissanShakthi Offline Sync Monitor online.' }
  ]);

  // Speech assistant states
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [recognizedEntities, setRecognizedEntities] = useState(null);
  const [speechActiveSection, setSpeechActiveSection] = useState('worker'); // 'worker' or 'job'

  // Field auto-fill highlighting trackers
  const [workerFilledStatus, setWorkerFilledStatus] = useState({ name: false, phone: false, rate: false, skills: false });
  const [jobFilledStatus, setJobFilledStatus] = useState({ title: false, desc: false, location: false, payment: false, skill: false });

  // Skills list options
  const SKILL_OPTIONS = ["Harvesting", "Tractor Driving", "Sowing", "Soil Tilling", "Pruning", "Irrigation"];

  // Voice simulation presets
  const WORKER_PRESETS = [
    "Register laborer Suresh Pawar, phone 9988776655, daily rate 450 rupees, specializing in Sowing and Harvesting.",
    "Register worker Amit Pawar, phone 9123456789, wage 500, skills include Tractor Driving and Soil Tilling."
  ];

  const JOB_PRESETS = [
    "Post wheat crop harvesting task, location Pimplad Village, payout is 1200 rupees, requires skill in Harvesting.",
    "Post tractor soil tilling task, description field tilling in Sinnar Region, payout 1800, requires skill in Soil Tilling."
  ];

  const logsEndRef = useRef(null);
  const visualizerRef = useRef(null);
  const recognitionRef = useRef(null);
  const simulationTimeoutRef = useRef(null);

  function logSystem(type, text) {
    setConsoleLogs(prev => [
      ...prev,
      { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), type, text }
    ].slice(-50));
  }
  async function refreshData() {
    try {
      const allCrops = await db.crops.reverse().toArray();
      const allWorkers = await db.workers.reverse().toArray();
      const allJobs = await db.jobs.reverse().toArray();
      const allQueue = await db.sync_queue.toArray();
      const allLogs = await db.sync_logs.reverse().limit(30).toArray();

      setCrops(allCrops);
      setWorkers(allWorkers);
      setJobs(allJobs);
      setSyncQueue(allQueue);
      setSyncLogs(allLogs);

      // Recalculate matches if modal is open
      if (selectedJobForMatching) {
        const currentJob = allJobs.find(j => j.id === selectedJobForMatching.id);
        if (currentJob) {
          runMatchingQuery(currentJob, allWorkers);
        }
      }
    } catch (err) {
      console.error("Failed to load local IndexedDB stores:", err);
      logSystem('error', `Failed to load IndexedDB: ${err.message}`);
    }
  }

  // Local Matching Query (hoisted standard function)
  function runMatchingQuery(job, allWorkersList = workers) {
    const matched = allWorkersList.map(worker => {
      let score = 0;
      
      if (worker.skills.includes(job.required_skill)) {
        score += 70;
      } else {
        const hasOtherSkills = worker.skills.length > 0;
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
  }

  // Synchronizer engine flushing Dexie to PostgreSQL (hoisted standard function)
  async function triggerSync() {
    const currentConnection = isOnline && !blockNetwork;
    if (!currentConnection || syncQueue.length === 0) return;
    
    setSyncing(true);
    logSystem('info', `Sync engine executing flush batch of ${syncQueue.length} records...`);

    setTimeout(async () => {
      try {
        if (forceServerError) {
          throw new Error("Simulated Server Failure: 500 Internal Server Error.");
        }

        const syncedCount = syncQueue.length;
        
        await db.crops.where('sync_status').notEqual('synced').modify({ sync_status: 'synced', updated_at: new Date().toISOString() });
        await db.workers.where('sync_status').notEqual('synced').modify({ sync_status: 'synced', updated_at: new Date().toISOString() });
        await db.jobs.where('sync_status').notEqual('synced').modify({ sync_status: 'synced', updated_at: new Date().toISOString() });

        await db.sync_queue.clear();

        await db.sync_logs.add({
          status: 'SUCCESS',
          message: `Successfully flushed ${syncedCount} mutation records to remote server.`,
          records_count: syncedCount,
          created_at: new Date().toISOString()
        });

        logSystem('success', `Synchronized successfully: Pushed ${syncedCount} mutations. Local store synchronized.`);
        setSyncing(false);
        setLastSyncTime(new Date().toLocaleTimeString());
        await refreshData();
      } catch (err) {
        console.error("Sync execution failed:", err);
        logSystem('error', `Synchronization failed: ${err.message}`);
        
        await db.sync_logs.add({
          status: 'FAILED',
          message: `Flushing aborted: ${err.message}`,
          records_count: syncQueue.length,
          created_at: new Date().toISOString()
        });

        setSyncing(false);
        await refreshData();
      }
    }, simulateLatency);
  }

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Initial Seeding and Database Loading
  useEffect(() => {
    async function seedAndLoad() {
      const cropCount = await db.crops.count();
      if (cropCount === 0) {
        await db.crops.bulkAdd(SEED_CROPS);
        logSystem('info', 'Seeded initial Crops memory into IndexedDB.');
      }
      
      const workerCount = await db.workers.count();
      if (workerCount === 0) {
        await db.workers.bulkAdd(SEED_WORKERS);
        logSystem('info', 'Seeded initial Workers memory into IndexedDB.');
      }

      const jobCount = await db.jobs.count();
      if (jobCount === 0) {
        await db.jobs.bulkAdd(SEED_JOBS);
        logSystem('info', 'Seeded initial Jobs Board memory into IndexedDB.');
      }

      await refreshData();
    }

    seedAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor hardware network status and blockNetwork simulator
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToast({ type: 'online', message: "🟢 You are back online! Syncing your local changes back to the server..." });
      setTimeout(() => setToast(null), 5000);
      setTimeout(() => logSystem('info', 'Device interface reported ONLINE status.'), 0);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setToast({ type: 'offline', message: "⚠️ Connection lost. You are now offline. Changes will save to IndexedDB." });
      setTimeout(() => setToast(null), 5000);
      setTimeout(() => logSystem('warn', 'Device interface reported OFFLINE status.'), 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Background Auto-Sync trigger when returning online
  useEffect(() => {
    const currentConnection = isOnline && !blockNetwork;
    if (currentConnection) {
      setTimeout(() => logSystem('success', 'Network Status: ONLINE. Simulated connection to Postgres database active.'), 0);
      if (syncQueue.length > 0) {
        setTimeout(() => logSystem('info', `Sync Queue has ${syncQueue.length} pending mutations. Triggering automatic background synchronizer...`), 0);
        setTimeout(() => triggerSync(), 0);
      }
    } else {
      setTimeout(() => logSystem('warn', `Network Status: OFFLINE (${blockNetwork ? 'Dev Simulated' : 'Hardware outage'}). Form submissions will cache locally in IndexedDB.`), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, blockNetwork, syncQueue.length]);

  // Canvas Visualizer Permanent Animation Loop
  useEffect(() => {
    const canvas = visualizerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    let offset = 0;
    
    // Web Audio API variables
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let source = null;
    let stream = null;

    if (isRecording) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(s => {
            stream = s;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            const drawLive = () => {
              animationId = requestAnimationFrame(drawLive);
              analyser.getByteFrequencyData(dataArray);
              
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.lineWidth = 3;
              ctx.strokeStyle = '#10b981';
              ctx.beginPath();
              
              const sliceWidth = canvas.width / bufferLength;
              let drawX = 0;
              
              for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;
                
                if (i === 0) ctx.moveTo(drawX, y);
                else ctx.lineTo(drawX, y);
                
                drawX += sliceWidth;
              }
              ctx.lineTo(canvas.width, canvas.height / 2);
              ctx.stroke();
            };
            drawLive();
          })
          .catch(() => {
            const drawSimulatedActive = () => {
              animationId = requestAnimationFrame(drawSimulatedActive);
              
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.lineWidth = 2.5;
              ctx.strokeStyle = '#10b981';
              ctx.beginPath();
              
              for (let i = 0; i < canvas.width; i++) {
                const y = canvas.height / 2 + Math.sin(i * 0.08 + offset) * 14 * Math.sin(offset * 0.2);
                if (i === 0) ctx.moveTo(i, y);
                else ctx.lineTo(i, y);
              }
              ctx.stroke();
              offset += 0.18;
            };
            drawSimulatedActive();
          });
      } else {
        const drawSimulatedActive = () => {
          animationId = requestAnimationFrame(drawSimulatedActive);
          
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();
          
          for (let i = 0; i < canvas.width; i++) {
            const y = canvas.height / 2 + Math.sin(i * 0.08 + offset) * 14 * Math.sin(offset * 0.2);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();
          offset += 0.18;
        };
        drawSimulatedActive();
      }
    } else {
      const drawIdle = () => {
        animationId = requestAnimationFrame(drawIdle);
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#10b98133';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.strokeStyle = '#10b98177';
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + Math.sin(i * 0.04 + offset) * 3;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
        offset += 0.04;
      };
      drawIdle();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, [isRecording, activeTab]);

  // Add Crop (Offline-First via Dexie)
  const handleAddCrop = async (e) => {
    if (e) e.preventDefault();
    if (!cropName || !cropQuantity || !cropPrice || !cropHarvestDate) return;

    const newId = crypto.randomUUID();
    const newCrop = {
      id: newId,
      farmer_id: "e3cb89cf-4a3b-4861-84bb-7313a0c5c3fb",
      name: cropName,
      category: cropCategory,
      quantity_kg: parseFloat(cropQuantity),
      price_per_kg: parseFloat(cropPrice),
      status: "available",
      harvest_date: cropHarvestDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: (isOnline && !blockNetwork) ? "synced" : "pending_create"
    };

    await db.crops.add(newCrop);
    logSystem('success', `Crop Listing "${cropName}" saved persistently in IndexedDB.`);

    if (!isOnline || blockNetwork) {
      await db.sync_queue.add({
        action: 'CREATE',
        entity_type: 'crops',
        entity_id: newId,
        payload: newCrop,
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: crop mutation registered in sync_queue.`);
    }

    setCropName('');
    setCropQuantity('');
    setCropPrice('');
    setCropHarvestDate('');
    await refreshData();
  };

  // Register Worker with Enforced Validations
  const handleAddWorker = async (e) => {
    if (e) e.preventDefault();
    const errors = {};

    if (!workerName || workerName.trim().length < 3) {
      errors.name = "Full name must be at least 3 characters long.";
    }

    const phoneRegex = /^(\+91[\s-]?)?[6789]\d{9}$/;
    if (!workerPhone) {
      errors.phone = "Mobile phone number is required.";
    } else if (!phoneRegex.test(workerPhone.replace(/\s+/g, ''))) {
      errors.phone = "Invalid format. Enforce a 10-digit mobile number (e.g. +91 98765 43210).";
    }

    const rate = parseFloat(workerRate);
    if (isNaN(rate) || rate < 250 || rate > 2500) {
      errors.rate = "Daily rate must be a realistic farm wage between ₹250 and ₹2,500.";
    }

    if (selectedSkills.length === 0) {
      errors.skills = "Select at least one specialty skill chip for this laborer.";
    }

    if (Object.keys(errors).length > 0) {
      setWorkerErrors(errors);
      logSystem('error', `Form submission blocked: ${Object.keys(errors).length} validation failures detected.`);
      return;
    }

    setWorkerErrors({});

    const newId = crypto.randomUUID();
    const newWorker = {
      id: newId,
      name: workerName.trim(),
      phone: workerPhone.trim(),
      skills: selectedSkills,
      daily_rate: rate,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: (isOnline && !blockNetwork) ? "synced" : "pending_create"
    };

    await db.workers.add(newWorker);
    logSystem('success', `Worker profile for "${workerName.trim()}" registered in IndexedDB.`);

    if (!isOnline || blockNetwork) {
      await db.sync_queue.add({
        action: 'CREATE',
        entity_type: 'workers',
        entity_id: newId,
        payload: newWorker,
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: worker mutation registered in sync_queue.`);
    }

    setWorkerName('');
    setWorkerPhone('');
    setWorkerRate('');
    setSelectedSkills([]);
    setWorkerFilledStatus({ name: false, phone: false, rate: false, skills: false });
    await refreshData();
  };

  const toggleSkillSelection = (skill) => {
    setWorkerFilledStatus(prev => ({ ...prev, skills: false }));
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Post Job with Enforced Validations
  const handleAddJob = async (e) => {
    if (e) e.preventDefault();
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
      logSystem('error', `Form submission blocked: ${Object.keys(errors).length} job validation failures.`);
      return;
    }

    setJobErrors({});

    const newId = crypto.randomUUID();
    const newJob = {
      id: newId,
      worker_id: assignedWorkerId || null,
      title: jobTitle.trim(),
      description: jobDesc.trim(),
      location: jobLocation.trim(),
      payment: payment,
      required_skill: requiredSkill,
      status: assignedWorkerId ? "assigned" : "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: (isOnline && !blockNetwork) ? "synced" : "pending_create"
    };

    await db.jobs.add(newJob);
    logSystem('success', `Agricultural task "${jobTitle.trim()}" posted in IndexedDB.`);

    if (!isOnline || blockNetwork) {
      await db.sync_queue.add({
        action: 'CREATE',
        entity_type: 'jobs',
        entity_id: newId,
        payload: newJob,
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: job mutation registered in sync_queue.`);
    }

    setJobTitle('');
    setJobDesc('');
    setJobLocation('');
    setJobPayment('');
    setRequiredSkill('Harvesting');
    setAssignedWorkerId('');
    setJobFilledStatus({ title: false, desc: false, location: false, payment: false, skill: false });
    await refreshData();
  };

  const handleDeleteItem = async (entity, id) => {
    if (entity === 'crops') {
      await db.crops.delete(id);
    } else if (entity === 'workers') {
      await db.workers.delete(id);
    } else if (entity === 'jobs') {
      await db.jobs.delete(id);
    }

    logSystem('warn', `Deleted item with ID: ${id} from IndexedDB table [${entity}].`);

    if (!isOnline || blockNetwork) {
      await db.sync_queue.add({
        action: 'DELETE',
        entity_type: entity,
        entity_id: id,
        payload: { id },
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: logged DELETE mutation in sync_queue.`);
    }

    await refreshData();
  };

  const openMatchmaker = (job) => {
    setSelectedJobForMatching(job);
    runMatchingQuery(job, workers);
  };

  const assignWorkerToJob = async (workerId) => {
    if (!selectedJobForMatching) return;

    const jobId = selectedJobForMatching.id;

    await db.jobs.update(jobId, {
      worker_id: workerId,
      status: "assigned",
      updated_at: new Date().toISOString(),
      sync_status: (isOnline && !blockNetwork) ? "synced" : "pending_update"
    });

    logSystem('success', `Assigned worker [${workerId}] to Job task [${jobId}] locally.`);

    if (!isOnline || blockNetwork) {
      const updatedJob = await db.jobs.get(jobId);
      await db.sync_queue.add({
        action: 'UPDATE',
        entity_type: 'jobs',
        entity_id: jobId,
        payload: updatedJob,
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: logged UPDATE mutation in sync_queue.`);
    }

    setSelectedJobForMatching(null);
    await refreshData();
  };

  const unassignWorker = async (jobId) => {
    await db.jobs.update(jobId, {
      worker_id: null,
      status: "open",
      updated_at: new Date().toISOString(),
      sync_status: (isOnline && !blockNetwork) ? "synced" : "pending_update"
    });

    logSystem('info', `Unassigned worker from Job task [${jobId}] locally.`);

    if (!isOnline || blockNetwork) {
      const updatedJob = await db.jobs.get(jobId);
      await db.sync_queue.add({
        action: 'UPDATE',
        entity_type: 'jobs',
        entity_id: jobId,
        payload: updatedJob,
        created_at: new Date().toISOString()
      });
      logSystem('warn', `Offline mode active: logged unassignment UPDATE mutation in sync_queue.`);
    }

    await refreshData();
  };

  const handleClearLogs = async () => {
    await db.sync_logs.clear();
    logSystem('info', 'Sync audit logs table cleared.');
    await refreshData();
  };

  const parseSpeechText = (text) => {
    const textLower = text.toLowerCase();
    
    const skillMap = {
      'harvesting': 'Harvesting',
      'harvest': 'Harvesting',
      'cut': 'Harvesting',
      'cutting': 'Harvesting',
      'tractor': 'Tractor Driving',
      'driving': 'Tractor Driving',
      'driver': 'Tractor Driving',
      'sowing': 'Sowing',
      'sow': 'Sowing',
      'plant': 'Sowing',
      'planting': 'Sowing',
      'till': 'Soil Tilling',
      'tilling': 'Soil Tilling',
      'plow': 'Soil Tilling',
      'plowing': 'Soil Tilling',
      'pruning': 'Pruning',
      'prune': 'Pruning',
      'trimming': 'Pruning',
      'irrigation': 'Irrigation',
      'water': 'Irrigation',
      'watering': 'Irrigation'
    };

    const skillsFound = [];
    Object.keys(skillMap).forEach(key => {
      if (textLower.includes(key)) {
        const standardSkill = skillMap[key];
        if (!skillsFound.includes(standardSkill)) {
          skillsFound.push(standardSkill);
        }
      }
    });

    const phoneMatch = text.replace(/[\s\-_]/g, '').match(/\d{10}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    let rate = '';
    const rateMatch = textLower.match(/(?:wage|rate|pay|payout|₹|rupees|rupee)\s*(\d{3,4})/) || 
                      textLower.match(/(\d{3,4})\s*(?:wage|rate|pay|payout|rupees|rupee)/) ||
                      textLower.match(/(?:daily|cost)\s*(\d{3,4})/);
    if (rateMatch) {
      rate = rateMatch[1];
    } else {
      const numbers = text.match(/\b\d{3,4}\b/g);
      if (numbers) {
        rate = numbers[0];
      }
    }

    let name = '';
    const nameMatch = text.match(/(?:worker|laborer|labor|name|register)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      name = nameMatch[1];
    } else {
      const capitalizedWords = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/);
      if (capitalizedWords) {
        name = capitalizedWords[0];
      }
    }

    let location = '';
    const locMatch = text.match(/(?:in|at|near|location)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:\s+Village|\s+Region|\s+Field)?)/i);
    if (locMatch) {
      location = locMatch[1];
    } else {
      if (textLower.includes('pimplad')) location = 'Pimplad Village';
      else if (textLower.includes('sinnar')) location = 'Sinnar Region';
      else if (textLower.includes('nashik')) location = 'Nashik District';
    }

    let title = '';
    const titleMatch = text.match(/(?:post|task|job|work)\s+([^,.]+)/i);
    if (titleMatch) {
      title = titleMatch[1];
    } else {
      if (skillsFound.length > 0) {
        title = `${skillsFound[0]} Task`;
      }
    }

    return {
      name: name ? name.trim() : '',
      phone: phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '',
      rate: rate || '',
      skills: skillsFound,
      location: location ? location.trim() : '',
      title: title ? title.trim() : '',
      desc: text.slice(0, 100) + (text.length > 100 ? '...' : '')
    };
  };

  function runLiveSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      logSystem('warn', 'Web Speech API is not supported in this browser. Initiating auto voice preset simulator...');
      runSimulatedSpeech(speechActiveSection === 'worker' ? WORKER_PRESETS[0] : JOB_PRESETS[0]);
      return;
    }

    setIsRecording(true);
    setSpeechText('');
    setRecognizedEntities(null);
    logSystem('info', 'Microphone recording active. Canvas wave visualizer listening...');

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const textTranscribed = event.results[0][0].transcript;
      setSpeechText(textTranscribed);
      logSystem('success', `Voice recognized: "${textTranscribed}"`);
      
      const entities = parseSpeechText(textTranscribed);
      setRecognizedEntities(entities);
      logSystem('info', `Voice AI Parsed: ${JSON.stringify(entities)}`);
    };

    recognition.onerror = (e) => {
      logSystem('error', `Speech engine error: ${e.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }

  function runSimulatedSpeech(text) {
    setIsRecording(true);
    setSpeechText('');
    setRecognizedEntities(null);
    logSystem('info', `Simulating speech input transcription: "${text}"`);

    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }

    simulationTimeoutRef.current = setTimeout(() => {
      setIsRecording(false);
      setSpeechText(text);
      
      const entities = parseSpeechText(text);
      setRecognizedEntities(entities);
      logSystem('success', `Simulated Voice AI Transcription complete.`);
      simulationTimeoutRef.current = null;
    }, 1800);
  }

  function handleToggleSpeech() {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        logSystem('info', 'Microphone recording stopped manually by user.');
      }
      if (simulationTimeoutRef.current) {
        clearTimeout(simulationTimeoutRef.current);
        simulationTimeoutRef.current = null;
        setIsRecording(false);
        logSystem('info', 'Speech simulation stopped manually.');
      }
    } else {
      runLiveSpeech();
    }
  }

  const applyVoiceEntities = () => {
    if (!recognizedEntities) return;

    if (speechActiveSection === 'worker') {
      if (recognizedEntities.name) {
        setWorkerName(recognizedEntities.name);
        setWorkerFilledStatus(prev => ({ ...prev, name: true }));
      }
      if (recognizedEntities.phone) {
        setWorkerPhone(recognizedEntities.phone);
        setWorkerFilledStatus(prev => ({ ...prev, phone: true }));
      }
      if (recognizedEntities.rate) {
        setWorkerRate(recognizedEntities.rate);
        setWorkerFilledStatus(prev => ({ ...prev, rate: true }));
      }
      if (recognizedEntities.skills.length > 0) {
        setSelectedSkills(recognizedEntities.skills);
        setWorkerFilledStatus(prev => ({ ...prev, skills: true }));
      }
      setActiveTab('workers');
      logSystem('success', 'Injected Voice AI entities into Laborer Registration fields.');
    } else {
      if (recognizedEntities.title) {
        setJobTitle(recognizedEntities.title);
        setJobFilledStatus(prev => ({ ...prev, title: true }));
      }
      if (recognizedEntities.desc) {
        setJobDesc(recognizedEntities.desc);
        setJobFilledStatus(prev => ({ ...prev, desc: true }));
      }
      if (recognizedEntities.location) {
        setJobLocation(recognizedEntities.location);
        setJobFilledStatus(prev => ({ ...prev, location: true }));
      }
      if (recognizedEntities.rate) {
        setJobPayment(recognizedEntities.rate);
        setJobFilledStatus(prev => ({ ...prev, payment: true }));
      }
      if (recognizedEntities.skills.length > 0) {
        setRequiredSkill(recognizedEntities.skills[0]);
        setJobFilledStatus(prev => ({ ...prev, skill: true }));
      }
      setActiveTab('jobs');
      logSystem('success', 'Injected Voice AI entities into Task Posting fields.');
    }

    setSpeechText('');
    setRecognizedEntities(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Offline Status Banner */}
      {(!isOnline || blockNetwork) && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-inner animate-pulse transition-all duration-300 z-50">
          <WifiOff size={16} />
          <span>Offline mode active. Form submits will save locally to IndexedDB & sync queue.</span>
        </div>
      )}

      {/* Main Header */}
      <header className="glass sticky top-0 z-40 border-b border-emerald-100 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center">
              <Sprout size={28} className="animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-1.5">
                KissanShakthi
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={14} />
                <span>Crops</span>
              </button>
              
              <button
                onClick={() => setActiveTab('workers')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'workers' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={14} />
                <span>Workers</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'jobs' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase size={14} />
                <span>Jobs Board</span>
              </button>
            </nav>

            {/* Offline simulation togglers */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setBlockNetwork(false);
                  setToast({ type: 'online', message: "🟢 You are back online! Syncing your local changes back to the server..." });
                  setTimeout(() => setToast(null), 5000);
                }}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  (!blockNetwork && isOnline) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Wifi size={13} />
                <span className="hidden sm:inline">Online</span>
              </button>
              <button
                onClick={() => {
                  setBlockNetwork(true);
                  setToast({ type: 'offline', message: "⚠️ Connection lost. You are now offline. Changes will save to IndexedDB." });
                  setTimeout(() => setToast(null), 5000);
                }}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  (blockNetwork || !isOnline) ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <WifiOff size={13} />
                <span className="hidden sm:inline">Offline</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Core System Status Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Active SW indicator */}
          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-emerald-100/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">IndexedDB Engine</span>
              <p className="text-sm font-extrabold text-emerald-800 mt-1 flex items-center gap-1.5">
                <CheckCircle size={15} />
                Dexie.js Live Memory
              </p>
            </div>
            <Database size={24} className="text-emerald-600 opacity-60" />
          </div>

          {/* Sync status */}
          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-emerald-100/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">REST Syncer Mode</span>
              <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                {(!blockNetwork && isOnline) ? (
                  <><Wifi size={15} className="text-emerald-600" /> API Connected</>
                ) : (
                  <><WifiOff size={15} className="text-amber-600 animate-pulse" /> Offline Buffers</>
                )}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">Last Sync: {lastSyncTime}</p>
            </div>
            <span className={`w-3.5 h-3.5 rounded-full ${(!blockNetwork && isOnline) ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-amber-500 shadow-md shadow-amber-500/30'}`}></span>
          </div>

          {/* Queue Count */}
          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-emerald-100/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Queue: sync_queue</span>
              <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                <Clock size={15} className={syncQueue.length > 0 ? 'text-amber-500 animate-spin' : 'text-slate-400'} />
                {syncQueue.length} Logs Queued
              </p>
            </div>
            <button
              onClick={triggerSync}
              disabled={blockNetwork || !isOnline || syncing || syncQueue.length === 0}
              className={`p-2 rounded-xl border transition-all duration-300 ${
                blockNetwork || !isOnline || syncQueue.length === 0 
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-100 cursor-pointer'
              }`}
              title="Sync Pending Modifications"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Seeding Indicator */}
          <div className="glass p-5 rounded-2xl flex items-center justify-between border border-emerald-100/50">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Local Persistence</span>
              <p className="text-xs font-bold text-slate-600 mt-1">
                IndexedDB: <strong className="text-slate-900">{crops.length + workers.length + jobs.length} objects</strong>
              </p>
            </div>
            <Sparkles size={18} className="text-emerald-500" />
          </div>
        </div>

        {/* KissanShakthi Voice AI Assistant section */}
        {(activeTab === 'workers' || activeTab === 'jobs') && (
          <div className="glass p-6 rounded-3xl border border-emerald-100 shadow-md mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Mic className="text-emerald-600 animate-bounce" size={20} />
                  🎙️ KissanShakthi Speech Auto-Filler
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Speak to pre-fill standard form fields automatically. Uses rule-based AI keyword extraction!
                </p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => {
                      setSpeechActiveSection('worker');
                      setRecognizedEntities(null);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      speechActiveSection === 'worker' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Worker Registration Mode
                  </button>
                  <button 
                    onClick={() => {
                      setSpeechActiveSection('job');
                      setRecognizedEntities(null);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      speechActiveSection === 'job' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Task Posting Mode
                  </button>
                </div>
              </div>

              {/* Action and waveform visualizer */}
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <canvas 
                  ref={visualizerRef}
                  width="180" 
                  height="45" 
                  className="rounded-xl bg-slate-950 border border-slate-900 h-[45px] w-full md:w-[180px] shadow-inner"
                ></canvas>

                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleToggleSpeech}
                    className={`flex-grow md:flex-grow-0 px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                    }`}
                  >
                    {isRecording ? <Square size={13} /> : <Mic size={13} />}
                    <span>{isRecording ? 'Stop Recording' : 'Speak Live'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Presets and Speech outputs */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice simulation triggers */}
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">
                  🚀 Farmer Speech Simulations (Preset Testers):
                </span>
                <div className="space-y-2">
                  {(speechActiveSection === 'worker' ? WORKER_PRESETS : JOB_PRESETS).map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => runSimulatedSpeech(preset)}
                      disabled={isRecording}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition-all duration-200"
                    >
                      <Play size={10} className="text-emerald-600 flex-shrink-0" />
                      <span className="truncate">"{preset}"</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transcription and Entities Output card */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Speech AI Transcription Results:
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-1 italic min-h-[1.5rem]">
                    {speechText ? `"${speechText}"` : (isRecording ? 'Listening and translating...' : 'Speak live or trigger simulation preset above...')}
                  </p>

                  {/* Entity display */}
                  {recognizedEntities && (
                    <div className="mt-3 p-3 bg-white border border-emerald-100 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">
                        ✨ Parsed Metadata Extraction:
                      </span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {speechActiveSection === 'worker' ? (
                          <>
                            {recognizedEntities.name && (
                              <div><strong className="text-slate-500">Name:</strong> <span className="text-slate-900 font-bold">{recognizedEntities.name}</span></div>
                            )}
                            {recognizedEntities.phone && (
                              <div><strong className="text-slate-500">Phone:</strong> <span className="text-slate-900 font-bold">{recognizedEntities.phone}</span></div>
                            )}
                            {recognizedEntities.rate && (
                              <div><strong className="text-slate-500">Wage:</strong> <span className="text-emerald-700 font-bold">₹{recognizedEntities.rate}/day</span></div>
                            )}
                            {recognizedEntities.skills.length > 0 && (
                              <div className="col-span-2">
                                <strong className="text-slate-500">Skills:</strong> <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ml-1">{recognizedEntities.skills.join(', ')}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {recognizedEntities.title && (
                              <div className="col-span-2"><strong className="text-slate-500">Task Title:</strong> <span className="text-slate-900 font-bold">"{recognizedEntities.title}"</span></div>
                            )}
                            {recognizedEntities.location && (
                              <div><strong className="text-slate-500">Location:</strong> <span className="text-slate-900 font-bold">{recognizedEntities.location}</span></div>
                            )}
                            {recognizedEntities.rate && (
                              <div><strong className="text-slate-500">Payout:</strong> <span className="text-emerald-700 font-bold">₹{recognizedEntities.rate}</span></div>
                            )}
                            {recognizedEntities.skills.length > 0 && (
                              <div className="col-span-2">
                                <strong className="text-slate-500">Skill:</strong> <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold inline-block ml-1">{recognizedEntities.skills[0]}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {recognizedEntities && (
                  <button 
                    onClick={applyVoiceEntities}
                    className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <CheckCircle size={12} />
                    <span>Auto-Fill {speechActiveSection === 'worker' ? 'Laborer' : 'Task'} Form</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Crops Board */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="glass p-6 rounded-3xl shadow-sm border border-emerald-100/50 h-fit">
              <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                List Harvest Crop
              </h2>

              <form onSubmit={handleAddCrop} className="space-y-4">
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
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Plus size={16} />
                  <span>List Local Crop Listing</span>
                </button>
              </form>
            </div>

            {/* List and Sync drawer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Table of Crops */}
              <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Persistent Crops Table: <code className="text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">crops</code></span>
                  <span className="text-xs text-slate-400 font-medium">Dexie Local Storage</span>
                </h2>

                {crops.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Sprout size={48} className="text-slate-200 mb-2" />
                    <p className="text-xs font-extrabold">No crop records found in local memory.</p>
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
                              <div>{crop.quantity_kg.toLocaleString()} kg</div>
                              <div className="text-[11px] font-bold text-emerald-700">₹{crop.price_per_kg}/kg</div>
                            </td>
                            <td className="py-3 text-slate-500 font-medium">
                              {crop.harvest_date}
                            </td>
                            <td className="py-3 text-center">
                              <div className="inline-flex">
                                {crop.sync_status === 'synced' ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold flex items-center gap-1">
                                    <CheckCircle size={10} /> Synced
                                  </span>
                                ) : (
                                  <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-100 font-extrabold flex items-center gap-1 animate-pulse">
                                    <Clock size={10} /> Pending
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteItem('crops', crop.id)}
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

              {/* Sync queue display */}
              <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm bg-slate-950/5">
                <details className="group">
                  <summary className="text-xs font-bold text-slate-600 flex items-center justify-between cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <AlertCircle size={15} className="text-amber-500" />
                      View sync_queue Local Store Content ({syncQueue.length} records pending)
                    </span>
                    <span className="transition-transform group-open:rotate-90">▶</span>
                  </summary>
                  <div className="mt-3 bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed max-h-48 shadow-inner">
                    {syncQueue.length === 0 ? (
                      <span className="text-slate-400 font-medium font-sans">Queue is empty. Everything synced with PostgreSQL database!</span>
                    ) : (
                      JSON.stringify(syncQueue, null, 2)
                    )}
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Workers Registry */}
        {activeTab === 'workers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Validated Form */}
            <div className="glass p-6 rounded-3xl shadow-sm border border-emerald-100/50 h-fit">
              <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                Register Farm Laborer
              </h2>

              <form onSubmit={handleAddWorker} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Worker Name</span>
                    {workerFilledStatus.name && <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse"><Sparkles size={10} /> Auto-filled</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Patil"
                    value={workerName}
                    onChange={e => {
                      setWorkerName(e.target.value);
                      setWorkerFilledStatus(prev => ({ ...prev, name: false }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                      workerFilledStatus.name ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                    } ${
                      workerErrors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                    }`}
                  />
                  {workerErrors.name && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {workerErrors.name}
                    </p>
                  )}
                </div>

                {/* Contact and daily rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-0.5"><Phone size={10} /> Phone</span>
                      {workerFilledStatus.phone && <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><Sparkles size={8} /> Sync</span>}
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={workerPhone}
                      onChange={e => {
                        setWorkerPhone(e.target.value);
                        setWorkerFilledStatus(prev => ({ ...prev, phone: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                        workerFilledStatus.phone ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                      } ${
                        workerErrors.phone ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Daily Rate (₹)</span>
                      {workerFilledStatus.rate && <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5"><Sparkles size={8} /> Sync</span>}
                    </label>
                    <input
                      type="number"
                      placeholder="₹450"
                      value={workerRate}
                      onChange={e => {
                        setWorkerRate(e.target.value);
                        setWorkerFilledStatus(prev => ({ ...prev, rate: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold bg-white/50 transition-all focus:ring-2 focus:ring-emerald-500 ${
                        workerFilledStatus.rate ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                      } ${
                        workerErrors.rate ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                
                {/* Inline Errors for phone and daily rate */}
                {(workerErrors.phone || workerErrors.rate) && (
                  <div className="space-y-1 mt-1">
                    {workerErrors.phone && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> {workerErrors.phone}
                      </p>
                    )}
                    {workerErrors.rate && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> {workerErrors.rate}
                      </p>
                    )}
                  </div>
                )}

                {/* Skills */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Specialty Skills</span>
                    {workerFilledStatus.skills && <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse"><Sparkles size={10} /> Auto-filled</span>}
                  </label>
                  <div className={`grid grid-cols-2 gap-2 p-2 rounded-xl transition-all ${
                    workerFilledStatus.skills ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10' : ''
                  }`}>
                    {SKILL_OPTIONS.map((skill, idx) => (
                      <label key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-100 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill)}
                          onChange={() => toggleSkillSelection(skill)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                  </div>
                  {workerErrors.skills && (
                    <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
                      <AlertCircle size={10} /> {workerErrors.skills}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Plus size={16} />
                  <span>Register Laborer Offline-First</span>
                </button>
              </form>
            </div>

            {/* List and persistent details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workers Registry */}
              <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Persistent Laborers: <code className="text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">workers</code></span>
                  <span className="text-xs text-slate-400 font-medium">Dexie Local Storage</span>
                </h2>

                {workers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Users size={48} className="text-slate-200 mb-2" />
                    <p className="text-xs font-extrabold">No workers registered in local IndexedDB memory.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workers.map((worker) => (
                      <div key={worker.id} className="bg-emerald-50/10 border border-emerald-100/30 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-300">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base">{worker.name}</span>
                            <div className="flex items-center gap-2">
                              {worker.sync_status === 'synced' ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold" title="Synced to PostgreSQL">Synced</span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-100 font-extrabold animate-pulse" title="Saved locally in Dexie.js">Pending</span>
                              )}
                              <button
                                onClick={() => handleDeleteItem('workers', worker.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-slate-500 text-xs mt-1 font-semibold">{worker.phone}</p>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {worker.skills.map((skill, sIdx) => (
                              <span key={sIdx} className="bg-white/80 border border-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                {skill}
                              </span>
                            ))}
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
        )}

        {/* Tab 3: Jobs Board & Matchmaker */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Validated Posting Form */}
            <div className="glass p-6 rounded-3xl shadow-sm border border-emerald-100/50 h-fit">
              <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                Post Agricultural Task
              </h2>

              <form onSubmit={handleAddJob} className="space-y-4">
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
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Plus size={16} />
                  <span>List Task on Board</span>
                </button>
              </form>
            </div>

            {/* List and persistent details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Jobs Board listing */}
              <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Farming Tasks Board: <code className="text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">jobs</code></span>
                  <span className="text-xs text-slate-400 font-medium">Dexie Local Storage</span>
                </h2>

                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Briefcase size={48} className="text-slate-200 mb-2" />
                    <p className="text-xs font-extrabold">No jobs listed on local database board.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => {
                      const workerMatch = workers.find(w => w.id === job.worker_id);
                      return (
                        <div key={job.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
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
                              {job.sync_status === 'synced' ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold">Synced</span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-100 font-extrabold animate-pulse">Pending</span>
                              )}
                              <button
                                onClick={() => handleDeleteItem('jobs', job.id)}
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
                              <span className="text-slate-400 font-semibold">Assigned Laborer:</span>
                              {workerMatch ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-100 font-extrabold">
                                    {workerMatch.name}
                                  </span>
                                  <button
                                    onClick={() => unassignWorker(job.id)}
                                    className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                                  >
                                    Release
                                  </button>
                                </div>
                              ) : (
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
          </div>
        )}

        {/* Tab 4: Sync Audit Logs */}
        {activeTab === 'sync_audit' && (
          <div className="glass p-6 rounded-3xl border border-emerald-100/50 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Database className="text-emerald-600 animate-pulse" size={20} />
                  Background Sync Audit Trail
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Chronological history of automatic & manual synchronizations compiled from browser local DB table: <code className="bg-emerald-50 text-emerald-800 font-bold px-1 py-0.2 rounded">sync_logs</code>
                </p>
              </div>
              <button 
                onClick={handleClearLogs}
                disabled={syncLogs.length === 0}
                className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Clear History
              </button>
            </div>

            {syncLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Database size={36} className="mx-auto mb-2 text-slate-200" />
                <p className="text-xs font-bold">No sync operations logged yet.</p>
                <p className="text-[10px] text-slate-400 font-medium">Create and modify data while offline, then trigger sync to log actions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      log.status === 'SUCCESS' 
                        ? 'bg-emerald-50/10 border-emerald-100' 
                        : 'bg-red-50/10 border-red-100'
                    }`}
                  >
                    <div>
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mb-1 sm:mb-0 mr-2 ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                      <strong className="text-slate-800 font-extrabold">{log.message}</strong>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Records affected: {log.records_count}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock size={11} /> {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Database & API locked specs */}
        {activeTab === 'schema' && (
          <div className="glass p-8 rounded-3xl shadow-sm border border-emerald-100/50 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Database className="text-emerald-600" size={24} />
                  KissanShakthi Locked Specifications
                </h2>
                <p className="text-sm text-slate-500 font-medium">Locked JSON payload contracts between local memory ORM and remote servers</p>
              </div>
              <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 select-none">
                <ArrowRightLeft size={14} className="text-slate-400" />
                <span>JSON Payload Locks</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Registrations */}
              <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs mb-3 uppercase tracking-wider">
                  <Users size={15} />
                  POST /api/workers/register
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Request Payload Shape:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[9px] font-mono leading-relaxed overflow-x-auto max-h-36 shadow-inner">
{`{
  "id": "UUID-String",
  "name": "Suresh Patil",
  "phone": "+91 91234 56789",
  "skills": ["Harvesting"],
  "daily_rate": 450,
  "status": "active"
}`}
                  </pre>
                </div>
              </div>

              {/* Card 2: Post Job */}
              <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs mb-3 uppercase tracking-wider">
                  <Briefcase size={15} />
                  POST /api/jobs/post
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Request Payload Shape:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[9px] font-mono leading-relaxed overflow-x-auto max-h-36 shadow-inner">
{`{
  "id": "UUID-String",
  "title": "Wheat Harvesting",
  "description": "2 acres wheat field...",
  "location": "Sinnar Region",
  "payment": 1200,
  "worker_id": null
}`}
                  </pre>
                </div>
              </div>

              {/* Card 3: Matching Queries */}
              <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs mb-3 uppercase tracking-wider">
                  <Search size={15} />
                  GET /api/jobs/{`{job_id}`}/match
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Response Matches List Shape:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[9px] font-mono leading-relaxed overflow-x-auto max-h-36 shadow-inner">
{`{
  "job_id": "UUID-String",
  "matches": [
    {
      "worker_id": "UUID-String",
      "name": "Suresh Patil",
      "phone": "+91 91234 56789",
      "skills": ["Harvesting"],
      "daily_rate": 450,
      "match_score": 100
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-semibold flex items-center gap-2">
              <FileCode size={15} />
              <span>Conventions logged inside <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">db-conventions.md</code> inside frontend folder</span>
            </div>
          </div>
        )}

      </main>

      {/* Matchmaker Modal Popup Overlay */}
      {selectedJobForMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100/50 border border-emerald-100 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide select-none">
                  Farming Matchmaker Engine
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1.5">
                  Find Workers for: <span className="text-emerald-950 font-black">"{selectedJobForMatching.title}"</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Matches are queried from Dexie.js by required specialty: <strong className="text-slate-600 font-bold">"{selectedJobForMatching.required_skill}"</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedJobForMatching(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Match List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
              {matchingWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <AlertCircle size={40} className="text-slate-200 mb-2" />
                  <p className="text-xs font-extrabold">No workers found with matching agricultural skills in IndexedDB.</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Try registering a worker who specializes in "{selectedJobForMatching.required_skill}".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                    Retrieving matched profiles ({matchingWorkers.length}) sorted by calculated Match Score:
                  </span>
                  
                  {matchingWorkers.map((worker) => (
                    <div 
                      key={worker.id} 
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
                        worker.match_score >= 100 
                          ? 'bg-emerald-50/10 border-emerald-100 hover:border-emerald-300' 
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{worker.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            worker.match_score >= 100 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {worker.match_score}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Phone: {worker.phone} • Wage: ₹{worker.daily_rate}/day</p>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worker.skills.map((s, idx) => (
                            <span 
                              key={idx} 
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                s === selectedJobForMatching.required_skill 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => assignWorkerToJob(worker.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1 transition-all duration-300 shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        <UserCheck size={12} />
                        <span>Hire & Assign</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
              <span>IndexedDB Matchmaker Query simulation active</span>
              <span>GET /api/jobs/{`{id}`}/match JSON mapped</span>
            </div>

          </div>
        </div>
      )}

      {/* Developer Testing Simulation Console */}
      {/* Dynamic Toast Notification Popup Overlay */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border font-extrabold text-sm flex items-center gap-3 transition-all duration-300 ${
            toast.type === 'online' 
              ? 'bg-emerald-600/95 text-white border-emerald-400' 
              : 'bg-amber-600/95 text-white border-amber-500'
          }`}>
            {toast.type === 'online' ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="glass border-t border-emerald-100/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 font-semibold flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 KissanShakthi Offline-First Platform. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

export default App
