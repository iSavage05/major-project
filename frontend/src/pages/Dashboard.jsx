import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, authAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import { 
  LayoutDashboard, 
  Plus, 
  FolderOpen, 
  Package, 
  Users, 
  LogOut,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, userRes] = await Promise.all([
        dashboardAPI.getOverview(),
        authAPI.getCurrentUser(),
      ]);
      setStats(statsRes.data.statistics);
      setRecentProjects(statsRes.data.recent_projects);
      setUser(userRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <PageLoader label="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interior Design System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-900 dark:text-gray-100">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.total_projects || 0}
                  </p>
                </div>
                <FolderOpen className="w-12 h-12 text-gray-900 dark:text-gray-100 opacity-30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.active_projects || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-cyan-400 opacity-30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Materials</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats?.total_materials || 0}
                  </p>
                </div>
                <Package className="w-12 h-12 text-pink-400 opacity-30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Cost</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${stats?.estimated_cost?.toFixed(2) || '0'}
                  </p>
                </div>
                <Users className="w-12 h-12 text-pink-400 opacity-30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 border-gray-200 dark:border-gray-700 p-3 rounded-xl">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Project</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create a new design project</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-cyan-500 to-green-500 p-3 rounded-xl">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">View Projects</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your existing projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.role === 'supplier' && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/suppliers')}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Supplier Portal</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage bids and catalog</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No projects yet. Create your first project!</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 hover:shadow-md transition-shadow rounded-xl cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status: <span className="capitalize">{project.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{project.progress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
