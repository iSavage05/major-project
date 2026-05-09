import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, designAPI, dashboardAPI, suppliersAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ExecutionPlanCharts from '../components/ExecutionPlanCharts';
import { ArrowLeft, Upload, Wand2, FileText, Clock, Users, Package, Smartphone, PlayCircle, TrendingUp, BarChart3 } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [designName, setDesignName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedDesignForMaterials, setSelectedDesignForMaterials] = useState(null);
  
  // Execution Plan Dialog State
  const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [executionPlanDetails, setExecutionPlanDetails] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressForm, setProgressForm] = useState({ days_logged: '', description: '', phase: '' });
  const [loadingExecutionDetails, setLoadingExecutionDetails] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await dashboardAPI.getProjectDetails(id);
      setProject(response.data.project);
      setDesigns(response.data.designs || []);
      setBids(response.data.bids);
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleGenerateDesign = async (e) => {
    e.preventDefault();
    if (!selectedFile || !prompt) return;

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('project_id', id);
      formData.append('prompt', prompt);
      formData.append('design_name', designName || 'Untitled Design');

      const response = await designAPI.generate(formData);
      setIsDesignModalOpen(false);
      setSelectedFile(null);
      setPrompt('');
      setDesignName('');
      fetchProjectDetails();
      alert('Design generated successfully!');
    } catch (error) {
      console.error('Error generating design:', error);
      alert('Failed to generate design. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateExecutionPlan = async (designId) => {
    try {
      setGenerating(true);
      await designAPI.generateExecutionPlan(designId);
      fetchProjectDetails();
      alert('Execution plan generated successfully!');
    } catch (error) {
      console.error('Error generating execution plan:', error);
      alert('Failed to generate execution plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await suppliersAPI.acceptBid(bidId);
      fetchProjectDetails();
      alert('Bid accepted successfully!');
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await suppliersAPI.rejectBid(bidId);
      fetchProjectDetails();
      alert('Bid rejected successfully!');
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid. Please try again.');
    }
  };

  const handleOpenExecutionDialog = async (design) => {
    setSelectedDesign(design);
    setIsExecutionDialogOpen(true);
    setLoadingExecutionDetails(true);
    try {
      // Use the aggregated execution plan data from the design
      const aggregated = design.aggregated_execution_plan;
      
      // Create a combined plan object with category data for the charts
      const combinedPlan = {
        id: design.id,
        design_name: design.design_name,
        category_summary: aggregated.category_summary || [],
        labour: aggregated.labour_summary || [],
        total_labour_days: aggregated.total_labour_days,
        calculated_duration: aggregated.calculated_duration,
        progress_logs: aggregated.all_progress_logs || [],
        categories_count: aggregated.categories_count
      };
      
      setExecutionPlanDetails(combinedPlan);
      setProgressLogs(aggregated.all_progress_logs || []);
    } catch (error) {
      console.error('Error fetching execution plan details:', error);
    } finally {
      setLoadingExecutionDetails(false);
    }
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!selectedDesign || !selectedDesign.execution_plans || selectedDesign.execution_plans.length === 0) return;
    
    try {
      // Log progress to the first execution plan (could be enhanced to select specific category)
      const targetPlan = selectedDesign.execution_plans[0];
      
      await designAPI.logExecutionProgress(targetPlan.id, {
        days_logged: parseFloat(progressForm.days_logged),
        description: progressForm.description,
        phase: progressForm.phase || null
      });
      
      // Refresh project details to get updated aggregated data
      await fetchProjectDetails();
      
      // Refresh the dialog data
      const updatedDesign = designs.find(d => d.id === selectedDesign.id);
      if (updatedDesign) {
        const aggregated = updatedDesign.aggregated_execution_plan;
        setExecutionPlanDetails({
          ...executionPlanDetails,
          progress_logs: aggregated.all_progress_logs || [],
          total_labour_days: aggregated.total_labour_days
        });
        setProgressLogs(aggregated.all_progress_logs || []);
      }
      
      // Reset form
      setProgressForm({ days_logged: '', description: '', phase: '' });
      alert('Progress logged successfully!');
    } catch (error) {
      console.error('Error logging progress:', error);
      alert('Failed to log progress. Please try again.');
    }
  };

  const handleOpenImageModal = (imageUrl, designName) => {
    setSelectedImage({ url: imageUrl, name: designName });
    setIsImageModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/projects')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button onClick={() => setIsDesignModalOpen(true)}>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Design
              </Button>
              {designs.length > 0 && (
                <Button variant="outline" onClick={() => navigate('/ar-viewer')}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  AR View
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <Card className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-primary-100">Status</p>
                <p className="font-semibold capitalize text-lg">{project?.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-100">Progress</p>
                <p className="font-semibold text-lg">{project?.progress}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-100">Budget</p>
                <p className="font-semibold text-lg">${project?.budget || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-100">Room Type</p>
                <p className="font-semibold text-lg">{project?.room_type || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Designs */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Wand2 className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Generated Designs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No designs yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Generate your first design to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {designs.map((design) => (
                    <div key={design.id} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{design.design_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{design.prompt}</p>
                      {(design.generated_image_url || design.generated_image_path) && (
                        <div 
                          className="relative cursor-pointer group"
                          onClick={() => handleOpenImageModal(design.generated_image_url || `http://localhost:5000${design.generated_image_path}`, design.design_name)}
                        >
                          <img
                            src={design.generated_image_url || `http://localhost:5000${design.generated_image_path}`}
                            alt="Generated design"
                            className="w-full h-48 object-cover rounded-lg mb-3 transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Click to view</span>
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateExecutionPlan(design.id)}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {design.execution_plan ? 'Regenerate Execution Plan' : 'Generate Execution Plan'}
                      </Button>
                      {design.execution_plan && (
                        <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm">
                          <p className="text-gray-700 dark:text-gray-300">Duration: <span className="font-semibold text-gray-900 dark:text-white">{design.execution_plan.total_duration}</span></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Package className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Materials by Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No designs yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Generate a design first to view materials!</p>
                </div>
              ) : (
                <>
                  {/* Design Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {designs.map((design) => (
                      <Button
                        key={design.id}
                        size="sm"
                        variant={selectedDesignForMaterials === design.id ? 'primary' : 'outline'}
                        onClick={() => setSelectedDesignForMaterials(
                          selectedDesignForMaterials === design.id ? null : design.id
                        )}
                      >
                        {design.design_name}
                        {design.materials && design.materials.length > 0 && (
                          <span className="ml-1 text-xs">({design.materials.length})</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Materials for Selected Design */}
                  {selectedDesignForMaterials && (
                    <div className="space-y-2 max-h-96 overflow-y-auto border-t border-gray-200 dark:border-dark-border pt-4">
                      {(() => {
                        const selectedDesign = designs.find(d => d.id === selectedDesignForMaterials);
                        const designMaterials = selectedDesign?.materials || [];
                        return designMaterials.length === 0 ? (
                          <p className="text-gray-600 dark:text-gray-400 text-center py-4">No materials for this design.</p>
                        ) : (
                          <>
                            <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{selectedDesign.design_name} Materials:</p>
                            {designMaterials.map((material) => (
                              <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div>
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">{material.description}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{material.quantity} {material.unit}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{material.status}</p>
                                  {material.estimated_cost && (
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">${material.estimated_cost}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {!selectedDesignForMaterials && (
                    <p className="text-gray-500 dark:text-gray-500 text-center py-4 text-sm">Click a design button above to view its materials</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Execution Plans by Design - One tile per design (aggregated) */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Execution Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 || designs.every(d => !d.aggregated_execution_plan || d.aggregated_execution_plan.total_labour_days === 0) ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No execution plans yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Generate a design and create execution plans!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {designs.filter(d => d.aggregated_execution_plan && d.aggregated_execution_plan.total_labour_days > 0).map((design) => (
                    <div key={design.id} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-white dark:bg-dark-surface hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{design.design_name}</h3>
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs font-medium">
                          {design.aggregated_execution_plan.categories_count} categories
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Total Duration:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{design.aggregated_execution_plan.calculated_duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {design.aggregated_execution_plan.total_progress_days.toFixed(1)} / {design.aggregated_execution_plan.total_labour_days} days
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, (design.aggregated_execution_plan.total_progress_days / 
                                design.aggregated_execution_plan.total_labour_days * 100) || 0)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleOpenExecutionDialog(design)}
                        className="w-full flex items-center justify-center gap-1"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Timeline
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bids */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Users className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Supplier Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No bids yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Suppliers will bid on your materials!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bids.filter(bid => bid.status !== 'rejected').map((bid) => (
                    <div key={bid.id} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">{bid.supplier_name}</p>
                            {bid.company_name && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">({bid.company_name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                              {bid.design_name || 'Unknown Design'}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize text-gray-700 dark:text-gray-300">
                              {bid.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">${bid.price}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{bid.estimated_delivery_days} days</p>
                        </div>
                      </div>
                      
                      {bid.status === 'pending' ? (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
                            onClick={() => handleRejectBid(bid.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                            onClick={() => handleAcceptBid(bid.id)}
                          >
                            Accept
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium capitalize bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Accepted
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Design Generation Modal */}
      <Modal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        title="Generate Interior Design"
      >
        <form onSubmit={handleGenerateDesign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Room Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload image'}
                </p>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Enter a name for this design (e.g., 'Master Bedroom Modern')"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Design Prompt
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your desired interior design (e.g., 'Transform this room into a modern minimalist living room with built-in cabinets and warm lighting')"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDesignModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Design'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Execution Plan Timeline Dialog */}
      <Modal
        isOpen={isExecutionDialogOpen}
        onClose={() => {
          setIsExecutionDialogOpen(false);
          setSelectedDesign(null);
          setExecutionPlanDetails(null);
          setProgressLogs([]);
        }}
        title={`${selectedDesign ? `${selectedDesign.design_name} - Execution Timeline` : 'Execution Plan'}`}
      >
        {loadingExecutionDetails ? (
          <div className="text-center py-8">Loading...</div>
        ) : executionPlanDetails ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Charts Section */}
            <ExecutionPlanCharts 
              plan={executionPlanDetails} 
              progressLogs={progressLogs} 
            />

            {/* Log Progress Form */}
            <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Log Progress
              </h3>
              <form onSubmit={handleLogProgress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Days Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      value={progressForm.days_logged}
                      onChange={(e) => setProgressForm({ ...progressForm, days_logged: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase (Optional)</label>
                    <input
                      type="text"
                      value={progressForm.phase}
                      onChange={(e) => setProgressForm({ ...progressForm, phase: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Painting"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={progressForm.description}
                    onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3"
                    placeholder="Describe the work completed..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Log Progress</Button>
              </form>
            </div>

            {/* Progress History */}
            {progressLogs.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Progress History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {progressLogs.slice().reverse().map((log, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.days_logged} days</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.logged_at).toLocaleDateString()}
                        </span>
                      </div>
                      {log.phase && <span className="text-xs text-blue-600 mb-1 block">{log.phase}</span>}
                      <p className="text-gray-600">{log.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No execution plan details available</div>
        )}
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setSelectedImage(null);
        }}
        title={selectedImage?.name || 'Design Image'}
      >
        <div className="flex flex-col items-center">
          {selectedImage?.url && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-[70vh] rounded-lg object-contain"
            />
          )}
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setIsImageModalOpen(false);
              setSelectedImage(null);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
