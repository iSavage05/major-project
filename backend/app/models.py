from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from app import mongo

class User:
    collection = mongo.db.users
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.email = data.get('email')
            self.password_hash = data.get('password_hash')
            self.name = data.get('name')
            self.role = data.get('role')
            self.company_name = data.get('company_name')
            self.phone = data.get('phone')
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['created_at'] = datetime.utcnow()
        result = User.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_email(email):
        return User.collection.find_one({'email': email})
    
    @staticmethod
    def find_by_id(user_id):
        return User.collection.find_one({'_id': ObjectId(user_id)})
    
    @staticmethod
    def find_all(role=None):
        query = {}
        if role:
            query['role'] = role
        return list(User.collection.find(query))
    
    @staticmethod
    def update(user_id, data):
        User.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': data}
        )
    
    @staticmethod
    def delete(user_id):
        User.collection.delete_one({'_id': ObjectId(user_id)})
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'company_name': self.company_name,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Project:
    collection = mongo.db.projects
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.user_id = data.get('user_id')
            self.name = data.get('name')
            self.description = data.get('description')
            self.room_type = data.get('room_type')
            self.budget = data.get('budget')
            self.status = data.get('status', 'pending')
            self.progress = data.get('progress', 0)
            self.created_at = data.get('created_at', datetime.utcnow())
            self.updated_at = data.get('updated_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        result = Project.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_id(project_id):
        return Project.collection.find_one({'_id': ObjectId(project_id)})
    
    @staticmethod
    def find_by_user(user_id):
        return list(Project.collection.find({'user_id': user_id}).sort('created_at', -1))
    
    @staticmethod
    def find_all():
        return list(Project.collection.find().sort('created_at', -1))
    
    @staticmethod
    def update(project_id, data):
        data['updated_at'] = datetime.utcnow()
        Project.collection.update_one(
            {'_id': ObjectId(project_id)},
            {'$set': data}
        )
    
    @staticmethod
    def delete(project_id):
        # Delete related documents
        Design.delete_by_project(project_id)
        Material.delete_by_project(project_id)
        ExecutionPlan.delete_by_project(project_id)
        Milestone.delete_by_project(project_id)
        Project.collection.delete_one({'_id': ObjectId(project_id)})
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'room_type': self.room_type,
            'budget': self.budget,
            'status': self.status,
            'progress': self.progress,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }

class Design:
    collection = mongo.db.designs
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.project_id = data.get('project_id')
            self.original_image_url = data.get('original_image_url', data.get('original_image_path'))
            self.generated_image_url = data.get('generated_image_url', data.get('generated_image_path'))
            self.prompt = data.get('prompt')
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['created_at'] = datetime.utcnow()
        result = Design.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_project(project_id):
        return list(Design.collection.find({'project_id': project_id}).sort('created_at', -1))
    
    @staticmethod
    def find_by_id(design_id):
        return Design.collection.find_one({'_id': ObjectId(design_id)})
    
    @staticmethod
    def delete_by_project(project_id):
        Design.collection.delete_many({'project_id': project_id})
    
    @staticmethod
    def delete(design_id):
        Design.collection.delete_one({'_id': ObjectId(design_id)})
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'original_image_url': self.original_image_url,
            'generated_image_url': self.generated_image_url,
            'prompt': self.prompt,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Material:
    collection = mongo.db.materials
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.project_id = data.get('project_id')
            self.description = data.get('description')
            self.hsn_sac = data.get('hsn_sac')
            self.quantity = data.get('quantity')
            self.unit = data.get('unit')
            self.estimated_cost = data.get('estimated_cost')
            self.category = data.get('category')
            self.status = data.get('status', 'pending')
    
    @staticmethod
    def create(data):
        data['status'] = data.get('status', 'pending')
        result = Material.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_project(project_id):
        return list(Material.collection.find({'project_id': project_id}))
    
    @staticmethod
    def find_by_id(material_id):
        return Material.collection.find_one({'_id': ObjectId(material_id)})
    
    @staticmethod
    def find_all():
        return list(Material.collection.find())
    
    @staticmethod
    def delete_by_project(project_id):
        Material.collection.delete_many({'project_id': project_id})
    
    @staticmethod
    def update(material_id, data):
        Material.collection.update_one(
            {'_id': ObjectId(material_id)},
            {'$set': data}
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'description': self.description,
            'hsn_sac': self.hsn_sac,
            'quantity': self.quantity,
            'unit': self.unit,
            'estimated_cost': self.estimated_cost,
            'category': self.category,
            'status': self.status
        }

class ExecutionPlan:
    collection = mongo.db.execution_plans
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.project_id = data.get('project_id')
            self.total_duration = data.get('total_duration')
            self.project_summary = data.get('project_summary')
            self.phases_json = data.get('phases_json')
            self.labour_json = data.get('labour_json')
            self.material_usage_json = data.get('material_usage_json')
            self.site_notes = data.get('site_notes')
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['created_at'] = datetime.utcnow()
        result = ExecutionPlan.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_project(project_id):
        return ExecutionPlan.collection.find_one({'project_id': project_id})
    
    @staticmethod
    def find_by_id(plan_id):
        return ExecutionPlan.collection.find_one({'_id': ObjectId(plan_id)})
    
    @staticmethod
    def delete_by_project(project_id):
        ExecutionPlan.collection.delete_many({'project_id': project_id})
    
    @staticmethod
    def update(plan_id, data):
        ExecutionPlan.collection.update_one(
            {'_id': ObjectId(plan_id)},
            {'$set': data}
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'total_duration': self.total_duration,
            'project_summary': self.project_summary,
            'phases_json': self.phases_json,
            'labour_json': self.labour_json,
            'material_usage_json': self.material_usage_json,
            'site_notes': self.site_notes,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Milestone:
    collection = mongo.db.milestones
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.project_id = data.get('project_id')
            self.name = data.get('name')
            self.description = data.get('description')
            self.target_date = data.get('target_date')
            self.status = data.get('status', 'pending')
            self.completed_at = data.get('completed_at')
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['status'] = data.get('status', 'pending')
        data['created_at'] = datetime.utcnow()
        result = Milestone.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_project(project_id):
        return list(Milestone.collection.find({'project_id': project_id}).sort('target_date', 1))
    
    @staticmethod
    def find_by_id(milestone_id):
        return Milestone.collection.find_one({'_id': ObjectId(milestone_id)})
    
    @staticmethod
    def delete_by_project(project_id):
        Milestone.collection.delete_many({'project_id': project_id})
    
    @staticmethod
    def update(milestone_id, data):
        Milestone.collection.update_one(
            {'_id': ObjectId(milestone_id)},
            {'$set': data}
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'target_date': self.target_date.isoformat() if isinstance(self.target_date, datetime) else self.target_date,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if isinstance(self.completed_at, datetime) else self.completed_at,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Supplier:
    collection = mongo.db.suppliers
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.user_id = data.get('user_id')
            self.company_name = data.get('company_name')
            self.specialization = data.get('specialization')
            self.rating = data.get('rating', 0.0)
            self.total_orders = data.get('total_orders', 0)
            self.verified = data.get('verified', False)
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['rating'] = data.get('rating', 0.0)
        data['total_orders'] = data.get('total_orders', 0)
        data['verified'] = data.get('verified', False)
        data['created_at'] = datetime.utcnow()
        result = Supplier.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_user(user_id):
        return Supplier.collection.find_one({'user_id': user_id})
    
    @staticmethod
    def find_by_id(supplier_id):
        return Supplier.collection.find_one({'_id': ObjectId(supplier_id)})
    
    @staticmethod
    def find_all():
        return list(Supplier.collection.find())
    
    @staticmethod
    def update(supplier_id, data):
        Supplier.collection.update_one(
            {'_id': ObjectId(supplier_id)},
            {'$set': data}
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'specialization': self.specialization,
            'rating': self.rating,
            'total_orders': self.total_orders,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Bid:
    collection = mongo.db.bids
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.material_id = data.get('material_id')
            self.supplier_id = data.get('supplier_id')
            self.price = data.get('price')
            self.estimated_delivery_days = data.get('estimated_delivery_days')
            self.notes = data.get('notes')
            self.status = data.get('status', 'pending')
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['status'] = data.get('status', 'pending')
        data['created_at'] = datetime.utcnow()
        result = Bid.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_material(material_id):
        return list(Bid.collection.find({'material_id': material_id}))
    
    @staticmethod
    def find_by_supplier(supplier_id):
        return list(Bid.collection.find({'supplier_id': supplier_id}))
    
    @staticmethod
    def find_by_id(bid_id):
        return Bid.collection.find_one({'_id': ObjectId(bid_id)})
    
    @staticmethod
    def find_all():
        return list(Bid.collection.find())
    
    @staticmethod
    def update(bid_id, data):
        Bid.collection.update_one(
            {'_id': ObjectId(bid_id)},
            {'$set': data}
        )
    
    def to_dict(self):
        return {
            'id': self.id,
            'material_id': self.material_id,
            'supplier_id': self.supplier_id,
            'price': self.price,
            'estimated_delivery_days': self.estimated_delivery_days,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

class Catalog:
    collection = mongo.db.catalogs
    
    def __init__(self, data=None):
        if data:
            self.id = str(data.get('_id', ''))
            self.supplier_id = data.get('supplier_id')
            self.product_name = data.get('product_name')
            self.description = data.get('description')
            self.category = data.get('category')
            self.price = data.get('price')
            self.image_url = data.get('image_url')
            self.specifications = data.get('specifications')
            self.available = data.get('available', True)
            self.created_at = data.get('created_at', datetime.utcnow())
    
    @staticmethod
    def create(data):
        data['available'] = data.get('available', True)
        data['created_at'] = datetime.utcnow()
        result = Catalog.collection.insert_one(data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_by_supplier(supplier_id):
        return list(Catalog.collection.find({'supplier_id': supplier_id}))
    
    @staticmethod
    def find_by_id(catalog_id):
        return Catalog.collection.find_one({'_id': ObjectId(catalog_id)})
    
    @staticmethod
    def find_all():
        return list(Catalog.collection.find())
    
    @staticmethod
    def update(catalog_id, data):
        Catalog.collection.update_one(
            {'_id': ObjectId(catalog_id)},
            {'$set': data}
        )
    
    @staticmethod
    def delete(catalog_id):
        Catalog.collection.delete_one({'_id': ObjectId(catalog_id)})
    
    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'product_name': self.product_name,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'image_url': self.image_url,
            'specifications': self.specifications,
            'available': self.available,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
