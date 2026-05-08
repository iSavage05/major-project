from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Material, Bid, User, Catalog, Project
from datetime import datetime

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/materials', methods=['GET'])
@jwt_required()
def get_available_materials():
    """Get all materials that need suppliers"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can access this endpoint'}), 403
    
    materials_data = Material.find_all()
    materials_data = [m for m in materials_data if m.get('status') == 'pending']
    
    return jsonify([Material(m).to_dict() for m in materials_data]), 200

@suppliers_bp.route('/bid', methods=['POST'])
@jwt_required()
def create_bid():
    """Create a bid for a material"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can create bids'}), 403
    
    data = request.get_json()
    
    # Check if material exists
    material_data = Material.find_by_id(data['material_id'])
    if not material_data:
        return jsonify({'error': 'Material not found'}), 404
    
    # Check if supplier already has a pending bid
    existing_bids = Bid.find_by_material(data['material_id'])
    for bid in existing_bids:
        if bid.get('supplier_id') == user_id and bid.get('status') == 'pending':
            return jsonify({'error': 'You already have a pending bid for this material'}), 400
    
    bid_data = {
        'material_id': data['material_id'],
        'supplier_id': user_id,
        'price': data['price'],
        'estimated_delivery_days': data.get('estimated_delivery_days'),
        'notes': data.get('notes')
    }
    bid_id = Bid.create(bid_data)
    
    return jsonify({
        'id': bid_id,
        'message': 'Bid created successfully'
    }), 201

@suppliers_bp.route('/bids/<string:material_id>', methods=['GET'])
@jwt_required()
def get_material_bids(material_id):
    """Get all bids for a specific material"""
    user_id = get_jwt_identity()
    
    # Verify material exists
    material_data = Material.find_by_id(material_id)
    if not material_data:
        return jsonify({'error': 'Material not found'}), 404
    
    # Verify user owns the project
    project_data = Project.find_by_id(material_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    bids_data = Bid.find_by_material(material_id)
    
    # Enrich with supplier information
    result = []
    for bid in bids_data:
        supplier_data = User.find_by_id(bid.get('supplier_id'))
        bid_dict = Bid(bid).to_dict()
        bid_dict['supplier_name'] = supplier_data.get('name') if supplier_data else None
        bid_dict['company_name'] = supplier_data.get('company_name') if supplier_data else None
        result.append(bid_dict)
    
    return jsonify(result), 200

@suppliers_bp.route('/bid/<string:bid_id>/accept', methods=['POST'])
@jwt_required()
def accept_bid(bid_id):
    """Accept a bid for a material"""
    user_id = get_jwt_identity()
    
    bid_data = Bid.find_by_id(bid_id)
    if not bid_data:
        return jsonify({'error': 'Bid not found'}), 404
    
    # Verify user owns the project
    material_data = Material.find_by_id(bid_data.get('material_id'))
    if not material_data:
        return jsonify({'error': 'Material not found'}), 404
    
    project_data = Project.find_by_id(material_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Reject all other pending bids for this material
    other_bids = Bid.find_by_material(bid_data.get('material_id'))
    for other_bid in other_bids:
        if other_bid.get('_id') != bid_id and other_bid.get('status') == 'pending':
            Bid.update(str(other_bid.get('_id')), {'status': 'rejected'})
    
    # Accept this bid
    Bid.update(bid_id, {'status': 'accepted'})
    Material.update(bid_data.get('material_id'), {
        'status': 'ordered',
        'estimated_cost': bid_data.get('price')
    })
    
    return jsonify({'message': 'Bid accepted successfully'}), 200

@suppliers_bp.route('/catalog', methods=['POST'])
@jwt_required()
def add_to_catalog():
    """Add product to supplier catalog"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can add to catalog'}), 403
    
    data = request.get_json()
    
    catalog_data = {
        'supplier_id': user_id,
        'product_name': data['product_name'],
        'description': data.get('description'),
        'category': data.get('category'),
        'price': data['price'],
        'image_url': data.get('image_url'),
        'specifications': data.get('specifications')
    }
    catalog_id = Catalog.create(catalog_data)
    
    return jsonify({
        'id': catalog_id,
        'message': 'Product added to catalog successfully'
    }), 201

@suppliers_bp.route('/catalog', methods=['GET'])
@jwt_required()
def get_catalog():
    """Get supplier catalog or all catalogs"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    if user_data.get('role') == 'supplier':
        catalog_data = Catalog.find_by_supplier(user_id)
    else:
        catalog_data = Catalog.find_all()
        catalog_data = [c for c in catalog_data if c.get('available', True)]
    
    # Enrich with supplier information
    result = []
    for catalog in catalog_data:
        supplier_data = User.find_by_id(catalog.get('supplier_id'))
        catalog_dict = Catalog(catalog).to_dict()
        catalog_dict['supplier_name'] = supplier_data.get('name') if supplier_data else None
        result.append(catalog_dict)
    
    return jsonify(result), 200
