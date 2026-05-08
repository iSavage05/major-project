from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project, Material, Bid, ExecutionPlan, Milestone, User

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_dashboard_overview():
    user_id = get_jwt_identity()
    
    # Get project statistics
    projects_data = Project.find_by_user(user_id)
    total_projects = len(projects_data)
    active_projects = len([p for p in projects_data if p.get('status') == 'in_progress'])
    completed_projects = len([p for p in projects_data if p.get('status') == 'completed'])
    
    # Get materials statistics
    materials_data = []
    for project in projects_data:
        materials_data.extend(Material.find_by_project(str(project.get('_id'))))
    
    total_materials = len(materials_data)
    pending_materials = len([m for m in materials_data if m.get('status') == 'pending'])
    ordered_materials = len([m for m in materials_data if m.get('status') == 'ordered'])
    delivered_materials = len([m for m in materials_data if m.get('status') == 'delivered'])
    
    # Calculate estimated total cost
    estimated_cost = sum([m.get('estimated_cost') or 0 for m in materials_data])
    
    # Get recent projects
    recent_projects = projects_data[:5]
    
    return jsonify({
        'statistics': {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'total_materials': total_materials,
            'pending_materials': pending_materials,
            'ordered_materials': ordered_materials,
            'delivered_materials': delivered_materials,
            'estimated_cost': estimated_cost
        },
        'recent_projects': [Project(p).to_dict() for p in recent_projects]
    }), 200

@dashboard_bp.route('/project/<string:project_id>/details', methods=['GET'])
@jwt_required()
def get_project_details(project_id):
    user_id = get_jwt_identity()
    
    project_data = Project.find_by_id(project_id)
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    # Get materials
    materials_data = Material.find_by_project(project_id)
    
    # Get execution plan
    execution_plan_data = ExecutionPlan.find_by_project(project_id)
    
    # Get milestones
    milestones_data = Milestone.find_by_project(project_id)
    
    # Get bids
    bids_data = []
    for material in materials_data:
        bids_data.extend(Bid.find_by_material(str(material.get('_id'))))
    
    # Enrich bids with supplier information
    for bid in bids_data:
        supplier_data = User.find_by_id(bid.get('supplier_id'))
        bid['supplier_name'] = supplier_data.get('name') if supplier_data else None
    
    return jsonify({
        'project': Project(project_data).to_dict(),
        'materials': [Material(m).to_dict() for m in materials_data],
        'execution_plan': ExecutionPlan(execution_plan_data).to_dict() if execution_plan_data else None,
        'milestones': [Milestone(m).to_dict() for m in milestones_data],
        'bids': [Bid(b).to_dict() for b in bids_data]
    }), 200

@dashboard_bp.route('/project/<string:project_id>/progress', methods=['GET'])
@jwt_required()
def get_project_progress(project_id):
    user_id = get_jwt_identity()
    
    project_data = Project.find_by_id(project_id)
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    # Calculate progress based on milestones
    milestones_data = Milestone.find_by_project(project_id)
    if milestones_data:
        completed = len([m for m in milestones_data if m.get('status') == 'completed'])
        progress = int((completed / len(milestones_data)) * 100)
    else:
        progress = project_data.get('progress', 0)
    
    # Get materials status
    materials_data = Material.find_by_project(project_id)
    material_status = {
        'total': len(materials_data),
        'pending': len([m for m in materials_data if m.get('status') == 'pending']),
        'ordered': len([m for m in materials_data if m.get('status') == 'ordered']),
        'delivered': len([m for m in materials_data if m.get('status') == 'delivered'])
    }
    
    return jsonify({
        'progress': progress,
        'material_status': material_status,
        'milestones': [Milestone(m).to_dict() for m in milestones_data]
    }), 200
