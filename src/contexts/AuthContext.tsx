import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'officer' | 'agent';

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
  }
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login logic - replace with actual API call
    const foundUser = demoUsers.find(u => u.email === email);
    
    if (foundUser && (password === 'admin' || password === 'officer' || password === 'agent' || password === 'agent123')) {
      setUser(foundUser);
      localStorage.setItem('saral_user', JSON.stringify(foundUser));
      // Set a fake JWT token for demo purposes
      localStorage.setItem('authToken', 'demo-jwt-token');
      return true;
    }
    
    return false;
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