import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ResponsiveSlider from '@/components/ui/ResponsiveSlider';

const HtmlLoginPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('marathi');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  // Check if user is already authenticated and redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      let redirectPath = '/saral/dashboard';
      if (user.role === 'field_officer') {
        redirectPath = '/field-officer';
      } else if (user.role === 'officer') {
        redirectPath = '/officer-dashboard';
      }
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        // The useEffect above will handle the redirect
        setShowModal(false);
        setEmail('');
        setPassword('');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal when clicking outside
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setError('');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-white font-display">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center text-lg font-bold text-text-dark-blue">
            <img 
              src="/emblem-of-india.png" 
              alt="Government of India Emblem" 
              className="h-10 w-auto md:h-12 mr-3 object-contain shrink-0" 
            />
            Palghar Collector Office
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-text-dark-blue">
            <a className="hover:text-primary" href="#">Why</a>
            <a className="hover:text-primary" href="#">How It Works</a>
            <a className="hover:text-primary" href="#">Live Stats</a>
            <a className="hover:text-primary" href="#">Stakeholders</a>
          </nav>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-blue-700 transition inline-flex items-center"
          >
            <span className="material-icons text-base mr-1">login</span>
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-bg relative py-32 md:py-48">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            eSULABH – Blockchain-based Land Acquisition Records Portal
          </h1>
          <p className="text-lg text-white font-medium mb-4">
            eSULABH: SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN
          </p>
          <p className="text-base text-white opacity-90 mb-8">
            Transparent. Secure. Citizen-Centric.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded font-semibold text-lg hover:bg-blue-700 transition inline-flex items-center"
          >
            <span className="material-icons text-xl mr-2">arrow_right_alt</span>
            Login
          </button>
        </div>
      </main>

      {/* Feature Slider Section */}
      <ResponsiveSlider />

      {/* Why Saral Bhoomi Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Why eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="flex items-center mb-3">
                <span className="material-icons text-primary text-3xl mr-3">check_circle</span>
                <h3 className="text-xl font-bold text-text-dark-blue">Immutable &amp; Secure</h3>
              </div>
              <p className="text-subtext-light">Blockchain-based, tamper-proof records.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="flex items-center mb-3">
                <span className="material-icons text-primary text-3xl mr-3">insights</span>
                <h3 className="text-xl font-bold text-text-dark-blue">Real-Time Updates</h3>
              </div>
              <p className="text-subtext-light">Records updated instantly.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="flex items-center mb-3">
                <span className="material-icons text-primary text-3xl mr-3">visibility</span>
                <h3 className="text-xl font-bold text-text-dark-blue">Transparent Records</h3>
              </div>
              <p className="text-subtext-light">Orders and compensation in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-background-blue-light">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="step-number mr-4">1</div>
              <div>
                <h3 className="text-lg font-bold text-text-dark-blue mb-1">Automated Notice Generation</h3>
                <p className="text-subtext-light">System issues notices based on case triggers and schedules.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="step-number mr-4">2</div>
              <div>
                <h3 className="text-lg font-bold text-text-dark-blue mb-1">Record Authentication</h3>
                <p className="text-subtext-light">Documents hashed on-chain ensuring provenance and integrity.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="step-number mr-4">3</div>
              <div>
                <h3 className="text-lg font-bold text-text-dark-blue mb-1">Review &amp; Approval</h3>
                <p className="text-subtext-light">Multi-level workflow for officers with clear status updates.</p>
              </div>
            </div>

            <div className="flex items-start bg-white p-5 rounded-lg shadow-md border border-gray-100">
              <div className="step-number mr-4">4</div>
              <div>
                <h3 className="text-lg font-bold text-text-dark-blue mb-1">Audit &amp; History</h3>
                <p className="text-subtext-light">Immutable audit trail and complete case history for transparency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Snapshot */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Live Dashboard Snapshot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-lg shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-dark-blue">Total Land Loaded (Ha)</div>
                <span className="material-icons text-primary">map</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-primary">1,245</div>
            </div>

            <div className="p-5 rounded-lg shadow-sm border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-dark-blue">Notices Generated</div>
                <span className="material-icons text-indigo-600">receipt_long</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-indigo-600">2,560</div>
            </div>

            <div className="p-5 rounded-lg shadow-sm border border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-dark-blue">Budget Spent To-Date</div>
                <span className="material-icons text-teal-600">account_balance_wallet</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-teal-600">₹4.2 Cr</div>
            </div>

            <div className="p-5 rounded-lg shadow-sm border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-dark-blue">Payments Completed</div>
                <span className="material-icons text-emerald-600">task_alt</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">1,130</div>
            </div>

            <div className="p-5 rounded-lg shadow-sm border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-text-dark-blue">Total Acquired Area (Ha)</div>
                <span className="material-icons text-orange-600">terrain</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-orange-600">420</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-text-dark-blue mb-12">Stakeholders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center flex flex-col items-center">
              <span className="material-icons text-primary text-4xl mb-3">person</span>
              <h3 className="text-xl font-bold text-text-dark-blue mb-1">Citizen</h3>
              <p className="text-subtext-light text-center">Access land records and notices.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center flex flex-col items-center">
              <span className="material-icons text-primary text-4xl mb-3">work</span>
              <h3 className="text-xl font-bold text-text-dark-blue mb-1">Field Officer</h3>
              <p className="text-subtext-light text-center">Manage and update land records.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center flex flex-col items-center">
              <span className="material-icons text-primary text-4xl mb-3">security</span>
              <h3 className="text-xl font-bold text-text-dark-blue mb-1">Administrator</h3>
              <p className="text-subtext-light text-center">Oversight &amp; audit control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-8 flex flex-wrap justify-between items-start text-text-dark-blue">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <div className="flex items-center mb-2">
              <img 
                src="/emblem-of-india.png" 
                alt="Government of India Emblem" 
                className="h-10 w-auto md:h-12 mr-3 object-contain shrink-0" 
              />
              <div>
                <p className="font-bold text-lg">Palghar Collector Office</p>
                <p className="text-sm text-subtext-light">eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN – Official Portal</p>
              </div>
            </div>
            <p className="text-xs text-subtext-light mt-4">Palghar, Maharashtra 401404</p>
          </div>

          <div className="w-full md:w-1/3 mb-6 md:mb-0 text-center">
            <p className="text-xs text-subtext-light mt-4">Last updated: 28 Sep 2025</p>
          </div>

          <div className="w-full md:w-1/3 text-right">
            <h3 className="font-bold mb-2">Quick Links</h3>
            <div className="flex flex-col space-y-1 text-sm">
              <a href="#" className="text-subtext-light hover:text-primary">Home</a>
              <a href="#" className="text-subtext-light hover:text-primary">About</a>
              <a href="#" className="text-subtext-light hover:text-primary">FAQ</a>
            </div>
            <p className="text-xs text-subtext-light mt-4">Powered by Arixolve</p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleModalClick}
        >
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-dark-blue">Login to eSULABH-SYSTEM FOR UNIFIED LAND ACQUISITION through BLOCKCHAIN</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="marathi">मराठी</option>
                  <option value="english">English</option>
                  <option value="hindi">हिन्दी</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition font-medium disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@saral.gov.in / admin</p>
                <p><strong>Officer:</strong> officer@saral.gov.in / officer</p>
                <p><strong>Field Officer:</strong> agent@saral.gov.in / field123</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        .hero-bg {
          background-image: url('/collector-office.jpeg');
          background-size: cover;
          background-position: center;
        }
        .step-number {
          background-color: #FBBF24;
          color: #1F2937;
          font-weight: 600;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default HtmlLoginPage;