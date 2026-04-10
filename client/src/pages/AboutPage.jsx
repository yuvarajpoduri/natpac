import { BookOpen, Cpu, Database, Globe, Shield, Users, Layers, Smartphone } from 'lucide-react';

const aboutSections = [
  {
    icon: Globe,
    title: 'What is Routelytics?',
    description: 'A smart travel intelligence platform built for the National Transportation Planning and Research Centre (NATPAC), Kerala. It replaces traditional paper surveys with automated, AI-powered trip detection and classification across the state.',
    accent: 'yellow'
  },
  {
    icon: Smartphone,
    title: 'How Trips Are Captured',
    description: 'Citizens install the companion mobile app which silently tracks GPS coordinates in the background. When the phone detects the user has been stationary for over 5 minutes, a trip is automatically registered and sent to the backend server. For web-based testing, a Trip Simulator generates realistic Kerala transit data.',
    accent: 'blue'
  },
  {
    icon: Cpu,
    title: 'AI Mode Prediction',
    description: 'Each completed trip is forwarded to a Python-based AI microservice running a trained Random Forest machine learning model. The model analyzes the average speed, maximum speed, and duration to predict the travel mode — such as Bus, Car, Walking, Auto-Rickshaw, or Train.',
    accent: 'yellow'
  },
  {
    icon: Users,
    title: 'Human Validation Loop',
    description: 'AI predictions are not always 100% correct. Citizens review their trips in the Travel Diary, see the AI\'s guess on an interactive map, and can correct it with their actual mode and purpose. This human-validated data is significantly more accurate for research.',
    accent: 'blue'
  },
  {
    icon: Database,
    title: 'Real-Time Analytics',
    description: 'NATPAC Scientists access a live dashboard powered by MongoDB aggregation pipelines. It calculates AI accuracy rates, mode distribution, hourly travel patterns, daily trends, and trip purpose breakdowns — all in real time from actual database records.',
    accent: 'yellow'
  },
  {
    icon: Shield,
    title: 'Data Privacy & Anonymization',
    description: 'All exported research data is automatically anonymized. User names and emails are stripped. IDs are hashed. GPS coordinates are truncated to 3 decimal places (~111m precision), protecting residential privacy while maintaining research-grade accuracy.',
    accent: 'blue'
  }
];



const AboutPage = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">About Routelytics</h1>
          <p className="page-subtitle">Travel Intelligence Platform — Technical Overview</p>
        </div>
      </div>

      <div className="stack" style={{ marginBottom: '1.5rem' }}>
        {aboutSections.map(({ icon: Icon, title, description, accent }) => (
          <div className="card" key={title}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: accent === 'blue' ? 'rgba(91, 202, 245, 0.10)' : 'rgba(245, 242, 48, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={20} style={{ color: '#111111' }} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>{title}</div>
                <div style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.65 }}>{description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
