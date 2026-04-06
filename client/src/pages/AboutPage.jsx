import { BookOpen, Cpu, Database, Globe, Shield, Users, Layers, Smartphone } from 'lucide-react';

const aboutSections = [
  {
    icon: Globe,
    title: 'What is NATPAC Travel?',
    description: 'A digital travel data collection platform built for the National Transportation Planning and Research Centre (NATPAC), Kerala. It replaces traditional paper surveys with automated, AI-powered trip detection and classification across the state.'
  },
  {
    icon: Smartphone,
    title: 'How Trips Are Captured',
    description: 'Citizens install the companion mobile app which silently tracks GPS coordinates in the background. When the phone detects the user has been stationary for over 5 minutes, a trip is automatically registered and sent to the backend server. For web-based testing, a Trip Simulator generates realistic Kerala transit data.'
  },
  {
    icon: Cpu,
    title: 'AI Mode Prediction',
    description: 'Each completed trip is forwarded to a Python-based AI microservice running a trained Random Forest machine learning model. The model analyzes the average speed, maximum speed, and duration to predict the travel mode — such as Bus, Car, Walking, Auto-Rickshaw, or Train.'
  },
  {
    icon: Users,
    title: 'Human Validation Loop',
    description: 'AI predictions are not always 100% correct. Citizens review their trips in the Travel Diary, see the AI\'s guess on an interactive map, and can correct it with their actual mode and purpose. This human-validated data is significantly more accurate for research.'
  },
  {
    icon: Database,
    title: 'Real-Time Analytics',
    description: 'NATPAC Scientists access a live dashboard powered by MongoDB aggregation pipelines. It calculates AI accuracy rates, mode distribution, hourly travel patterns, daily trends, and trip purpose breakdowns — all in real time from actual database records.'
  },
  {
    icon: Shield,
    title: 'Data Privacy & Anonymization',
    description: 'All exported research data is automatically anonymized. User names and emails are stripped. IDs are hashed. GPS coordinates are truncated to 3 decimal places (~111m precision), protecting residential privacy while maintaining research-grade accuracy.'
  }
];

const techStack = [
  { layer: 'Frontend', tools: 'React.js, Vite, React Router, Leaflet Maps, Lucide Icons' },
  { layer: 'Backend API', tools: 'Node.js, Express.js, JWT Authentication, BCrypt' },
  { layer: 'Database', tools: 'MongoDB, Mongoose ODM' },
  { layer: 'AI Service', tools: 'Python, Flask, scikit-learn (Random Forest), NumPy, Pandas' },
  { layer: 'Maps', tools: 'React-Leaflet, CARTO Dark Tiles' },
  { layer: 'Deployment', tools: 'Render (Backend), Vercel (Frontend), MongoDB Atlas' }
];

const AboutPage = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">About This Project</h1>
          <p className="page-subtitle">NATPAC Travel Data Collection System — Technical Overview</p>
        </div>
      </div>

      <div className="stack" style={{ marginBottom: '1.5rem' }}>
        {aboutSections.map(({ icon: Icon, title, description }) => (
          <div className="card" key={title}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>{title}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-label" style={{ marginBottom: '1.25rem' }}>
          <Layers size={13} /> Technology Stack
        </div>
        <div className="stack">
          {techStack.map(({ layer, tools }) => (
            <div key={layer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{layer}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{tools}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-label" style={{ marginBottom: '1rem' }}>
          <BookOpen size={13} /> Development Timeline
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.625rem' }}>
          {[
            { week: 'Week 1-2', task: 'Project Setup, Authentication, AI Model Training' },
            { week: 'Week 3-4', task: 'Trip Schema, Travel Diary, Trip Simulator' },
            { week: 'Week 5-6', task: 'Maps Integration, Trip Validation UI' },
            { week: 'Week 7-8', task: 'Advanced Analytics, Data Export, Anonymization' },
            { week: 'Week 9-10', task: 'System Monitor, User Management, Profile' },
            { week: 'Week 11', task: 'Documentation, Error Handling, Final Polish' }
          ].map(({ week, task }) => (
            <div key={week} style={{ padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--brand)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 600, marginBottom: '0.25rem' }}>{week}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{task}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
