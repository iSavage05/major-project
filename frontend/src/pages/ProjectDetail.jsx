import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, designAPI, dashboardAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Upload, Wand2, FileText, Clock, Users, Package, Smartphone } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [executionPlan, setExecutionPlan] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await dashboardAPI.getProjectDetails(id);
      setProject(response.data.project);
      setMaterials(response.data.materials);
      setExecutionPlan(response.data.execution_plan);
      setBids(response.data.bids);
      
      const designsRes = await designAPI.getProjectDesigns(id);
      setDesigns(designsRes.data);
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

      const response = await designAPI.generate(formData);
      setIsDesignModalOpen(false);
      setSelectedFile(null);
      setPrompt('');
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
      await designAPI.generateExecutionPlan(designId);
      fetchProjectDetails();
      alert('Execution plan generated successfully!');
    } catch (error) {
      console.error('Error generating execution plan:', error);
      alert('Failed to generate execution plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/projects')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
            </div>
            <div className="flex space-x-3">
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
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold capitalize">{project?.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="font-semibold">{project?.progress}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">${project?.budget || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Type</p>
                <p className="font-semibold">{project?.room_type || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Designs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Generated Designs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No designs yet. Generate your first design!</p>
              ) : (
                <div className="space-y-4">
                  {designs.map((design) => (
                    <div key={design.id} className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">{design.prompt}</p>
                      {(design.generated_image_url || design.generated_image_path) && (
                        <img
                          src={design.generated_image_url || `http://localhost:5000${design.generated_image_path}`}
                          alt="Generated design"
                          className="w-full h-48 object-cover rounded mb-2"
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateExecutionPlan(design.id)}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Execution Plan
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Materials Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No materials yet. Generate a design first!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {materials.map((material) => (
                    <div key={material.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{material.description}</p>
                        <p className="text-xs text-gray-600">{material.quantity} {material.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 capitalize">{material.status}</p>
                        {material.estimated_cost && (
                          <p className="text-sm font-semibold">${material.estimated_cost}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Execution Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!executionPlan ? (
                <p className="text-gray-600 text-center py-8">No execution plan yet. Generate a design and create an execution plan!</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Duration</p>
                    <p className="font-semibold">{executionPlan.total_duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Summary</p>
                    <p className="text-sm">{executionPlan.project_summary}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bids */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Supplier Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No bids yet. Suppliers will bid on your materials!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bids.map((bid) => (
                    <div key={bid.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{bid.supplier_name}</p>
                        {bid.company_name && (
                          <p className="text-xs text-gray-600">{bid.company_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${bid.price}</p>
                        <p className="text-xs capitalize text-gray-600">{bid.status}</p>
                      </div>
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
    </div>
  );
};

export default ProjectDetail;
