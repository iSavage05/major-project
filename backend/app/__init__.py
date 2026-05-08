from flask import Flask, request, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_pymongo import PyMongo
from datetime import datetime, timedelta
import os
import cloudinary
import cloudinary.uploader

mongo = PyMongo()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
    mongo_uri = os.environ.get('MONGO_URI', '')
    if not mongo_uri:
        print("WARNING: MONGO_URI is not set. Please set it in the .env file or as an environment variable.")
        print("Example: MONGO_URI=mongodb://localhost:27017/interior_design")
    app.config['MONGO_URI'] = mongo_uri or 'mongodb://localhost:27017/interior_design'
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    app.config['OUTPUT_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'outputs')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # Configure Cloudinary
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )
    
    # Disable strict trailing slash to avoid 308 redirects
    app.url_map.strict_slashes = False
    
    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], max_age=600)
    
    # Create directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.design import design_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.dashboard import dashboard_bp
    
    # Handle OPTIONS requests before routing to avoid 308 redirects
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = Response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Max-Age'] = '600'
            return response
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(design_bp, url_prefix='/api/design')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    
    return app
