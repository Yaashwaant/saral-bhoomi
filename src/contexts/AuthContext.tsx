import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'officer' | 'field_officer' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  language: 'marathi' | 'english' | 'hindi';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  switchLanguage: (language: 'marathi' | 'english' | 'hindi') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo users for the system
const demoUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@saral.gov.in',
    role: 'admin',
    department: 'Land Acquisition Department',
    phone: '+91-9876543210',
    language: 'marathi'
  },
  {
    id: '2', 
    name: 'Land Officer',
    email: 'officer@saral.gov.in',
    role: 'officer',
    department: 'District Office',
    phone: '+91-9876543211',
    language: 'marathi'
  },
  {
    id: '3',
    name: 'Field Agent',
    email: 'agent@saral.gov.in', 
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543212',
    language: 'marathi'
  },
  // Additional field agents for testing
  {
    id: '4',
    name: 'राजेश पाटील',
    email: 'rajesh.patil@saral.gov.in',
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543210',
    language: 'marathi'
  },
  {
    id: '5',
    name: 'सुनील कांबळे',
    email: 'sunil.kambale@saral.gov.in',
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543211',
    language: 'marathi'
  },
  {
    id: '6',
    name: 'महेश देशमुख',
    email: 'mahesh.deshmukh@saral.gov.in',
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543212',
    language: 'marathi'
  },
  {
    id: '7',
    name: 'विठ्ठल जाधव',
    email: 'vithal.jadhav@saral.gov.in',
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543213',
    language: 'marathi'
  },
  {
    id: '8',
    name: 'रामराव पवार',
    email: 'ramrao.pawar@saral.gov.in',
    role: 'agent',
    department: 'Field Operations',
    phone: '+91-9876543214',
    language: 'marathi'
  },
  // Field Officer users for testing
  {
    id: '9',
    name: 'Rajesh Patil - Field Officer',
    email: 'field.officer@saralbhoomi.gov.in',
    role: 'field_officer',
    department: 'Field Operations Department',
    phone: '+91-9876543216',
    language: 'marathi'
  },
  {
    id: '10',
    name: 'Mahesh Kamble - Field Officer',
    email: 'field.officer2@saralbhoomi.gov.in',
    role: 'field_officer',
    department: 'Field Operations Department',
    phone: '+91-9876543217',
    language: 'marathi'
  },
  {
    id: '11',
    name: 'Priya Sharma - Field Officer',
    email: 'field.officer3@saralbhoomi.gov.in',
    role: 'field_officer',
    department: 'Field Operations Department',
    phone: '+91-9876543218',
    language: 'marathi'
  }
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Connect to backend API
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.accessToken) {
          // Store the JWT token
          localStorage.setItem('authToken', data.accessToken);
          
          // Decode user info from token or use the user data from response
          const userData = {
            id: data.user?.id || 'demo-id',
            name: data.user?.name || 'Demo User',
            email: data.user?.email || email,
            role: data.user?.role || 'officer',
            department: data.user?.department || 'Demo Department',
            phone: data.user?.phone || '+91-0000000000',
            language: 'marathi' as const
          };
          
          setUser(userData);
          localStorage.setItem('saral_user', JSON.stringify(userData));
          return true;
        }
      }
      
      // Fallback to demo users if API fails
      const foundUser = demoUsers.find(u => u.email === email);
      if (foundUser && (password === 'admin' || password === 'officer' || password === 'agent' || password === 'agent123' || password === 'field123')) {
        setUser(foundUser);
        localStorage.setItem('saral_user', JSON.stringify(foundUser));
        localStorage.setItem('authToken', 'demo-jwt-token');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to demo users if API fails
      const foundUser = demoUsers.find(u => u.email === email);
      if (foundUser && (password === 'admin' || password === 'officer' || password === 'agent' || password === 'agent123' || password === 'field123')) {
        setUser(foundUser);
        localStorage.setItem('saral_user', JSON.stringify(foundUser));
        localStorage.setItem('authToken', 'demo-jwt-token');
        return true;
      }
      
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saral_user');
    localStorage.removeItem('authToken'); // Remove token on logout
  };

  const switchLanguage = (language: 'marathi' | 'english' | 'hindi') => {
    if (user) {
      const updatedUser = { ...user, language };
      setUser(updatedUser);
      localStorage.setItem('saral_user', JSON.stringify(updatedUser));
    }
  };

  // Initialize user from localStorage on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('saral_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      switchLanguage
    }}>
      {children}
    </AuthContext.Provider>
  );
};