from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Material, Bid, User, Catalog, Project, Design
from datetime import datetime

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/designs', methods=['GET'])
@jwt_required()
def get_available_designs():
    """Get all designs with pending materials that need suppliers"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can access this endpoint'}), 403
    
    # Get all designs that have pending materials
    materials_data = Material.find_all()
    design_ids_with_pending = set()
    for m in materials_data:
        if m.get('status') == 'pending' and m.get('design_id'):
            design_ids_with_pending.add(str(m.get('design_id')))
    
    # Fetch design details
    designs = []
    for design_id in design_ids_with_pending:
        design_data = Design.find_by_id(design_id)
        if design_data:
            design = Design(design_data).to_dict()
            # Get categories for this design
            design_materials = Material.find_by_design(design_id)
            categories = list(set([m.get('category', 'other') for m in design_materials if m.get('status') == 'pending']))
            design['categories'] = categories
            # Get materials count
            design['materials_count'] = len([m for m in design_materials if m.get('status') == 'pending'])
            designs.append(design)
    
    return jsonify(designs), 200

@suppliers_bp.route('/design/<string:design_id>/categories', methods=['GET'])
@jwt_required()
def get_design_categories(design_id):
    """Get categories and materials for a specific design"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can access this endpoint'}), 403
    
    # Get materials grouped by category
    materials_data = Material.find_by_design(design_id)
    pending_materials = [m for m in materials_data if m.get('status') == 'pending']
    
    # Group by category
    categories = {}
    for m in pending_materials:
        category = m.get('category', 'other')
        if category not in categories:
            categories[category] = {
                'category': category,
                'materials': [],
                'count': 0
            }
        categories[category]['materials'].append(Material(m).to_dict())
        categories[category]['count'] += 1
    
    # Check existing bids from this supplier
    supplier_bids = Bid.find_by_supplier_and_design(user_id, design_id)
    for bid in supplier_bids:
        if bid.get('category') in categories:
            categories[bid.get('category')]['existing_bid'] = Bid(bid).to_dict()
    
    return jsonify(list(categories.values())), 200

@suppliers_bp.route('/materials', methods=['GET'])
@jwt_required()
def get_available_materials():
    """Get all materials that need suppliers (legacy endpoint)"""
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
    """Create a bid for a design category"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can create bids'}), 403
    
    data = request.get_json()
    
    # Validate required fields for category-based bidding
    design_id = data.get('design_id')
    category = data.get('category')
    
    if not design_id or not category:
        return jsonify({'error': 'design_id and category are required'}), 400
    
    # Verify design exists
    design_data = Design.find_by_id(design_id)
    if not design_data:
        return jsonify({'error': 'Design not found'}), 404
    
    # Check if materials exist in this category for this design
    materials_data = Material.find_by_design(design_id)
    category_materials = [m for m in materials_data if m.get('category') == category and m.get('status') == 'pending']
    
    if not category_materials:
        return jsonify({'error': f'No pending materials found in category "{category}" for this design'}), 404
    
    # Check if supplier already has a pending bid for this design+category
    supplier_bids = Bid.find_by_supplier_and_design(user_id, design_id)
    for bid in supplier_bids:
        if bid.get('category') == category and bid.get('status') == 'pending':
            return jsonify({'error': f'You already have a pending bid for {category} in this design'}), 400
    
    bid_data = {
        'design_id': design_id,
        'category': category,
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

@suppliers_bp.route('/my-bids', methods=['GET'])
@jwt_required()
def get_my_bids():
    """Get all bids for the current supplier with design info"""
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data or user_data.get('role') != 'supplier':
        return jsonify({'error': 'Only suppliers can access this endpoint'}), 403
    
    bids_data = Bid.find_by_supplier(user_id)
    
    # Enrich with design information
    result = []
    for bid in bids_data:
        bid_dict = Bid(bid).to_dict()
        
        # Get design info
        design_data = Design.find_by_id(bid.get('design_id'))
        if design_data:
            bid_dict['design_name'] = design_data.get('design_name', 'Untitled Design')
            bid_dict['project_id'] = design_data.get('project_id')
        
        # Get material count for this category in the design
        if bid.get('design_id') and bid.get('category'):
            materials = Material.find_by_design(bid.get('design_id'))
            category_materials = [m for m in materials if m.get('category') == bid.get('category')]
            bid_dict['materials_count'] = len(category_materials)
        
        result.append(bid_dict)
    
    return jsonify(result), 200

@suppliers_bp.route('/bids/<string:material_id>', methods=['GET'])
@jwt_required()
def get_material_bids(material_id):
    """Get all bids for a specific material (legacy endpoint)"""
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
    """Accept a bid for a design category"""
    user_id = get_jwt_identity()
    
    bid_data = Bid.find_by_id(bid_id)
    if not bid_data:
        return jsonify({'error': 'Bid not found'}), 404
    
    # Get design to verify project ownership
    design_data = Design.find_by_id(bid_data.get('design_id'))
    if not design_data:
        return jsonify({'error': 'Design not found'}), 404
    
    project_data = Project.find_by_id(design_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Accept this bid
    Bid.update(bid_id, {'status': 'accepted'})
    
    # Update all materials in this category for this design
    materials_data = Material.find_by_design(bid_data.get('design_id'))
    for material in materials_data:
        if material.get('category') == bid_data.get('category'):
            Material.update(str(material.get('_id')), {
                'status': 'ordered',
                'estimated_cost': bid_data.get('price')
            })
    
    # Reject all other pending bids for this design+category combination
    all_design_bids = Bid.find_by_design_category(bid_data.get('design_id'), bid_data.get('category'))
    for other_bid in all_design_bids:
        if str(other_bid.get('_id')) != bid_id and other_bid.get('status') == 'pending':
            Bid.update(str(other_bid.get('_id')), {'status': 'rejected'})
    
    return jsonify({'message': 'Bid accepted successfully'}), 200

@suppliers_bp.route('/bid/<string:bid_id>/reject', methods=['POST'])
@jwt_required()
def reject_bid(bid_id):
    """Reject a bid for a design category"""
    user_id = get_jwt_identity()
    
    bid_data = Bid.find_by_id(bid_id)
    if not bid_data:
        return jsonify({'error': 'Bid not found'}), 404
    
    # Get design to verify project ownership
    design_data = Design.find_by_id(bid_data.get('design_id'))
    if not design_data:
        return jsonify({'error': 'Design not found'}), 404
    
    project_data = Project.find_by_id(design_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Reject this bid
    Bid.update(bid_id, {'status': 'rejected'})
    
    return jsonify({'message': 'Bid rejected successfully'}), 200

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
