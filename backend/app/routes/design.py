from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from PIL import Image as PILImage
from io import BytesIO
from app.models import Project, Design, Material, ExecutionPlan
from app.services.design_service import DesignService
from app.utils.markdown_parser import parse_materials_markdown, parse_execution_plan_markdown
import cloudinary
import cloudinary.uploader

design_bp = Blueprint('design', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@design_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_design():
    user_id = get_jwt_identity()
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    if 'project_id' not in request.form:
        return jsonify({'error': 'project_id is required'}), 400
    
    if 'prompt' not in request.form:
        return jsonify({'error': 'prompt is required'}), 400
    
    file = request.files['image']
    project_id = request.form['project_id']
    prompt = request.form['prompt']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp'}), 400
    
    # Verify project ownership
    project_data = Project.find_by_id(project_id)
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    # Upload original image to Cloudinary
    try:
        original_upload_result = cloudinary.uploader.upload(
            file,
            folder='interior_design/originals',
            resource_type='image'
        )
        original_image_url = original_upload_result['secure_url']
    except Exception as e:
        return jsonify({'error': f'Failed to upload original image: {str(e)}'}), 500
    
    try:
        # Generate design using the uploaded image URL
        design_service = DesignService()
        result = design_service.generate_design_from_url(original_image_url, prompt)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 500
        
        # Upload generated image to Cloudinary
        output_buffer = BytesIO()
        result['transformed_image'].save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        generated_upload_result = cloudinary.uploader.upload(
            output_buffer,
            folder='interior_design/generated',
            resource_type='image'
        )
        generated_image_url = generated_upload_result['secure_url']
        
        # Save design record with Cloudinary URLs
        design_data = {
            'project_id': project_id,
            'original_image_url': original_image_url,
            'generated_image_url': generated_image_url,
            'prompt': prompt
        }
        design_id = Design.create(design_data)
        
        # Save materials
        for material_data in result['materials']:
            material_data_dict = {
                'project_id': project_id,
                'description': material_data.get('description_of_goods', ''),
                'hsn_sac': material_data.get('hsn_sac', ''),
                'quantity': material_data.get('qty', 0),
                'unit': material_data.get('unit', ''),
                'category': material_data.get('category', 'other')
            }
            Material.create(material_data_dict)
        
        return jsonify({
            'message': 'Design generated successfully',
            'design_id': design_id,
            'materials': result['materials'],
            'generated_image': generated_image_url
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@design_bp.route('/image/<string:design_id>', methods=['GET'])
@jwt_required()
def get_design_image(design_id):
    design_data = Design.find_by_id(design_id)
    
    if not design_data:
        return jsonify({'error': 'Design not found'}), 404
    
    design = Design(design_data)
    return jsonify({'image_url': design.generated_image_url}), 200

@design_bp.route('/<string:design_id>/execution-plan', methods=['POST'])
@jwt_required()
def generate_execution_plan_endpoint(design_id):
    user_id = get_jwt_identity()
    design_data = Design.find_by_id(design_id)
    
    if not design_data:
        return jsonify({'error': 'Design not found'}), 404
    
    # Verify project ownership
    project_data = Project.find_by_id(design_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    try:
        design_service = DesignService()
        
        # Get materials as markdown
        materials_data = Material.find_by_project(project_data.get('_id'))
        materials_md = "Description of Goods | HSN/SAC | Qty | Unit\n"
        materials_md += ":---|:---|:---|:---\n"
        for m in materials_data:
            materials_md += f"{m.get('description')} | {m.get('hsn_sac')} | {m.get('quantity')} | {m.get('unit')}\n"
        
        # Load generated image from Cloudinary URL
        generated_image = None
        if design_data.get('generated_image_url'):
            try:
                response = requests.get(design_data.get('generated_image_url'))
                generated_image = PILImage.open(BytesIO(response.content))
            except Exception as e:
                print(f"Failed to load generated image: {e}")
        
        result = design_service.generate_execution_plan(
            materials_md,
            project_data.get('name'),
            generated_image
        )
        
        if not result['success']:
            return jsonify({'error': result['error']}), 500
        
        # Save execution plan
        execution_plan_data = {
            'project_id': project_data.get('_id'),
            'project_summary': result['plan_data'].get('project_summary', ''),
            'total_duration': result['plan_data'].get('time_required', {}).get('Total Duration', ''),
            'phases_json': str(result['plan_data'].get('phases', [])),
            'labour_json': str(result['plan_data'].get('labour', [])),
            'material_usage_json': str(result['plan_data'].get('material_usage', [])),
            'site_notes': '\n'.join(result['plan_data'].get('site_notes', []))
        }
        
        # Delete existing execution plan if any
        existing_plan = ExecutionPlan.find_by_project(project_data.get('_id'))
        if existing_plan:
            ExecutionPlan.delete_by_project(project_data.get('_id'))
        
        ExecutionPlan.create(execution_plan_data)
        
        return jsonify({
            'message': 'Execution plan generated successfully',
            'plan': result['plan_data']
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@design_bp.route('/project/<string:project_id>', methods=['GET'])
@jwt_required()
def get_project_designs(project_id):
    user_id = get_jwt_identity()
    project_data = Project.find_by_id(project_id)
    
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404
    
    designs_data = Design.find_by_project(project_id)
    
    return jsonify([Design(d).to_dict() for d in designs_data]), 200
