# Interior Design System

A comprehensive full-stack interior design and planning system that enhances visualization, decision-making, and execution efficiency. This system integrates AI-powered design generation, material procurement, project planning, and supplier management into a unified platform.

## Features

### Core Objectives

- **AI-Powered Design Generation**: Generate accurate interior designs from room images using Google Gemini AI
- **Material Quantity Estimation**: Automatically calculate detailed material requirements with quantities
- **Execution Planning**: Generate comprehensive work plans with timelines, phases, and labor requirements
- **Role-Based Access**: Support for Admin, User, and Supplier roles with specific functionalities
- **Supplier Bidding System**: Enable suppliers to bid on materials and manage their catalogs
- **Project Monitoring**: Real-time dashboards for tracking project progress, inventory, and supplier interactions
- **AR Visualization**: Augmented Reality module for visualizing designs in physical spaces (placeholder)

### Key Features

- **Image Upload & Design Generation**: Upload room images and receive AI-generated interior designs
- **Materials Dashboard**: View detailed material lists with quantities, HSN/SAC codes, and cost estimates
- **Execution Plans**: Comprehensive phase-wise work plans with dependencies and timelines
- **Supplier Portal**: Suppliers can view material requirements, place bids, and manage their product catalogs
- **Project Management**: Create, track, and manage multiple interior design projects
- **Progress Tracking**: Monitor project progress through milestones and material status

## Technology Stack

### Backend
- **Framework**: Flask 3.0.0
- **Database**: SQLAlchemy (SQLite default, configurable to PostgreSQL/MySQL)
- **Authentication**: Flask-JWT-Extended
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **Image Processing**: Pillow (PIL)

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns

## Project Structure

```
interior-design-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # Database models
│   │   ├── routes/              # API route blueprints
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── projects.py      # Project management
│   │   │   ├── design.py        # Design generation
│   │   │   ├── suppliers.py     # Supplier management
│   │   │   └── dashboard.py     # Dashboard analytics
│   │   ├── services/            # Business logic
│   │   │   └── design_service.py # AI design generation service
│   │   └── utils/               # Utilities
│   │       └── markdown_parser.py # Markdown to JSON parser
│   ├── uploads/                 # Uploaded room images
│   ├── outputs/                 # Generated designs
│   ├── instance/                # Database instance
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variables template
│   └── run.py                   # Flask application entry point
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ui/              # Reusable UI components
    │   ├── pages/               # Page components
    │   ├── services/            # API service layer
    │   ├── utils/               # Utility functions
    │   ├── App.jsx              # Main app with routing
    │   └── index.css            # Global styles
    ├── package.json             # Node dependencies
    ├── tailwind.config.js       # Tailwind configuration
    └── vite.config.js           # Vite configuration
```

## Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- Google Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```

5. Edit `.env` and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
DATABASE_URL=sqlite:///interior_design.db
FLASK_ENV=development
```

6. Run the Flask application:
```bash
python run.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Run the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

### User Registration & Login

1. Navigate to `http://localhost:5173`
2. Click "Register" to create a new account
3. Select your role (User, Supplier, or Admin)
4. Fill in the required information
5. Login with your credentials

### Creating a Project

1. After login, you'll be redirected to the Dashboard
2. Click "New Project" or navigate to Projects
3. Fill in project details (name, description, room type, budget)
4. Click "Create"

### Generating Interior Designs

1. Open a project from the Projects list
2. Click "Generate Design" button
3. Upload a room image (empty room photo)
4. Enter a design prompt (e.g., "Transform this room into a modern minimalist living room")
5. Click "Generate Design"
6. The AI will generate:
   - Transformed room image
   - Material list with quantities
   - Execution plan (click "Generate Execution Plan" on the design)

### Managing Materials

- View all required materials in the project detail page
- Materials include descriptions, quantities, units, and HSN/SAC codes
- Cost estimates are calculated based on supplier bids

### Supplier Bidding

1. Login as a Supplier
2. Navigate to Supplier Portal from Dashboard
3. View materials requiring bids
4. Place bids with price and delivery estimates
5. Add products to your catalog

### AR Visualization

1. Generate at least one design for a project
2. Click "AR View" button in project detail
3. This module is a placeholder for future AR implementation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/milestones` - Get project milestones
- `POST /api/projects/:id/milestones` - Create milestone

### Design
- `POST /api/design/generate` - Generate interior design
- `GET /api/design/image/:id` - Get generated design image
- `POST /api/design/:id/execution-plan` - Generate execution plan
- `GET /api/design/project/:id` - Get project designs

### Suppliers
- `GET /api/suppliers/materials` - Get materials for bidding
- `POST /api/suppliers/bid` - Place bid on material
- `GET /api/suppliers/bids/:materialId` - Get material bids
- `POST /api/suppliers/bid/:bidId/accept` - Accept bid
- `POST /api/suppliers/catalog` - Add to catalog
- `GET /api/suppliers/catalog` - Get catalog

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard statistics
- `GET /api/dashboard/project/:id/details` - Get project details
- `GET /api/dashboard/project/:id/progress` - Get project progress

## Database Models

### User
- id, email, password_hash, name, role, company_name, phone, created_at

### Project
- id, user_id, name, description, room_type, budget, status, progress, created_at, updated_at

### Design
- id, project_id, original_image_path, generated_image_path, prompt, created_at

### Material
- id, project_id, description, hsn_sac, quantity, unit, estimated_cost, category, status

### ExecutionPlan
- id, project_id, total_duration, project_summary, phases_json, labour_json, material_usage_json, site_notes

### Milestone
- id, project_id, name, description, target_date, status, completed_at

### Bid
- id, material_id, supplier_id, price, estimated_delivery_days, notes, status

### Catalog
- id, supplier_id, product_name, description, category, price, image_url, specifications, available

## Environment Variables

- `GEMINI_API_KEY`: Google Gemini API key for AI generation
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `DATABASE_URL`: Database connection string
- `FLASK_ENV`: Environment (development/production)

## Future Enhancements

- Full AR implementation with WebXR
- 3D model generation from 2D designs
- Real-time collaboration features
- Mobile application
- Payment gateway integration
- Advanced analytics and reporting
- Multi-language support
- Dark mode
- Export designs to various formats (PDF, CAD)

## Contributing

This is a project for educational and demonstration purposes. Feel free to fork and modify as needed.

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please refer to the code documentation or create an issue in the repository.
