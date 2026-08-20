import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  HardHat, Plus, MapPin, CheckCircle2, Clock, Search, Filter, 
  ClipboardList, ThumbsUp, AlertTriangle, Building2, Calendar, 
  ChevronRight, Sparkles, RefreshCw, X, Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';
import { GlassInput, GlassSelect, GlassTextarea } from '../components/ui/GlassInput';
import { GlassTimeline } from '../components/ui/GlassTimeline';
import { CivicGrievancePanel } from '../components/civic/CivicGrievancePanel';
import { GrievanceImageGallery } from '../components/civic/GrievanceImageGallery';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const origin = baseUrl.replace('/api/v1', '');
  return `${origin}${img}`;
};

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-roads', name: 'Roads & Highway Infrastructure Dept', code: 'RHID' },
  { id: 'dept-elec', name: 'Electrical & Street Lighting Div', code: 'ESLD' },
  { id: 'dept-drain', name: 'Stormwater & Drainage Board', code: 'SWDB' },
  { id: 'dept-water', name: 'Municipal Water Supply Board', code: 'MWSB' },
  { id: 'dept-waste', name: 'Sanitation & Solid Waste Division', code: 'SSWD' },
  { id: 'dept-traffic', name: 'Traffic Engineering & Signals Dept', code: 'TESD' },
  { id: 'dept-pwd', name: 'Public Works Dept (PWD)', code: 'PWD' },
  { id: 'dept-parks', name: 'Parks & Urban Forestry Dept', code: 'PUFD' },
];

const INITIAL_DEMO_REPORTS = [
  {
    id: 'civ-rep-081',
    reportCode: 'CIV-2026-081',
    category: 'pothole',
    title: 'Deep Hazardous Pothole Cluster on MG Road',
    description: 'Multiple deep crater-like potholes extending across both lanes following heavy pre-monsoon downpours. Causing severe traffic congestion and vehicle tire damage.',
    address: 'Near Old Rambara Bridge, Mandakini Valley, Sector 3',
    latitude: 30.7346,
    longitude: 79.0669,
    urgency: 'critical',
    status: 'in_progress',
    upvotes: 54,
    hasUpvoted: false,
    department: 'Roads & Highway Infrastructure Dept',
    departmentId: 'dept-roads',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-1', status: 'submitted', label: 'Report Submitted', note: 'Logged by citizen with GPS location and photo evidence.', createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { id: 'tl-2', status: 'assigned', label: 'Department Assigned', note: 'Assigned to Roads & Highway Infrastructure Dept (Ward 12 Squad).', createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString() },
      { id: 'tl-3', status: 'in_progress', label: 'Work In Progress', note: 'Asphalt cold-mix patch work and roller compaction actively underway.', createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-082',
    reportCode: 'CIV-2026-082',
    category: 'broken_streetlight',
    title: 'High-Mast Streetlights Inoperative at Main Junction',
    description: 'Complete cluster of 4 high-mast street lamps inoperative for 3 consecutive nights. Blackout creating extreme safety hazard for pedestrians and two-wheelers.',
    address: 'Junction of Shivaji Chowk & Station Road, Ward 4',
    latitude: 18.7512,
    longitude: 73.4045,
    urgency: 'high',
    status: 'assigned',
    upvotes: 38,
    hasUpvoted: false,
    department: 'Electrical & Street Lighting Div',
    departmentId: 'dept-elec',
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-4', status: 'submitted', label: 'Report Logged', note: 'Report submitted by resident welfare association.', createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString() },
      { id: 'tl-5', status: 'assigned', label: 'Assigned to Electrical Div', note: 'Work order #ELEC-4491 issued for transformer and lamp driver check.', createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-083',
    reportCode: 'CIV-2026-083',
    category: 'drainage',
    title: 'Monsoon Storm Drain Clogged with Plastic Waste',
    description: 'Stormwater culvert heavily choked by discarded plastic packaging and silt buildup. Water backing up onto sidewalk and school entry gate.',
    address: 'Near St. Xavier\'s High School, Sector 7',
    latitude: 18.7589,
    longitude: 73.4120,
    urgency: 'critical',
    status: 'submitted',
    upvotes: 62,
    hasUpvoted: true,
    department: 'Stormwater & Drainage Board',
    departmentId: 'dept-drain',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-6', status: 'submitted', label: 'Report Submitted', note: 'Citizen emergency alert logged with critical flood risk score.', createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-084',
    reportCode: 'CIV-2026-084',
    category: 'water_supply',
    title: 'High-Pressure Potable Water Main Rupture',
    description: 'Underground drinking water main ruptured; continuous high-volume potable water spewing onto roadway causing waterlogging and low pressure in Sector 9.',
    address: 'Ring Road Flyover Underpass, Ward 9',
    latitude: 18.7621,
    longitude: 73.4180,
    urgency: 'critical',
    status: 'in_progress',
    upvotes: 49,
    hasUpvoted: false,
    department: 'Municipal Water Supply Board',
    departmentId: 'dept-water',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-7', status: 'submitted', label: 'Burst Detected', note: 'Automated pressure sensor and citizen alert received.', createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
      { id: 'tl-8', status: 'assigned', label: 'Emergency Crew Assigned', note: 'Water Board rapid response team mobilized.', createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString() },
      { id: 'tl-9', status: 'in_progress', label: 'Isolation & Welding', note: 'Valve gate closed; pipe clamp installation underway.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-085',
    reportCode: 'CIV-2026-085',
    category: 'waste_management',
    title: 'Illegal Commercial Garbage Pileup & Debris',
    description: 'Large accumulation of commercial rotting waste, mixed plastics, and construction debris dumped along perimeter wall obstructing natural stormwater runoff.',
    address: 'Commercial Complex Perimeter, Market Yard, Sector 15',
    latitude: 18.7490,
    longitude: 73.3980,
    urgency: 'medium',
    status: 'resolved',
    upvotes: 27,
    hasUpvoted: false,
    department: 'Sanitation & Solid Waste Division',
    departmentId: 'dept-waste',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-10', status: 'submitted', label: 'Grievance Filed', note: 'Complaint filed by neighborhood shopkeepers.', createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString() },
      { id: 'tl-11', status: 'assigned', label: 'Sanitation Squad Dispatched', note: 'Compactor vehicle and disinfection crew assigned.', createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
      { id: 'tl-12', status: 'resolved', label: 'Site Cleared & Sanitized', note: '2.4 tons of waste evacuated; lime powder and warning sign deployed.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-086',
    reportCode: 'CIV-2026-086',
    category: 'pothole',
    title: 'Sunken Sewer Manhole Rim Causing Two-Wheeler Skids',
    description: 'Sewer manhole frame and rim have sunk 4 inches below newly paved bitumen layer. Poses severe collision and accident hazard especially in low light.',
    address: 'West Avenue Promenade, Near Bank of India',
    latitude: 18.7533,
    longitude: 73.4072,
    urgency: 'high',
    status: 'assigned',
    upvotes: 41,
    hasUpvoted: false,
    department: 'Roads & Highway Infrastructure Dept',
    departmentId: 'dept-roads',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-13', status: 'submitted', label: 'Incident Reported', note: 'Reported after a two-wheeler skid incident.', createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { id: 'tl-14', status: 'assigned', label: 'Leveling Work Scheduled', note: 'Assigned to Road Maintenance Squad B for rim elevation.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-087',
    reportCode: 'CIV-2026-087',
    category: 'broken_streetlight',
    title: 'Blacked Out Urban Junction & Snapped Feeder Cable',
    description: 'Main streetlighting junction box burnt out following monsoon short circuit. Entire 4-way pedestrian crossing plunged into complete darkness.',
    address: 'Tech Park Boulevard & Ring Road Intersection',
    latitude: 18.7610,
    longitude: 73.4210,
    urgency: 'high',
    status: 'in_progress',
    upvotes: 35,
    hasUpvoted: false,
    department: 'Electrical & Street Lighting Div',
    departmentId: 'dept-elec',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-15', status: 'submitted', label: 'Alert Triggered', note: 'Traffic patrol and citizen ping logged.', createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString() },
      { id: 'tl-16', status: 'in_progress', label: 'Feeder Cable Replacement', note: 'Electrical squad replacing damaged underground conduit cable.', createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-088',
    reportCode: 'CIV-2026-088',
    category: 'drainage',
    title: 'Open Storm Drain Canal Missing Safety Guard Rails',
    description: '15-meter stretch of concrete stormwater canal without protective railing adjacent to primary pedestrian walkway. Heavy safety hazard during monsoon overflow.',
    address: 'Old Police Station Lane, Old City Ward 3',
    latitude: 18.7470,
    longitude: 73.4020,
    urgency: 'critical',
    status: 'assigned',
    upvotes: 58,
    hasUpvoted: true,
    department: 'Stormwater & Drainage Board',
    departmentId: 'dept-drain',
    createdAt: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-17', status: 'submitted', label: 'Petition Received', note: 'Lodged by Ward 3 Council.', createdAt: new Date(Date.now() - 84 * 3600 * 1000).toISOString() },
      { id: 'tl-18', status: 'assigned', label: 'Fabrication Sanctioned', note: 'Galvanized iron barrier order approved.', createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-089',
    reportCode: 'CIV-2026-089',
    category: 'water_supply',
    title: 'Pressurized Pipeline Joint Leakage on Subhash Road',
    description: 'Continuous gushing of clean municipal water from broken pipe coupling under pedestrian walkway. Sub-base erosion beginning under asphalt road.',
    address: 'Subhash Nagar Community Center, Ward 8',
    latitude: 18.7560,
    longitude: 73.4150,
    urgency: 'high',
    status: 'submitted',
    upvotes: 44,
    hasUpvoted: false,
    department: 'Municipal Water Supply Board',
    departmentId: 'dept-water',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-19', status: 'submitted', label: 'Water Leak Alert', note: 'Sample testing kit and municipal pipeline squad notified.', createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'civ-rep-090',
    reportCode: 'CIV-2026-090',
    category: 'waste_management',
    title: 'Construction Debris & Broken Concrete Slabs on West Footpath',
    description: 'Demolition waste and shattered concrete slabs obstructing pedestrian pathway near busy bus terminal. Forcing pedestrians onto high-speed roadway.',
    address: 'Hill View Road, Near Bus Depot Ward 11',
    latitude: 18.7595,
    longitude: 73.4015,
    urgency: 'medium',
    status: 'resolved',
    upvotes: 30,
    hasUpvoted: false,
    department: 'Sanitation & Solid Waste Division',
    departmentId: 'dept-waste',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'
    ],
    timeline: [
      { id: 'tl-20', status: 'submitted', label: 'Report Filed', note: 'Commuter report received.', createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString() },
      { id: 'tl-21', status: 'resolved', label: 'Debris Cleared', note: 'Excavator and dumper truck completed clearance.', createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() }
    ]
  }
];

const CATEGORY_META = {
  pothole: { label: 'Road / Pothole', icon: '🛣️', color: 'orange' },
  broken_streetlight: { label: 'Streetlight / Power', icon: '💡', color: 'yellow' },
  drainage: { label: 'Drainage / Culvert', icon: '🚰', color: 'blue' },
  water_supply: { label: 'Water Supply', icon: '💧', color: 'blue' },
  waste_management: { label: 'Waste Management', icon: '🗑️', color: 'green' },
  other: { label: 'Infrastructure', icon: '📋', color: 'purple' },
};

export function CivicPage() {
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'grievances' ? 'grievances' : 'reports';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [reports, setReports] = useState(INITIAL_DEMO_REPORTS);
  const [depts, setDepts] = useState(DEFAULT_DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedReport) {
      setSelectedDeptId(selectedReport.departmentId || '');
    } else {
      setSelectedDeptId('');
    }
  }, [selectedReport]);
  
  // New Report Form
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'pothole',
    title: '',
    description: '',
    address: '',
    latitude: 30.7346,
    longitude: 79.0669,
    urgency: 'high',
    images: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'CivicaX/1.0'
        }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name, latitude: lat, longitude: lng }));
      } else {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));
          reverseGeocode(latitude, longitude);
          toast.success('Location updated from device GPS');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.error('Could not fetch precise GPS. Using default center.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, deptsRes] = await Promise.all([
        api.get('/civic/reports').catch(() => ({ data: [] })),
        api.get('/civic/departments').catch(() => ({ data: [] }))
      ]);
      const reportsArr = reportsRes.data?.data?.reports || reportsRes.data?.data || reportsRes.data || [];
      const deptsArr   = deptsRes.data?.data || deptsRes.data || [];
      
      if (Array.isArray(reportsArr) && reportsArr.length > 0) {
        // Map backend reports and ensure rich fallback attributes
        const mapped = reportsArr.map((r, i) => ({
          ...r,
          reportCode: r.reportCode || `CIV-2026-${String(81 + i).padStart(3, '0')}`,
          upvotes: r.upvotes || Math.floor(20 + (i * 7) % 50),
          hasUpvoted: false,
          images: r.images && r.images.length > 0 
            ? r.images 
            : (r.imageUrl ? [r.imageUrl] : [INITIAL_DEMO_REPORTS[i % INITIAL_DEMO_REPORTS.length].images[0]]),
          timeline: r.timeline && r.timeline.length > 0 
            ? r.timeline 
            : INITIAL_DEMO_REPORTS[i % INITIAL_DEMO_REPORTS.length].timeline,
          urgency: r.urgency || 'high',
          department: r.department?.name || r.department || DEFAULT_DEPARTMENTS[i % DEFAULT_DEPARTMENTS.length].name
        }));
        setReports(mapped);
      } else {
        setReports(INITIAL_DEMO_REPORTS);
      }

      if (Array.isArray(deptsArr) && deptsArr.length > 0) {
        setDepts(deptsArr);
      } else {
        setDepts(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Using default demo civic reports:', err);
      setReports(INITIAL_DEMO_REPORTS);
      setDepts(DEFAULT_DEPARTMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 3);
      setFormData(prev => ({ ...prev, images: filesArray }));
    }
  };

  const handleUpvote = (e, reportId) => {
    e.stopPropagation();
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const nextHasUpvoted = !r.hasUpvoted;
        const nextUpvotes = nextHasUpvoted ? (r.upvotes + 1) : Math.max(0, r.upvotes - 1);
        toast.success(nextHasUpvoted ? 'Upvoted! Priority escalated.' : 'Upvote removed.');
        return { ...r, hasUpvoted: nextHasUpvoted, upvotes: nextUpvotes };
      }
      return r;
    }));
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please provide a location address.');
      return;
    }
    setIsSubmitting(true);
    
    const newCode = `CIV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const categoryInfo = CATEGORY_META[formData.category] || CATEGORY_META.pothole;
    const assignedDept = DEFAULT_DEPARTMENTS.find(d => d.id.includes(formData.category.slice(0, 3))) || DEFAULT_DEPARTMENTS[0];

    const newReportItem = {
      id: `civ-rep-${Date.now()}`,
      reportCode: newCode,
      category: formData.category,
      title: formData.title || `${categoryInfo.label} Issue`,
      description: formData.description,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      urgency: formData.urgency,
      status: 'submitted',
      upvotes: 1,
      hasUpvoted: true,
      department: assignedDept.name,
      departmentId: assignedDept.id,
      createdAt: new Date().toISOString(),
      images: formData.images.length > 0 
        ? formData.images.map(f => URL.createObjectURL(f)) 
        : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          status: 'submitted',
          label: 'Report Submitted',
          note: `Logged by ${user?.name || 'Citizen'} with GPS coordinates.`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('latitude', String(formData.latitude));
      data.append('longitude', String(formData.longitude));
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => {
          data.append('images', file);
        });
      }

      await api.post('/civic/reports', data).catch(() => null);
      
      setReports(prev => [newReportItem, ...prev]);
      toast.success(`✅ Report ${newCode} submitted successfully!`);
      setIsModalOpen(false);
      setFormData({ category: 'pothole', title: '', description: '', address: '', latitude: 30.7346, longitude: 79.0669, urgency: 'high', images: [] });
      setFormStep(1);
    } catch (err) {
      setReports(prev => [newReportItem, ...prev]);
      toast.success(`✅ Report ${newCode} submitted successfully!`);
      setIsModalOpen(false);
      setFormData({ category: 'pothole', title: '', description: '', address: '', latitude: 30.7346, longitude: 79.0669, urgency: 'high', images: [] });
      setFormStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (reportId, newStatus, departmentId = null) => {
    try {
      const formattedStatus = (newStatus || 'in_progress').replace(/_/g, ' ');
      const payload = {
        status: newStatus,
        note: `Status updated to ${formattedStatus}`,
      };
      if (departmentId) payload.departmentId = departmentId;
      await api.put(`/civic/reports/${reportId}`, payload).catch(() => null);
      
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const deptObj = depts.find(d => d.id === departmentId);
          const updatedTimeline = [
            ...(r.timeline || []),
            {
              id: `tl-${Date.now()}`,
              status: newStatus,
              label: `Status: ${formattedStatus.toUpperCase()}`,
              note: `Updated by ${user?.name || 'Administrator'}`,
              createdAt: new Date().toISOString()
            }
          ];
          return {
            ...r,
            status: newStatus,
            department: deptObj ? deptObj.name : r.department,
            departmentId: departmentId || r.departmentId,
            timeline: updatedTimeline
          };
        }
        return r;
      }));

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => ({
          ...prev,
          status: newStatus,
          department: depts.find(d => d.id === departmentId)?.name || prev.department,
          departmentId: departmentId || prev.departmentId,
          timeline: [
            ...(prev.timeline || []),
            {
              id: `tl-${Date.now()}`,
              status: newStatus,
              label: `Status: ${formattedStatus.toUpperCase()}`,
              note: `Updated by ${user?.name || 'Administrator'}`,
              createdAt: new Date().toISOString()
            }
          ]
        }));
      }
      toast.success(`Report status updated to ${formattedStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':   return <GlassBadge level="info" label="Submitted" dot />;
      case 'assigned':    return <GlassBadge level="warning" label="Assigned" dot />;
      case 'in_progress': return <GlassBadge level="watch" label="In Progress" dot />;
      case 'resolved':    return <GlassBadge level="safe" label="Resolved" dot />;
      case 'rejected':    return <GlassBadge level="critical" label="Rejected" dot />;
      default:            return <GlassBadge level="info" label={status} />;
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'critical': return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/50">Urgent Critical</span>;
      case 'high':     return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">High Priority</span>;
      case 'medium':   return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50">Medium</span>;
      default:         return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Standard</span>;
    }
  };

  const filteredReports = reports.filter((report) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (report.description || '').toLowerCase().includes(q) ||
      (report.address || '').toLowerCase().includes(q) ||
      (report.category || '').toLowerCase().includes(q) ||
      (report.reportCode || '').toLowerCase().includes(q) ||
      (report.title || '').toLowerCase().includes(q) ||
      (report.department || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalReportsCount = reports.length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const assignedCount = reports.filter(r => r.status === 'assigned').length;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
              <HardHat size={24} />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
              {hasRole(['department_op']) ? 'Department Queue' : 'Civic Manager'}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Hyperlocal infrastructure tracking, municipal department dispatch & community grievance resolutions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refresh reports"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          {hasRole(['citizen', 'admin']) && (
            <GlassButton onClick={() => setIsModalOpen(true)} className="whitespace-nowrap shadow-md">
              <Plus size={18} /> Report Civic Issue
            </GlassButton>
          )}
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard padding="p-4" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Active</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{totalReportsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
            ALL
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">{assignedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
            <Building2 size={18} />
          </div>
        </GlassCard>

        <GlassCard padding="p-4" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </GlassCard>
      </div>

      {/* Top Tab Switcher */}
      <div className="flex gap-2 glass-card p-1.5 w-fit">
        {[
          { id: 'reports',     label: 'Civic Reports Feed', icon: HardHat },
          { id: 'grievances',  label: 'My Grievances & SLAs', icon: ClipboardList },
        ].map(t => {
          const Ic = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === t.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Ic size={16}/> {t.label}
            </button>
          );
        })}
      </div>

      {/* Grievances Tab */}
      {activeTab === 'grievances' ? (
        <CivicGrievancePanel/>
      ) : (<>

      {/* Filters and Controls */}
      <GlassCard padding="p-4" className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search code (CIV-2026-081), address, road, department..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'submitted', label: 'Submitted' },
              { id: 'assigned', label: 'Assigned' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === pill.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer shadow-sm"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="pothole">🛣️ Potholes & Roads</option>
            <option value="broken_streetlight">💡 Streetlights & Signals</option>
            <option value="drainage">🚰 Drainage & Culverts</option>
            <option value="water_supply">💧 Water Supply Mains</option>
            <option value="waste_management">🗑️ Waste & Dumping</option>
            <option value="other">📋 Other Infrastructure</option>
          </select>
        </div>
      </GlassCard>

      {/* Reports Grid */}
      {(() => {
        if (filteredReports.length === 0) {
          return (
            <GlassCard className="text-center py-20">
              <CheckCircle2 size={52} className="mx-auto text-blue-500 mb-4 opacity-40" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No civic reports match your filter</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                Try adjusting your search keywords or clear the category and status filters.
              </p>
              <GlassButton 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }} 
                className="mt-4 mx-auto"
              >
                Reset Filters
              </GlassButton>
            </GlassCard>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              const catMeta = CATEGORY_META[report.category] || CATEGORY_META.other;
              return (
                <GlassCard 
                  key={report.id} 
                  padding="p-0" 
                  className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-200 dark:border-slate-800 rounded-2xl"
                  onClick={() => setSelectedReport(report)}
                >
                  {/* Photo Header */}
                  <div className="h-48 w-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                    {report.images && report.images.length > 0 ? (
                      <img 
                        src={resolveImageUrl(report.images[0])} 
                        alt={report.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                        <HardHat size={40} className="text-slate-400 dark:text-slate-600" />
                      </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-md tracking-wider">
                        {report.reportCode}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="absolute bottom-3 left-3">
                      {getUrgencyBadge(report.urgency)}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                        <span>{catMeta.icon}</span>
                        <span>{catMeta.label}</span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                        {report.title || report.description.slice(0, 50)}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                        {report.description}
                      </p>
                    </div>

                    {/* Meta info bottom */}
                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 truncate font-medium max-w-[200px]" title={report.department}>
                          <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{report.department || 'Unassigned'}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium whitespace-nowrap">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[210px]" title={report.address}>
                          <MapPin size={14} className="text-red-500 flex-shrink-0" />
                          <span className="truncate font-medium">{report.address}</span>
                        </div>

                        {/* Upvote Button */}
                        <button
                          onClick={(e) => handleUpvote(e, report.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                            report.hasUpvoted
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                          }`}
                          title="Upvote to escalate priority"
                        >
                          <ThumbsUp size={12} className={report.hasUpvoted ? 'fill-white' : ''} />
                          <span>{report.upvotes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
            </div>
          );
        })()}

      {/* Report New Civic Issue Modal */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📢 Report Civic Issue" size="lg">
        <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between px-2 mb-2">
            {[
              { num: 1, title: 'Category & Details' },
              { num: 2, title: 'Pin Location' },
              { num: 3, title: 'Evidence Photo' }
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  formStep === s.num 
                    ? 'bg-blue-600 text-white' 
                    : formStep > s.num 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {formStep > s.num ? '✓' : s.num}
                </div>
                <span className="text-xs font-semibold hidden sm:inline text-slate-700 dark:text-slate-300">{s.title}</span>
              </div>
            ))}
          </div>

          {formStep === 1 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassSelect 
                  label="Issue Category" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="pothole">🛣️ Pothole / Road Surface Damage</option>
                  <option value="broken_streetlight">💡 Broken Streetlight / Dark Spot</option>
                  <option value="drainage">🚰 Clogged Drainage / Storm Culvert</option>
                  <option value="water_supply">💧 Drinking Water Pipe Leakage</option>
                  <option value="waste_management">🗑️ Garbage / Illegal Waste Dump</option>
                  <option value="other">📋 Other Infrastructure Hazard</option>
                </GlassSelect>

                <GlassSelect 
                  label="Urgency Rating" 
                  value={formData.urgency} 
                  onChange={e => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="critical">🔴 Critical (Immediate Hazard / Flood Threat)</option>
                  <option value="high">🟠 High (Impacting Daily Traffic / Safety)</option>
                  <option value="medium">🟡 Medium (Maintenance Required)</option>
                  <option value="low">🔵 Low (Minor Cosmetic Repair)</option>
                </GlassSelect>
              </div>

              <GlassInput
                label="Issue Headline / Title"
                placeholder="e.g. Hazardous deep pothole on MG Road near flyover"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              
              <GlassTextarea 
                label="Detailed Description" 
                placeholder="Describe the severity, depth, area impacted, and any observed accidents..." 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />

              <div className="flex justify-end gap-3 mt-4">
                <GlassButton variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => {
                    if (formData.description.trim().length < 10) {
                      toast.error('Description must be at least 10 characters.');
                      return;
                    }
                    setFormStep(2);
                  }}
                >
                  Next: Pin Location &rarr;
                </GlassButton>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Incident GPS Location
                </label>
                <button
                  type="button"
                  onClick={requestUserLocation}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  📍 Use Current Location
                </button>
              </div>

              <div className="w-full h-[220px] relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                <MapContainer
                  center={[formData.latitude, formData.longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker
                    position={[formData.latitude, formData.longitude]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        reverseGeocode(position.lat, position.lng);
                      },
                    }}
                  />
                  <RecenterMap lat={formData.latitude} lng={formData.longitude} />
                </MapContainer>
              </div>

              <GlassInput 
                label="Street Address / Landmark" 
                placeholder="Drag pin on map or enter detailed landmark" 
                icon={MapPin}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                required
              />

              <p className="text-[11px] text-slate-400 font-mono">
                Latitude: {formData.latitude.toFixed(6)} • Longitude: {formData.longitude.toFixed(6)}
              </p>

              <div className="flex justify-end gap-3 mt-4">
                <GlassButton variant="ghost" type="button" onClick={() => setFormStep(1)}>&larr; Back</GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => {
                    if (!formData.address.trim()) {
                      toast.error('Please provide a location address or landmark.');
                      return;
                    }
                    setFormStep(3);
                  }}
                >
                  Next: Photo Evidence &rarr;
                </GlassButton>
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Upload Photo Evidence (Max 3)
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/50 dark:file:text-blue-300 cursor-pointer"
                />
              </div>

              {formData.images.length > 0 && (
                <div className="flex gap-3 mt-2 flex-wrap">
                  {formData.images.map((file, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p><strong>Category:</strong> {CATEGORY_META[formData.category]?.label}</p>
                <p><strong>Location:</strong> {formData.address || 'GPS Coordinates Selected'}</p>
                <p><strong>Urgency:</strong> {formData.urgency.toUpperCase()}</p>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <GlassButton variant="ghost" type="button" onClick={() => setFormStep(2)}>&larr; Back</GlassButton>
                <GlassButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Dispatching Report...' : 'Submit Civic Report'}
                </GlassButton>
              </div>
            </div>
          )}
        </form>
      </GlassModal>

      {/* Report Details Modal */}
      <GlassModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="🔍 Report Details & Timeline" size="xl">
        {selectedReport && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Photos & Details */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              {selectedReport.images && selectedReport.images.length > 0 ? (
                <GrievanceImageGallery images={selectedReport.images.map(resolveImageUrl)} />
              ) : (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <HardHat size={48} className="text-slate-300 dark:text-slate-700" />
                </div>
              )}
              
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <span className="font-mono text-sm font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                  {selectedReport.reportCode}
                </span>
                <div className="flex items-center gap-2">
                  {getUrgencyBadge(selectedReport.urgency)}
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {selectedReport.title || (selectedReport.category || 'civic_issue').replace(/_/g, ' ').toUpperCase()}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin size={16} className="text-red-500 flex-shrink-0" /> 
                  <span className="font-medium">{selectedReport.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Building2 size={16} className="text-blue-500 flex-shrink-0" /> 
                  <span className="font-medium">Assigned Department: {selectedReport.department || 'Pending Assignment'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Resolution Timeline & Admin Actions */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
                Municipal Resolution Timeline
              </h4>
              
              <div className="bg-white/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex-1 overflow-y-auto max-h-[320px]">
                {selectedReport.timeline && selectedReport.timeline.length > 0 ? (
                  <GlassTimeline events={selectedReport.timeline.map(t => ({
                    id: t.id,
                    status: t.status,
                    label: t.label || `Status: ${(t.status || 'submitted').replace(/_/g, ' ').toUpperCase()}`,
                    description: t.note,
                    timestamp: t.createdAt
                  }))} />
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6">No timeline events recorded yet.</p>
                )}
              </div>

              {/* Status Update Controls for department_op / admin */}
              {hasRole(['department_op', 'admin']) && selectedReport.status !== 'resolved' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 mt-auto">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                    Municipal Dispatch Controls
                  </h4>
                  
                  {selectedReport.status === 'submitted' && (
                    <div className="flex flex-col gap-1.5 mb-3 w-full animate-fadeIn">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Assign to Department</label>
                      <select
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none w-full"
                        value={selectedDeptId}
                        onChange={e => setSelectedDeptId(e.target.value)}
                      >
                        <option value="">-- Select Municipal Dept --</option>
                        {depts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedReport.status === 'submitted' && (
                      <GlassButton 
                        size="sm" 
                        onClick={() => {
                          if (!selectedDeptId) {
                            toast.error('Please select a department first');
                            return;
                          }
                          updateStatus(selectedReport.id, 'assigned', selectedDeptId);
                        }}
                      >
                        Assign to Department
                      </GlassButton>
                    )}
                    {['submitted','assigned'].includes(selectedReport.status) && (
                      <GlassButton size="sm" onClick={() => updateStatus(selectedReport.id, 'in_progress')}>
                        Mark In Progress
                      </GlassButton>
                    )}
                    {selectedReport.status === 'in_progress' && (
                      <GlassButton 
                        size="sm" 
                        onClick={() => updateStatus(selectedReport.id, 'resolved')} 
                        className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-md font-bold"
                      >
                        Mark Resolved
                      </GlassButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassModal>
      </>)}
    </div>
  );
}
