import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Clock, Calendar, CheckCircle, Layers, Target } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ExecutionPlanCharts = ({ plan, progressLogs }) => {
  // Parse category data from plan - each category becomes a timeline item
  const categoryData = useMemo(() => {
    if (!plan?.category_summary || plan.category_summary.length === 0) return [];
    return plan.category_summary.map((cat, index) => ({
      name: cat.category || `Category ${index + 1}`,
      days: parseFloat(cat.days || 0),
      labourCount: parseInt(cat.labour_count || 0)
    })).filter(c => c.days > 0);
  }, [plan]);

  // Calculate EXPECTED timeline data (from category_summary days)
  const expectedTimelineData = useMemo(() => {
    if (!categoryData.length) return [];
    
    let cumulativeDays = 0;
    return categoryData.map((cat, index) => {
      const startDay = cumulativeDays;
      cumulativeDays += cat.days;
      return {
        name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1), // Capitalize
        startDay,
        endDay: cumulativeDays,
        duration: cat.days,
        labourCount: cat.labourCount,
        fullName: `${cat.name} (${cat.days} days)`,
        displayName: cat.name
      };
    });
  }, [categoryData]);

  // Calculate ACTUAL timeline data (from logged progress by category)
  const actualTimelineData = useMemo(() => {
    if (!progressLogs?.length || !categoryData.length) return [];
    
    // Sort logs by date
    const sortedLogs = [...progressLogs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
    
    // Calculate cumulative actual days per category
    const logsByCategory = {};
    sortedLogs.forEach(log => {
      // Use the category from the log, or map phase to category
      const category = log.category || log.phase || 'General';
      if (!logsByCategory[category]) logsByCategory[category] = 0;
      logsByCategory[category] += log.days_logged || 0;
    });

    // Map to timeline format - match categories to expected
    let cumulativeDays = 0;
    return categoryData.map((cat, index) => {
      const actualDays = logsByCategory[cat.name] || logsByCategory[cat.name.toLowerCase()] || 0;
      const startDay = cumulativeDays;
      // Only show if there's actual work logged
      const duration = actualDays > 0 ? actualDays : 0;
      cumulativeDays += actualDays > 0 ? actualDays : 0;
      
      return {
        name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
        startDay,
        endDay: cumulativeDays,
        duration,
        expectedDuration: cat.days,
        labourCount: cat.labourCount,
        fullName: `${cat.name} (${actualDays > 0 ? actualDays + ' actual' : 'no work yet'})`,
        status: actualDays >= cat.days ? 'completed' : actualDays > 0 ? 'in-progress' : 'pending',
        variance: actualDays - cat.days
      };
    }).filter(item => item.duration > 0); // Only show categories with actual work
  }, [categoryData, progressLogs]);

  // Calculate comparison data for bar chart (Expected vs Actual by Category)
  const comparisonData = useMemo(() => {
    if (!categoryData.length) return [];
    
    // Group logs by category
    const logsByCategory = {};
    (progressLogs || []).forEach(log => {
      const category = log.category || log.phase || 'General';
      if (!logsByCategory[category]) logsByCategory[category] = 0;
      logsByCategory[category] += log.days_logged || 0;
    });

    return categoryData.map(cat => {
      const actualDays = logsByCategory[cat.name] || logsByCategory[cat.name.toLowerCase()] || 0;
      return {
        name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
        expected: cat.days,
        actual: actualDays,
        remaining: Math.max(0, cat.days - actualDays),
        variance: actualDays - cat.days,
        status: actualDays >= cat.days ? 'completed' : actualDays > 0 ? 'in-progress' : 'pending'
      };
    });
  }, [categoryData, progressLogs]);

  // Cumulative progress over time
  const cumulativeProgressData = useMemo(() => {
    if (!progressLogs?.length) return [];
    
    const sortedLogs = [...progressLogs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
    let cumulativeDays = 0;
    const totalExpectedDays = categoryData.reduce((sum, c) => sum + c.days, 0);
    
    return sortedLogs.map((log, index) => {
      cumulativeDays += log.days_logged || 0;
      const percentage = totalExpectedDays > 0 ? (cumulativeDays / totalExpectedDays * 100).toFixed(1) : 0;
      return {
        entry: index + 1,
        date: new Date(log.logged_at).toLocaleDateString(),
        days: log.days_logged,
        cumulative: cumulativeDays,
        percentage: parseFloat(percentage),
        phase: log.phase || log.category || 'General'
      };
    });
  }, [progressLogs, categoryData]);

  // Category completion status for pie chart
  const categoryStatusData = useMemo(() => {
    if (!comparisonData.length) return [];
    
    const completed = comparisonData.filter(c => c.status === 'completed').length;
    const inProgress = comparisonData.filter(c => c.status === 'in-progress').length;
    const pending = comparisonData.filter(c => c.status === 'pending').length;
    
    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'Pending', value: pending, color: '#6b7280' }
    ];
  }, [comparisonData]);

  // Calculate statistics based on category data
  const stats = useMemo(() => {
    if (!categoryData.length) return null;
    
    const totalExpected = categoryData.reduce((sum, c) => sum + c.days, 0);
    const totalActual = progressLogs?.reduce((sum, log) => sum + (log.days_logged || 0), 0) || 0;
    const completion = totalExpected > 0 ? Math.min(100, (totalActual / totalExpected * 100).toFixed(1)) : 0;
    const variance = totalActual - totalExpected;
    
    return {
      totalExpected,
      totalActual,
      completion,
      variance,
      isAhead: variance <= 0,
      categoryCount: categoryData.length
    };
  }, [categoryData, progressLogs]);

  if (!categoryData.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No category data available for visualization. Generate execution plans to see category timelines.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Expected Duration</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{stats.totalExpected} days</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Actual Work</span>
            </div>
            <p className="text-xl font-bold text-green-900">{stats.totalActual.toFixed(1)} days</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Completion</span>
            </div>
            <p className="text-xl font-bold text-purple-900">{stats.completion}%</p>
          </div>
          <div className={`${stats.isAhead ? 'bg-emerald-50' : 'bg-amber-50'} rounded-lg p-3`}>
            <div className={`flex items-center gap-2 ${stats.isAhead ? 'text-emerald-700' : 'text-amber-700'} mb-1`}>
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{stats.isAhead ? 'Ahead' : 'Behind'}</span>
            </div>
            <p className={`text-xl font-bold ${stats.isAhead ? 'text-emerald-900' : 'text-amber-900'}`}>
              {Math.abs(stats.variance).toFixed(1)} days
            </p>
          </div>
        </div>
      )}

      {/* Expected vs Actual Timeline - Side by Side Gantt Charts */}
      <div className="grid grid-cols-1 gap-4">
        {/* Expected Timeline (Static - from category_summary) */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Expected Timeline</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{stats?.totalExpected} days total</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expectedTimelineData} layout="vertical" margin={{ top: 10, right: 50, left: 120, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" label={{ value: 'Days from Start', position: 'insideBottom', offset: -5, fill: '#6b7280' }} tick={{ fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value, name, props) => {
                  const data = props.payload;
                  return [`Days ${data.startDay} - ${data.endDay} (${data.duration} days)`, data.name];
                }}
              />
              <Bar dataKey="startDay" stackId="a" fill="transparent" />
              <Bar dataKey="duration" stackId="a" fill="#3b82f6" radius={[4, 4, 4, 4]}>
                {expectedTimelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Based on categories: {stats?.categoryCount} categories
          </p>
        </div>

        {/* Actual Timeline (Dynamic - from logged progress) */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Actual Timeline</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {actualTimelineData.length > 0 ? `${actualTimelineData[actualTimelineData.length - 1]?.endDay || 0} days logged` : 'No work logged'}
            </span>
          </div>
          {actualTimelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actualTimelineData} layout="vertical" margin={{ top: 10, right: 50, left: 120, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" label={{ value: 'Days from Start', position: 'insideBottom', offset: -5, fill: '#6b7280' }} tick={{ fill: '#6b7280' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value, name, props) => {
                    const data = props.payload;
                    return [`Days ${data.startDay} - ${data.endDay} (${data.duration} days)`, data.name];
                  }}
                />
                <Bar dataKey="startDay" stackId="a" fill="transparent" />
                <Bar dataKey="duration" stackId="a" radius={[4, 4, 4, 4]}>
                  {actualTimelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'completed' ? '#10b981' : entry.status === 'in-progress' ? '#f59e0b' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="text-center">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No progress logged yet</p>
                <p className="text-xs">Log work to see actual timeline</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Updates in real-time as work is logged
          </p>
        </div>
      </div>

      {/* Cumulative Progress Line Chart */}
      {cumulativeProgressData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Cumulative Progress Over Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cumulativeProgressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="entry" tick={{ fontSize: 11 }} label={{ value: 'Progress Entry #', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: '%', angle: -90, position: 'insideRight' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value, name, props) => {
                  if (name === 'cumulative') return [`${value} days`, 'Total Days'];
                  if (name === 'percentage') return [`${value}%`, 'Completion %'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Entry ${label} - ${payload[0].payload.date}`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="cumulative" 
                name="Cumulative Days" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorCumulative)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="percentage" 
                name="Completion %" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Status Pie Chart */}
      {categoryStatusData.some(d => d.value > 0) && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Category Completion Status</h4>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Variance Analysis */}
      {comparisonData.some(c => c.variance !== 0) && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">Schedule Variance by Category</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value) => [`${value > 0 ? '+' : ''}${value} days`, 'Variance']}
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="variance" name="Days Ahead/Behind" radius={[4, 4, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.variance > 0 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Green = Ahead of schedule | Red = Behind schedule
          </p>
        </div>
      )}
    </div>
  );
};

export default ExecutionPlanCharts;
