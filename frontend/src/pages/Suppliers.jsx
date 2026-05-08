import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliersAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { ArrowLeft, Plus, DollarSign, Package, CheckCircle } from 'lucide-react';

const Suppliers = () => {
  const navigate = useNavigate();
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
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
      const [materialsRes, catalogRes] = await Promise.all([
        suppliersAPI.getMaterials(),
        suppliersAPI.getCatalog(),
      ]);
      setAvailableMaterials(materialsRes.data);
      setCatalog(catalogRes.data);
    } catch (error) {
      console.error('Error fetching supplier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBidModal = (material) => {
    setSelectedMaterial(material);
    setBidForm({ price: '', estimated_delivery_days: '', notes: '' });
    setIsBidModalOpen(true);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    try {
      await suppliersAPI.createBid({
        material_id: selectedMaterial.id,
        ...bidForm,
        price: parseFloat(bidForm.price),
        estimated_delivery_days: parseInt(bidForm.estimated_delivery_days),
      });
      setIsBidModalOpen(false);
      setSelectedMaterial(null);
      setBidForm({ price: '', estimated_delivery_days: '', notes: '' });
      alert('Bid submitted successfully!');
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Supplier Portal</h1>
            </div>
            <Button onClick={() => setIsCatalogModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Catalog
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Materials for Bidding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Materials Requiring Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableMaterials.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No materials available for bidding at the moment.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableMaterials.map((material) => (
                    <div key={material.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{material.description}</h4>
                      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                        <span>{material.quantity} {material.unit}</span>
                        <span className="capitalize">{material.category}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleOpenBidModal(material)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Place Bid
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                My Catalog
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catalog.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Your catalog is empty. Add products to start selling!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {catalog.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{item.product_name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 capitalize">{item.category}</span>
                        <span className="font-semibold">${item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bid Modal */}
      <Modal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        title={`Place Bid for ${selectedMaterial?.description}`}
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
            <Input
              type="text"
              value={catalogForm.category}
              onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
              placeholder="e.g., Furniture, Paint, Lighting"
            />
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
