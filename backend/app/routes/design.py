from flask import Blueprint, request, jsonify, current_app, url_for, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
import requests
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

def save_materials_for_design(project_id, design_id, materials):
    """Persist parsed material rows for a newly generated design."""
    for material_data in materials:
        category = material_data.get('category', 'other')
        category = category.lower().strip() if category else 'other'

        material_data_dict = {
            'project_id': project_id,
            'design_id': design_id,
            'description': material_data.get('description_of_goods', ''),
            'hsn_sac': material_data.get('hsn_sac', ''),
            'quantity': material_data.get('qty', 0),
            'unit': material_data.get('unit', ''),
            'category': category
        }
        Material.create(material_data_dict)

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
    design_name = request.form.get('design_name', 'Untitled Design')
    
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
            status_code = 400 if result.get('code') == 'invalid_prompt' else 500
            return jsonify({'error': result['error']}), status_code
        
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
            'design_name': design_name,
            'original_image_url': original_image_url,
            'generated_image_url': generated_image_url,
            'prompt': prompt
        }
        design_id = Design.create(design_data)
        
        save_materials_for_design(project_id, design_id, result['materials'])
        
        return jsonify({
            'message': 'Design generated successfully',
            'design_id': design_id,
            'materials': result['materials'],
            'generated_image': generated_image_url
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@design_bp.route('/<string:design_id>/alternate', methods=['POST'])
@jwt_required()
def generate_alternate_design(design_id):
    """
    Generate an alternate design from an existing generated design.

    The current generated image is used as the new source image, while the
    existing prompt and user's alternate prompt are combined for continuity.
    """
    user_id = get_jwt_identity()
    design_data = Design.find_by_id(design_id)

    if not design_data:
        return jsonify({'error': 'Design not found'}), 404

    project_data = Project.find_by_id(design_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Project not found'}), 404

    data = request.get_json(silent=True) or {}
    alternate_prompt = (data.get('prompt') or '').strip()
    if not alternate_prompt:
        return jsonify({'error': 'prompt is required'}), 400

    source_image_url = design_data.get('generated_image_url') or design_data.get('generated_image_path')
    if not source_image_url:
        return jsonify({'error': 'Selected design does not have a generated image'}), 400
    if source_image_url.startswith('/'):
        source_image_url = request.host_url.rstrip('/') + source_image_url

    design_name = (
        data.get('design_name')
        or f"{design_data.get('design_name', 'Untitled Design')} - Alternate"
    )

    try:
        design_service = DesignService()
        result = design_service.generate_alternate_design_from_url(
            source_image_url,
            design_data.get('prompt') or '',
            alternate_prompt
        )

        if not result['success']:
            status_code = 400 if result.get('code') == 'invalid_prompt' else 500
            return jsonify({'error': result['error']}), status_code

        output_buffer = BytesIO()
        result['transformed_image'].save(output_buffer, format='PNG')
        output_buffer.seek(0)

        generated_upload_result = cloudinary.uploader.upload(
            output_buffer,
            folder='interior_design/generated',
            resource_type='image'
        )
        generated_image_url = generated_upload_result['secure_url']

        new_design_data = {
            'project_id': str(project_data.get('_id')),
            'design_name': design_name,
            'original_image_url': source_image_url,
            'generated_image_url': generated_image_url,
            'prompt': result.get('final_prompt') or alternate_prompt,
            'parent_design_id': design_id,
            'alternate_prompt': alternate_prompt
        }
        new_design_id = Design.create(new_design_data)
        save_materials_for_design(str(project_data.get('_id')), new_design_id, result['materials'])

        return jsonify({
            'message': 'Alternate design generated successfully',
            'design_id': new_design_id,
            'source_design_id': design_id,
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
        
        # Get ALL materials for this design
        design_materials = Material.find_by_design(design_id)
        
        if not design_materials:
            return jsonify({'error': 'No materials found for this design'}), 400
        
        # Create materials markdown with ALL materials (all categories)
        materials_md = "Description of Goods | HSN/SAC | Qty | Unit | Category\n"
        materials_md += ":---|:---|:---|:---|:---\n"
        for m in design_materials:
            materials_md += f"{m.get('description')} | {m.get('hsn_sac')} | {m.get('quantity')} | {m.get('unit')} | {m.get('category', 'other')}\n"
        
        # Load generated image from Cloudinary URL
        generated_image = None
        if design_data.get('generated_image_url'):
            try:
                response = requests.get(design_data.get('generated_image_url'))
                generated_image = PILImage.open(BytesIO(response.content))
            except Exception as e:
                print(f"Failed to load generated image: {e}")
        
        # Generate SINGLE execution plan for the entire design
        result = design_service.generate_execution_plan(
            materials_md,
            project_data.get('name'),
            generated_image
        )
        
        if not result['success']:
            return jsonify({'error': result.get('error', 'Failed to generate execution plan')}), 500
        
        # Delete any existing execution plans for this design
        ExecutionPlan.delete_by_design(str(design_id))
        
        # Get category breakdown from the AI result
        category_breakdown = result['plan_data'].get('categories', [])
        
        # If AI didn't provide categories, calculate from labour data
        if not category_breakdown:
            labour_data = result['plan_data'].get('labour', [])
            total_days = 0
            for worker in labour_data:
                try:
                    days = float(worker.get('days required', '0') or worker.get('Days Required', '0'))
                    total_days += days
                except:
                    pass
            
            # Create a single category entry for the whole design
            category_breakdown = [{
                'category': 'general',
                'days': total_days,
                'labour_count': len(labour_data)
            }]
        
        # Calculate total days from all categories
        total_calculated_days = sum(cat.get('days', 0) for cat in category_breakdown)
        
        # Save SINGLE execution plan for the design
        execution_plan_data = {
            'project_id': str(project_data.get('_id')),
            'design_id': str(design_id),
            'project_summary': result['plan_data'].get('project_summary', ''),
            'total_duration': result['plan_data'].get('time_required', {}).get('Total Duration', f'{total_calculated_days} days'),
            'phases_json': str(result['plan_data'].get('phases', [])),
            'labour_json': str(result['plan_data'].get('labour', [])),
            'category_json': str(category_breakdown),
            'material_usage_json': str(result['plan_data'].get('material_usage', [])),
            'site_notes': '\n'.join(result['plan_data'].get('site_notes', []))
        }
        
        plan_id = ExecutionPlan.create(execution_plan_data)
        
        return jsonify({
            'message': 'Execution plan generated successfully',
            'plan': {
                'id': plan_id,
                'categories': [cat['category'] for cat in category_breakdown],
                'total_duration': f'{total_calculated_days} days',
                'category_count': len(category_breakdown)
            }
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


@design_bp.route('/execution-plan/<string:plan_id>', methods=['GET'])
@jwt_required()
def get_execution_plan(plan_id):
    """Get execution plan details with parsed phases and labour data"""
    user_id = get_jwt_identity()
    
    plan_data = ExecutionPlan.find_by_id(plan_id)
    if not plan_data:
        return jsonify({'error': 'Execution plan not found'}), 404
    
    # Verify project ownership
    project_data = Project.find_by_id(plan_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    plan = ExecutionPlan(plan_data)
    plan_dict = plan.to_dict()
    
    # Parse phases_json to actual array
    try:
        plan_dict['phases'] = eval(plan_dict.get('phases_json', '[]'))
    except:
        plan_dict['phases'] = []
    
    # Parse labour_json to actual array and calculate total duration
    labour_data = []
    total_labour_days = 0
    try:
        labour_raw = plan_dict.get('labour_json', '[]')
        if labour_raw and labour_raw != '[]':
            labour_data = eval(labour_raw)
            # Calculate total days from all labour roles
            for worker in labour_data:
                days_str = worker.get('days required', '0')
                try:
                    days = float(days_str)
                    total_labour_days += days
                except:
                    pass
    except:
        labour_data = []
    
    plan_dict['labour'] = labour_data
    plan_dict['total_labour_days'] = total_labour_days
    plan_dict['calculated_duration'] = f"{total_labour_days} days"
    
    return jsonify(plan_dict), 200


@design_bp.route('/execution-plan/<string:plan_id>/progress', methods=['POST'])
@jwt_required()
def log_execution_progress(plan_id):
    """Log progress entry for execution plan"""
    user_id = get_jwt_identity()
    
    plan_data = ExecutionPlan.find_by_id(plan_id)
    if not plan_data:
        return jsonify({'error': 'Execution plan not found'}), 404
    
    # Verify project ownership
    project_data = Project.find_by_id(plan_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.form if request.form else request.get_json(silent=True) or {}
    days_logged = data.get('days_logged')
    description = data.get('description')
    phase = data.get('phase')

    if days_logged is None or days_logged == '' or not description:
        return jsonify({'error': 'days_logged and description are required'}), 400

    try:
        days_logged_value = float(days_logged)
    except ValueError:
        return jsonify({'error': 'days_logged must be a number'}), 400

    # Create log entry
    log_entry = {
        'days_logged': days_logged_value,
        'description': description,
        'phase': phase,
        'logged_by': user_id
    }
    
    # Add progress image if provided
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({'error': 'Invalid image type. Allowed types: png, jpg, jpeg, webp'}), 400

            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            progress_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'progress')
            os.makedirs(progress_dir, exist_ok=True)
            file_path = os.path.join(progress_dir, unique_filename)
            file.save(file_path)

            image_url = url_for('design.uploaded_file', filename=f'progress/{unique_filename}', _external=True)
            log_entry['image_url'] = image_url

    # Add progress log
    ExecutionPlan.add_progress_log(plan_id, log_entry)
    
    return jsonify({
        'message': 'Progress logged successfully',
        'log_entry': log_entry
    }), 201


@design_bp.route('/uploads/<path:filename>', methods=['GET'])
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)


@design_bp.route('/execution-plan/<string:plan_id>/progress', methods=['GET'])
@jwt_required()
def get_execution_progress(plan_id):
    """Get all progress logs for execution plan"""
    user_id = get_jwt_identity()
    
    plan_data = ExecutionPlan.find_by_id(plan_id)
    if not plan_data:
        return jsonify({'error': 'Execution plan not found'}), 404
    
    # Verify project ownership
    project_data = Project.find_by_id(plan_data.get('project_id'))
    if not project_data or project_data.get('user_id') != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    plan = ExecutionPlan(plan_data)
    progress_logs = plan.progress_logs or []
    
    # Calculate total progress
    total_days_logged = sum(log.get('days_logged', 0) for log in progress_logs)
    
    # Parse total_duration to extract days
    total_duration_str = plan.total_duration or '0 days'
    try:
        total_days = int(total_duration_str.split()[0]) if total_duration_str.split()[0].isdigit() else 0
    except:
        total_days = 0
    
    progress_percentage = min(100, (total_days_logged / total_days * 100)) if total_days > 0 else 0
    
    return jsonify({
        'progress_logs': progress_logs,
        'total_days_logged': total_days_logged,
        'total_days_planned': total_days,
        'progress_percentage': round(progress_percentage, 1)
    }), 200
