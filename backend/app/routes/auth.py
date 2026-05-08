from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
import os
from datetime import timedelta
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    data = request.get_json()
    
    # Check if user already exists
    if User.find_by_email(data['email']):
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user_data = {
        'email': data['email'],
        'password_hash': generate_password_hash(data['password']),
        'name': data['name'],
        'role': data.get('role', 'user'),
        'company_name': data.get('company_name'),
        'phone': data.get('phone')
    }
    user_id = User.create(user_data)
    
    # Create access token
    access_token = create_access_token(identity=user_id, expires_delta=timedelta(days=7))
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'user': {
            'id': user_id,
            'email': data['email'],
            'name': data['name'],
            'role': data.get('role', 'user'),
            'company_name': data.get('company_name')
        }
    }), 201

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    data = request.get_json()
    
    user_data = User.find_by_email(data['email'])
    
    if not user_data:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    user = User(user_data)
    if not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    access_token = create_access_token(identity=user.id, expires_delta=timedelta(days=7))
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'company_name': user.company_name
        }
    }), 200

@auth_bp.route('/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user_data = User.find_by_id(user_id)
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    user = User(user_data)
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'company_name': user.company_name,
        'phone': user.phone
    }), 200
