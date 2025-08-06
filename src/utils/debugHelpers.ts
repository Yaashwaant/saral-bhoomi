// Debug helpers for troubleshooting agent assignments

export const debugHelpers = {
  // Log current user info
  logCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    console.log('🔍 Current User Debug Info:');
    console.log('User:', user ? JSON.parse(user) : 'Not logged in');
    console.log('Token:', token ? 'Present' : 'Missing');
  },

  // Check if user is an agent
  isCurrentUserAgent: () => {
    const user = localStorage.getItem('user');
    if (!user) return false;
    const userData = JSON.parse(user);
    const isAgent = userData.role === 'agent';
    console.log('🔍 Is current user an agent?', isAgent);
    return isAgent;
  },

  // Get agent ID
  getCurrentAgentId: () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    const agentId = userData.role === 'agent' ? userData.id : null;
    console.log('🔍 Current agent ID:', agentId);
    return agentId;
  },

  // Test API connectivity
  testApiConnection: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/agents/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ API Connection successful');
        console.log('📊 Assigned records:', data);
        return true;
      } else {
        console.error('❌ API Error:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      return false;
    }
  },

  // Test assignment workflow
  testAssignmentWorkflow: async (landownerId: string, agentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      return false;
    }

    console.log('🧪 Testing assignment workflow...');
    console.log('📋 Input:', { landownerId, agentId });

    try {
      const response = await fetch('http://localhost:5000/api/agents/assign', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          landownerId,
          agentId,
          noticeData: {
            noticeNumber: 'TEST-NOTICE-123',
            noticeDate: new Date(),
            noticeContent: 'Test notice content'
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Assignment successful');
        console.log('📊 Result:', data);
        return true;
      } else {
        console.error('❌ Assignment failed:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Assignment error:', error);
      return false;
    }
  },

  // Clear all data and start fresh
  resetDebugState: () => {
    console.log('🔄 Clearing debug state...');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    console.log('✅ Debug state cleared. Please login again.');
  },

  // Get debugging info summary
  getDebugSummary: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    const summary = {
      isLoggedIn: !!user,
      userRole: user ? JSON.parse(user).role : null,
      userName: user ? JSON.parse(user).name : null,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    };

    console.log('📋 Debug Summary:', summary);
    return summary;
  }
};

// Add debug helpers to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAgent = debugHelpers;
  console.log('🔧 Debug helpers available as window.debugAgent');
  console.log('🔧 Available methods:');
  console.log('  - debugAgent.logCurrentUser()');
  console.log('  - debugAgent.testApiConnection()');
  console.log('  - debugAgent.getDebugSummary()');
}

export default debugHelpers;