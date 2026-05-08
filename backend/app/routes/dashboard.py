from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project, Material, Bid, ExecutionPlan, Milestone, User, Design

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
    
    # Get designs
    designs_data = Design.find_by_project(project_id)
    
    # Enrich designs with their materials and execution plans
    enriched_designs = []
    for d in designs_data:
        design_dict = Design(d).to_dict()
        design_id = str(d.get('_id'))
        
        # Get materials for this design
        design_materials = Material.find_by_design(design_id)
        design_dict['materials'] = [Material(m).to_dict() for m in design_materials]
        
        # Get execution plans for this design (now categorized by category)
        execution_plans_data = ExecutionPlan.find_by_design(design_id)
        execution_plans = [ExecutionPlan(ep).to_dict() for ep in execution_plans_data]
        design_dict['execution_plans'] = execution_plans
        
        # Aggregate execution plan data for the design (for single tile view)
        total_labour_days = 0
        all_labour = []
        all_progress_logs = []
        all_categories = []  # Category breakdown for Gantt chart - from category_json
        
        for ep in execution_plans_data:
            # Parse labour_json
            try:
                labour_raw = ep.get('labour_json', '[]')
                if labour_raw and labour_raw != '[]':
                    labour_list = eval(labour_raw)
                    for worker in labour_list:
                        days_str = worker.get('days required', '0')
                        try:
                            days = float(days_str)
                            total_labour_days += days
                        except:
                            pass
                    all_labour.extend(labour_list)
            except:
                pass
            
            # Parse category_json for category breakdown (primary source for Gantt)
            try:
                category_raw = ep.get('category_json', '[]')
                if category_raw and category_raw != '[]':
                    category_list = eval(category_raw)
                    for cat in category_list:
                        all_categories.append({
                            'category': cat.get('category', 'general'),
                            'days': cat.get('days', 0),
                            'notes': cat.get('notes', '')
                        })
            except:
                pass
            
            # Aggregate progress logs
            ep_logs = ep.get('progress_logs', []) or []
            all_progress_logs.extend(ep_logs)
        
        design_dict['aggregated_execution_plan'] = {
            'total_labour_days': total_labour_days,
            'calculated_duration': f"{total_labour_days} days",
            'categories_count': len(execution_plans),
            'labour_summary': all_labour,
            'category_summary': all_categories,  # For category-based Gantt
            'all_progress_logs': all_progress_logs,
            'total_progress_days': sum(log.get('days_logged', 0) for log in all_progress_logs)
        }
        
        enriched_designs.append(design_dict)
    
    # Get all materials for the project (for backwards compatibility)
    materials_data = Material.find_by_project(project_id)
    
    # Get milestones
    milestones_data = Milestone.find_by_project(project_id)
    
    # Get bids (now category-based, design-linked)
    bids_data = Bid.find_all()
    # Filter bids for this project's designs
    design_ids = [str(d.get('_id')) for d in designs_data]
    bids_data = [b for b in bids_data if b.get('design_id') in design_ids]
    
    # Enrich bids with supplier and design information
    for bid in bids_data:
        supplier_data = User.find_by_id(bid.get('supplier_id'))
        bid['supplier_name'] = supplier_data.get('name') if supplier_data else None
        bid['company_name'] = supplier_data.get('company_name') if supplier_data else None
        # Get design name
        design_data = Design.find_by_id(bid.get('design_id'))
        bid['design_name'] = design_data.get('design_name', 'Untitled Design') if design_data else 'Unknown Design'
    
    return jsonify({
        'project': Project(project_data).to_dict(),
        'designs': enriched_designs,
        'all_materials': [Material(m).to_dict() for m in materials_data],
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
