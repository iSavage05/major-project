from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Project, Milestone
from datetime import datetime

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['OPTIONS'])
def get_projects_no_slash_options():
    return '', 200

@projects_bp.route('', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_projects_no_slash():
    user_id = get_jwt_identity()
    projects_data = Project.find_by_user(user_id)
    
    return jsonify([Project(p).to_dict() for p in projects_data]), 200

@projects_bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    projects_data = Project.find_by_user(user_id)
    
    return jsonify([Project(p).to_dict() for p in projects_data]), 200

@projects_bp.route('', methods=['OPTIONS'])
def create_project_no_slash_options():
    return '', 200

@projects_bp.route('', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_project_no_slash():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    project_data = {
        'user_id': user_id,
        'name': data['name'],
        'description': data.get('description'),
        'room_type': data.get('room_type'),
        'budget': data.get('budget'),
        'status': 'pending'
    }
    project_id = Project.create(project_data)
    
    return jsonify({
        'id': project_id,
        'name': data['name'],
        'message': 'Project created successfully'
    }), 201

@projects_bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    project_data = {
        'user_id': user_id,
        'name': data['name'],
        'description': data.get('description'),
        'room_type': data.get('room_type'),
        'budget': data.get('budget'),
        'status': 'pending'
    }
    project_id = Project.create(project_data)
    
    return jsonify({
        'id': project_id,
        'name': data['name'],
        'message': 'Project created successfully'
    }), 201

@projects_bp.route('/<string:project_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_project(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    project = Project(project_data)
    return jsonify(project.to_dict()), 200

@projects_bp.route('/<string:project_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_project(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    Project.update(project_id, data)
    
    return jsonify({'message': 'Project updated successfully'}), 200

@projects_bp.route('/<string:project_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    Project.delete(project_id)
    
    return jsonify({'message': 'Project deleted successfully'}), 200

@projects_bp.route('/<string:project_id>/milestones', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_milestones(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    milestones_data = Milestone.find_by_project(project_id)
    
    return jsonify([Milestone(m).to_dict() for m in milestones_data]), 200

@projects_bp.route('/<string:project_id>/milestones', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_milestone(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    
    milestone_data = {
        'project_id': project_id,
        'name': data['name'],
        'description': data.get('description'),
        'target_date': datetime.fromisoformat(data['target_date']) if data.get('target_date') else None
    }
    milestone_id = Milestone.create(milestone_data)
    
    return jsonify({
        'id': milestone_id,
        'message': 'Milestone created successfully'
    }), 201
