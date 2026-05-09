import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Plus, DollarSign, Package, CheckCircle, FolderOpen, Tag, X } from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

const Suppliers = () => {
  const navigate = useNavigate();
  const [availableDesigns, setAvailableDesigns] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [catalog, setCatalog] = useState([]);
  
  // Selection states
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [designCategories, setDesignCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal states
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [viewingMaterials, setViewingMaterials] = useState([]);
  
  const [bidForm, setBidForm] = useState({
    price: '',
    estimated_delivery_days: '',
    notes: '',
  });
  const [catalogForm, setCatalogForm] = useState({
    product_name: '',
    description: '',
    category: '',
    price: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [designsRes, bidsRes, catalogRes] = await Promise.all([
        suppliersAPI.getAvailableDesigns(),
        suppliersAPI.getMyBids(),
        suppliersAPI.getCatalog(),
      ]);
      setAvailableDesigns(designsRes.data);
      setMyBids(bidsRes.data);
      setCatalog(catalogRes.data);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDesign = async (design) => {
    setSelectedDesign(design);
    setSelectedCategory(null);
    try {
      const response = await suppliersAPI.getDesignCategories(design.id);
      setDesignCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
    }
  };

  const handleViewMaterials = (categoryData) => {
    setViewingMaterials(categoryData.materials);
    setIsMaterialsModalOpen(true);
  };

  const handleOpenBidModal = (category) => {
    setSelectedCategory(category);
    setBidForm({ price: '', estimated_delivery_days: '', notes: '' });
    setIsBidModalOpen(true);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    try {
      await suppliersAPI.createBid({
        design_id: selectedDesign.id,
        category: selectedCategory.category,
        price: parseFloat(bidForm.price),
        estimated_delivery_days: parseInt(bidForm.estimated_delivery_days),
        notes: bidForm.notes,
      });
      setIsBidModalOpen(false);
      setSelectedCategory(null);
      setBidForm({ price: '', estimated_delivery_days: '', notes: '' });
      fetchData();
      alert('Bid submitted successfully!');
    } catch (error) {
      console.error('Error submitting bid:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit bid. Please try again.';
      alert(errorMsg);
    }
  };

  const handleAddToCatalog = async (e) => {
    e.preventDefault();
    try {
      await suppliersAPI.addToCatalog({
        ...catalogForm,
        price: parseFloat(catalogForm.price),
      });
      setIsCatalogModalOpen(false);
      setCatalogForm({
        product_name: '',
        description: '',
        category: '',
        price: '',
        image_url: '',
      });
      fetchData();
      alert('Product added to catalog successfully!');
    } catch (error) {
      console.error('Error adding to catalog:', error);
      alert('Failed to add to catalog. Please try again.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Portal</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button onClick={() => setIsCatalogModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Catalog
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Designs for Bidding */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <FolderOpen className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Available Designs for Bidding
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableDesigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-primary-100 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No designs available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Check back later for new bidding opportunities</p>
                </div>
              ) : !selectedDesign ? (
                // Show Design List
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableDesigns.map((design) => (
                    <div key={design.id} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{design.design_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{design.prompt}</p>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{design.materials_count} materials</span>
                        <span className="capitalize">{design.categories?.length || 0} categories</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleSelectDesign(design)}
                      >
                        View Categories
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                // Show Categories for Selected Design
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedDesign.design_name} - Categories</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDesign(null);
                        setSelectedCategory(null);
                        setDesignCategories([]);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Designs
                    </Button>
                  </div>
                  
                  {designCategories.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">No categories available for this design.</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {designCategories.map((category) => (
                        <div key={category.category} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Tag className="w-4 h-4 mr-2 text-primary-500" />
                              <h4 className="font-semibold capitalize text-gray-900 dark:text-white">{category.category}</h4>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{category.count} items</span>
                          </div>
                          
                          {category.existing_bid ? (
                            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-white">Your bid:</span> ${category.existing_bid.price}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                Status: {category.existing_bid.status}
                              </p>
                            </div>
                          ) : (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleViewMaterials(category)}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                View Materials
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleOpenBidModal(category)}
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Place Bid
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Bids */}
          <Card className="hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <DollarSign className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                My Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myBids.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No bids yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Place your first bid to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {myBids.map((bid) => (
                    <div key={bid.id} className="border border-gray-200 dark:border-dark-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{bid.design_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm capitalize bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                          {bid.category}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {bid.materials_count} materials
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">${bid.price}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{bid.estimated_delivery_days} days delivery</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          bid.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Materials Modal */}
      <Modal
        isOpen={isMaterialsModalOpen}
        onClose={() => {
          setIsMaterialsModalOpen(false);
          setViewingMaterials([]);
        }}
        title="Materials in Category"
      >
        <div className="max-h-96 overflow-y-auto">
          {viewingMaterials.map((material) => (
            <div key={material.id} className="border-b py-2 last:border-0">
              <p className="font-medium">{material.description}</p>
              <p className="text-sm text-gray-600">
                {material.quantity} {material.unit} | HSN: {material.hsn_sac || 'N/A'}
              </p>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={() => {
            setIsMaterialsModalOpen(false);
            setViewingMaterials([]);
          }}
        >
          Close
        </Button>
      </Modal>

      {/* Bid Modal */}
      <Modal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        title={`Place Bid for ${selectedDesign?.design_name} - ${selectedCategory?.category}`}
      >
        <form onSubmit={handleSubmitBid} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={bidForm.price}
              onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
              required
              placeholder="Enter your bid price"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Delivery (Days)
            </label>
            <Input
              type="number"
              value={bidForm.estimated_delivery_days}
              onChange={(e) => setBidForm({ ...bidForm, estimated_delivery_days: e.target.value })}
              required
              placeholder="Enter delivery time in days"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={bidForm.notes}
              onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
              placeholder="Add any additional information"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBidModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit Bid
            </Button>
          </div>
        </form>
      </Modal>

      {/* Catalog Modal */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Add Product to Catalog"
      >
        <form onSubmit={handleAddToCatalog} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <Input
              type="text"
              value={catalogForm.product_name}
              onChange={(e) => setCatalogForm({ ...catalogForm, product_name: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={catalogForm.description}
              onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
              placeholder="Enter product description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={catalogForm.category}
              onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
            >
              <option value="">Select a category</option>
              <option value="furniture">Furniture</option>
              <option value="paint">Paint</option>
              <option value="electrical">Electrical</option>
              <option value="lighting">Lighting</option>
              <option value="flooring">Flooring</option>
              <option value="hardware">Hardware</option>
              <option value="decor">Decor</option>
              <option value="structural">Structural</option>
              <option value="plumbing">Plumbing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={catalogForm.price}
              onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
              required
              placeholder="Enter price"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (Optional)
            </label>
            <Input
              type="url"
              value={catalogForm.image_url}
              onChange={(e) => setCatalogForm({ ...catalogForm, image_url: e.target.value })}
              placeholder="Enter image URL"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCatalogModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
