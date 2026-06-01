# AI-Powered Interior Design System: A Comprehensive Approach to Automated Space Planning and Material Management

**Author Name**  
Department of Computer Science, University Name, City, Country  
email@example.com

## Abstract

The interior design industry has traditionally relied heavily on manual processes, from initial conceptualization to material procurement and project execution. This paper presents the development and implementation of a comprehensive full-stack interior design system that leverages artificial intelligence to automate and streamline various aspects of the design workflow. Our system integrates Google's Gemini AI for design generation, material quantity estimation, and execution planning, while providing a robust platform for project management, supplier coordination, and progress tracking. Through a combination of modern web technologies and machine learning capabilities, we demonstrate how AI can significantly reduce the time and effort required for interior design projects while improving accuracy and decision-making. The system's architecture, implementation details, and practical applications are discussed in depth, along with challenges encountered and future enhancement possibilities.

**Keywords:** Interior design, artificial intelligence, web development, material estimation, project management, supplier coordination.

## I. Introduction

### A. Overview
Interior design, as a discipline, has evolved significantly over the past decade. What was once a purely artistic endeavor has increasingly incorporated technological tools to enhance efficiency, accuracy, and client satisfaction. The integration of digital tools has transformed how designers conceptualize spaces, communicate with clients, and manage projects. However, despite these technological advancements, many fundamental aspects of interior design workflows remain labor-intensive and prone to human error.

### B. Problem Statement
The interior design industry faces several critical challenges that hinder efficiency and accuracy. Material estimation often relies on experience-based approximations that can lead to costly overages or shortages. Project planning and execution schedules frequently suffer from inadequate consideration of dependencies between different work phases, resulting in delays and budget overruns. Additionally, the disconnect between design concepts and practical execution means that many beautiful designs exist on paper but prove difficult or impossible to implement within reasonable timeframes or budgets. Clients also struggle to visualize design concepts and understand project timelines, leading to miscommunication and dissatisfaction.

### C. Motivation
The motivation behind this project stems from firsthand observations of these inefficiencies in practice. Contractors and designers often spend considerable time on repetitive tasks that could be automated, such as material calculation, scheduling, and documentation. Clients frequently express frustration with the inability to see realistic visualizations of proposed designs before committing to expensive implementations. There exists a clear opportunity to leverage recent advances in artificial intelligence, particularly in computer vision and natural language processing, to address these pain points and transform the interior design workflow.

### D. Purpose
The primary purpose of this research is to develop and implement a comprehensive AI-powered interior design system that automates and streamlines various aspects of the design workflow. The system aims to reduce the time and expertise required for interior design projects while improving accuracy, transparency, and decision-making. By integrating modern web technologies with machine learning capabilities, this project seeks to demonstrate how AI can significantly enhance the interior design process from conceptualization to execution.

### E. Proposed Solution
Our approach centers on creating an integrated platform that handles the entire lifecycle of an interior design project. The proposed system includes:
- AI-powered design generation from room images using Google's Gemini AI
- Automatic material quantity estimation with HSN/SAC codes for the Indian market
- Comprehensive execution planning with phase-wise work schedules and labour requirements
- Supplier management and bidding system for material procurement
- Project tracking and progress monitoring dashboards
- Role-based access control for administrators, users, and suppliers

By automating these processes, we aim to reduce the cognitive load on designers and contractors, minimize material wastage through accurate estimation, and provide clients with transparent, data-driven project insights.

### F. System Architecture Overview
The system follows a classic three-tier architecture with clear separation of concerns between presentation, business logic, and data persistence layers. The frontend, built with React 19 and Vite, provides a responsive and intuitive user interface that caters to different user roles. The backend, implemented using Flask 3.0.0, serves as the API layer that handles authentication, business logic, and integration with external services including Google's Gemini AI and Cloudinary for image storage. MongoDB was chosen as the database solution due to its flexible schema design, which proved particularly valuable during development as the data model evolved based on practical requirements.

### G. Expected Outcomes
The successful implementation of this system is expected to yield several significant outcomes:
- Reduction in time required for design generation and material estimation by approximately 70%
- Improved accuracy in material quantity calculations, reducing wastage and cost overruns
- Enhanced client satisfaction through better visualization and transparent project timelines
- Streamlined supplier coordination and bidding processes
- Comprehensive project tracking capabilities that enable real-time progress monitoring
- A scalable architecture that can accommodate future enhancements and additional features

### H. Organisation of the Report
This report is organized as follows: Section II presents a literature survey covering AI applications in interior design, related work in design automation, material estimation techniques, and project management systems. Section III describes the system architecture and technology stack selection. Section IV details the core functionality implementation, including AI-powered design generation, material estimation, execution planning, and supplier management. Section V discusses the database design and data models. Section VI covers frontend implementation details. Section VII addresses the challenges encountered during development and their solutions. Section VIII examines performance considerations. Section IX outlines security measures. Section X describes user experience and interface design. Section XI covers testing and quality assurance. Section XII discusses limitations and future work. Section XIII provides conclusions and final remarks.

### I. Summary
This chapter has introduced the AI-powered interior design system, outlining the problem statement, motivation, purpose, and proposed solution. The system addresses critical inefficiencies in traditional interior design workflows through AI automation, comprehensive material estimation, execution planning, and supplier coordination. The three-tier architecture, leveraging modern web technologies and Google's Gemini AI, provides a solid foundation for the detailed implementation discussions that follow in subsequent chapters.

## II. Literature Survey

### A. Overview of AI in Interior Design
The integration of artificial intelligence in interior design represents a rapidly evolving field that combines computer vision, natural language processing, and generative models to transform traditional design workflows. Early applications of AI in design focused primarily on computer-aided design (CAD) automation and parametric modeling. However, recent advances in deep learning and generative AI have opened new possibilities for automated design generation, material optimization, and project management.

### B. Related Work in Design Automation
Several research efforts have explored automated design generation using various approaches. Traditional methods relied on rule-based systems and expert systems that encoded design principles and constraints. These systems, while effective for specific domains, lacked flexibility and struggled with creative aspects of design. More recent approaches have employed genetic algorithms and evolutionary computation to explore design spaces, though these methods often require significant computational resources and domain-specific fitness functions.

The emergence of neural networks, particularly generative adversarial networks (GANs) and variational autoencoders (VAEs), has enabled more sophisticated design generation. These approaches learn from existing design datasets and can generate novel designs that respect learned patterns and styles. However, they often require large training datasets and may produce designs that lack practical feasibility or user-specific customization.

### C. Material Estimation Techniques
Material estimation has traditionally been a manual process relying on experience and rule-of-thumb calculations. Early computational approaches used spreadsheet-based templates and simple formulas to estimate quantities based on room dimensions and standard material requirements. More advanced systems have incorporated building information modeling (BIM) to extract material quantities directly from 3D models.

Recent research has explored machine learning approaches for material estimation, using historical project data to predict material requirements based on project characteristics. These systems can improve accuracy over time but require substantial training data and may not generalize well to novel design approaches or regional variations in construction practices.

### D. Project Management Systems
Project management in interior design and construction has seen significant digital transformation. Traditional project management tools like Gantt charts and critical path methods have been enhanced with digital collaboration platforms, real-time progress tracking, and mobile applications. Modern systems integrate scheduling, resource allocation, and progress monitoring into unified platforms.

However, most existing project management systems treat design and execution as separate phases, lacking the integration needed for seamless workflow from conceptualization to completion. Few systems incorporate AI-driven insights or automated planning capabilities, leaving significant opportunity for innovation.

### E. AI Applications in Construction and Interior Design
AI applications in construction and interior design have expanded beyond design generation to include quality control, safety monitoring, and predictive maintenance. Computer vision systems can monitor construction sites for safety compliance and progress tracking. Natural language processing enables automated document analysis and contract review.

In interior design specifically, AI has been applied to space planning optimization, furniture arrangement, and color scheme generation. Virtual reality and augmented reality technologies have enhanced visualization capabilities, though these often require expensive hardware and specialized expertise.

### F. Gaps in Existing Solutions
Despite significant advancements in individual technologies, several gaps remain in integrated interior design systems. Most existing solutions focus on specific aspects of the workflow—design generation, material estimation, or project management—rather than providing an end-to-end solution. The integration between these phases remains manual and error-prone.

Additionally, many existing AI-powered design tools prioritize visual appeal over practical feasibility, generating designs that may be difficult or impossible to execute within real-world constraints. Material estimation systems often lack the context of specific design choices, leading to inaccurate estimates. Project management tools typically don't incorporate AI-driven insights or automated planning capabilities.

The proposed system addresses these gaps by providing an integrated platform that connects design generation, material estimation, execution planning, and project management into a cohesive workflow powered by AI.

## III. System Architecture

### A. Overall Design

The system follows a classic three-tier architecture with clear separation of concerns between presentation, business logic, and data persistence layers. This architectural choice was driven by the need for maintainability, scalability, and the ability to independently develop and deploy frontend and backend components.

The frontend, built with React 19 and Vite, provides a responsive and intuitive user interface that caters to different user roles—administrators, regular users (homeowners or designers), and suppliers. Each role has access to specific functionalities tailored to their needs, ensuring that the system remains focused and usable rather than overwhelming users with irrelevant features.

The backend, implemented using Flask 3.0.0, serves as the API layer that handles authentication, business logic, and integration with external services including Google's Gemini AI and Cloudinary for image storage. MongoDB was chosen as the database solution due to its flexible schema design, which proved particularly valuable during development as the data model evolved based on practical requirements.

### B. Technology Stack Selection

The selection of technologies for this project was guided by several considerations: development speed, community support, performance characteristics, and integration capabilities.

For the backend, Flask was selected over alternatives like Django or FastAPI primarily due to its lightweight nature and flexibility. The project didn't require the extensive built-in features that Django provides, and Flask's minimalistic approach allowed us to include only the components we actually needed. MongoDB, rather than a traditional relational database, was chosen because the data model involved nested structures (such as execution plans with phases, labour requirements, and material usage) that map naturally to document-oriented storage.

The frontend technology stack presented an interesting decision point. React 19, though relatively new at the time of development, offered compelling features including improved server-side rendering capabilities and better performance. Combined with Vite for build tooling, the development experience was significantly faster than with traditional Create React App setups. TailwindCSS was adopted for styling to accelerate UI development while maintaining design consistency.

The AI integration represents perhaps the most critical technology choice. Google's Gemini 2.5 Flash was selected over alternatives like OpenAI's GPT-4 or Midjourney for several reasons. First, Gemini's multimodal capabilities—its ability to process both images and text in a single API call—simplified the implementation significantly. Second, its cost structure made it more viable for a project that might generate numerous design iterations. Finally, Google's documentation and SDK for Python proved robust and well-maintained.

## IV. Core Functionality Implementation

### A. AI-Powered Design Generation

The design generation module represents the system's most innovative feature. When users upload an image of an empty or existing room along with a textual prompt describing their desired transformation, the system leverages Gemini AI to generate a visual representation of the proposed design.

The implementation process involves several steps. First, the uploaded image is stored in Cloudinary, a cloud-based image management service. This decision was made to avoid local storage limitations and to provide reliable CDN delivery for images. The Cloudinary URL is then passed to the design service, which downloads the image and feeds it to Gemini along with the user's prompt.

One challenge we encountered during implementation was ensuring consistent, high-quality outputs from the AI. Early iterations produced designs that, while visually appealing, often didn't align well with the user's prompt or the original room's constraints. We addressed this through prompt engineering—crafting detailed, specific prompts that guide the AI while still allowing creative freedom. The system now includes a sophisticated prompt template that incorporates context about the original room, the user's specific requirements, and practical constraints.

The generated design image is also stored in Cloudinary, and both the original and generated images are associated with the project in the database. This allows users to compare different design iterations and maintain a history of their exploration process.

### B. Material Quantity Estimation

Perhaps the most practically valuable feature of the system is its ability to automatically generate detailed material lists based on the AI-generated design. This functionality addresses a common pain point in interior design projects: inaccurate material estimation leading to project delays and budget overruns.

The material estimation process works by analyzing both the original room image and the AI-generated design, then using Gemini's text generation capabilities to produce a comprehensive bill of materials. The system is specifically tuned for the Indian market, incorporating HSN/SAC codes (Harmonized System of Nomenclature / Services Accounting Codes) which are essential for taxation and procurement purposes.

The materials are categorized into logical groups: furniture, paint, electrical, lighting, flooring, hardware, decor, structural, plumbing, and other. This categorization serves multiple purposes—it helps users understand the scope of work, facilitates supplier bidding by category, and enables more accurate project planning.

One significant implementation challenge was ensuring that the AI generates realistic quantities rather than arbitrary numbers. Through iterative testing and prompt refinement, we developed a system that produces estimates that, while not perfectly accurate, are sufficiently realistic to serve as a starting point for professional verification. The system explicitly notes that quantities should be verified by contractors before purchase, managing user expectations appropriately.

### C. Execution Planning

The execution planning module extends the system's capabilities from design and materials to actual project implementation. Given a material list and design image, the AI generates a comprehensive work plan that includes phase-wise activities, labour requirements, material usage schedules, and time estimates.

This feature addresses another critical gap in traditional interior design workflows: the disconnect between design concepts and practical execution. Many beautiful designs exist on paper but prove difficult or impossible to execute within reasonable timeframes or budgets. By generating detailed execution plans, the system helps bridge this gap.

The execution plan includes several key components:
- Project summary providing an overview of the work scope
- Time required breakdown with total duration and phase-specific timelines
- Category breakdown showing estimated days per material category
- Phase-wise work plan with dependencies between activities
- Labour requirements specifying roles, headcount, and duration
- Material usage plan mapping materials to specific phases
- Site notes and assumptions documenting constraints and considerations

The AI is prompted to consider practical Indian construction practices, including common labour roles (carpenter, electrician, painter, helper, installer, cleaner) and realistic sequencing of activities. For example, electrical rough-in must precede wall finishing, and furniture installation typically follows painting.

### D. Supplier Management and Bidding System

The supplier management module adds a commercial dimension to the system, connecting the design and planning phases with actual procurement. Suppliers can register on the platform, view material requirements for various projects, and submit bids with pricing and delivery estimates.

This bidirectional flow of information benefits all stakeholders. Project owners can compare bids from multiple suppliers, potentially reducing costs while ensuring quality and timely delivery. Suppliers gain access to a steady stream of potential business opportunities and can build their reputation through the platform's rating system.

The bidding system is designed around material categories rather than individual items, which proved more practical in implementation. Suppliers can bid on entire categories (e.g., "all lighting fixtures" or "all paint materials") rather than each individual screw or nail. This approach reduces administrative overhead while still providing meaningful price comparisons.

Suppliers also maintain product catalogs on the platform, showcasing their offerings with images, specifications, and pricing. This catalog serves both as a marketing tool and as a reference for project owners when evaluating bids.

## V. Database Design and Data Models

### A. User and Authentication

The system implements role-based access control with three primary roles: Admin, User, and Supplier. Each role has distinct permissions and access patterns. The User model stores essential information including email, password hash, name, role, company name (for suppliers), and phone number.

Authentication is handled using JWT (JSON Web Tokens) via Flask-JWT-Extended. This stateless authentication approach simplifies scaling and works well with the frontend's token-based API consumption pattern. Passwords are hashed using Werkzeug's security functions, following industry best practices.

### B. Project and Design Management

Projects serve as the primary organizing entity in the system. Each project belongs to a user and contains multiple designs, materials, execution plans, and milestones. The Project model tracks basic information (name, description, room type, budget) as well as status and progress metrics.

Designs are associated with projects and store references to both original and generated images (via Cloudinary URLs), the user's prompt, and a design name. This structure allows users to generate multiple design variations for a single project and compare them.

### C. Material and Execution Plan Models

The Material model stores individual material items with descriptions, HSN/SAC codes, quantities, units, categories, and status. Materials are linked to both projects and specific designs, allowing for tracking which materials are required for which design iteration.

The ExecutionPlan model is perhaps the most complex in the system, storing the AI-generated plan data in JSON format. This includes phases, labour requirements, category breakdowns, material usage schedules, and site notes. The model also supports progress logging, allowing users to track actual progress against the plan.

### D. Supplier and Bid Models

The Supplier model extends the basic User model with additional fields for company information, specialization, rating, total orders, and verification status. This reputation system helps project owners evaluate potential suppliers.

The Bid model links materials (or design categories) with suppliers, capturing pricing, delivery estimates, and status. Bids can be in pending, accepted, or rejected states, and the system tracks the bid lifecycle through completion.

## VI. Frontend Implementation Details

### A. Component Architecture

The frontend follows a component-based architecture with clear separation between UI components and page-level components. UI components (buttons, cards, modals, etc.) are reusable across the application, while page components handle specific route-level logic and composition.

React 19's features, including improved hooks and concurrent rendering, are leveraged to create a responsive user experience. The application uses React Router for navigation, with protected routes ensuring that authenticated users can only access appropriate pages.

### B. State Management and API Integration

State management is handled primarily through React's built-in useState and useEffect hooks, with context used for global state such as authentication status and theme preferences. This approach kept the implementation simple and avoidable the complexity of more heavyweight state management solutions like Redux.

API calls are centralized in a services layer, with axios used as the HTTP client. This centralization allows for consistent error handling, request/response interceptors (for authentication token injection), and easier maintenance.

### C. Data Visualization

The system includes several data visualization components using Recharts, a React charting library. These visualizations help users understand project progress, material distribution, and bid comparisons. The ExecutionPlanCharts component, for instance, displays Gantt-style timelines for project phases and category breakdowns.

## VII. Challenges and Solutions

### A. AI Output Consistency

One of the most significant challenges we faced was ensuring consistent, high-quality outputs from the AI. Early testing revealed that the same prompt could produce markedly different results across multiple calls, and some outputs were completely unusable.

We addressed this through several strategies:
- Detailed prompt engineering with explicit instructions and examples
- Output parsing with fallback mechanisms for malformed responses
- User feedback loops allowing users to regenerate designs when unsatisfied
- Conservative default parameters for AI generation

### B. Image Storage and Delivery

Handling image storage and delivery presented both technical and cost considerations. Local storage was impractical for a potentially multi-user system, and we needed a solution that could handle uploads, transformations, and CDN delivery efficiently.

Cloudinary emerged as the optimal solution, offering:
- Straightforward API integration
- Automatic optimization and format conversion
- Reliable CDN delivery
- Reasonable pricing for the expected usage patterns

### C. Real-time Progress Tracking

Implementing real-time progress tracking for execution plans required careful consideration of the data model. We needed to support both planned progress (from the AI-generated plan) and actual progress (logged by users).

The solution involved adding a progress_logs array to the ExecutionPlan model, where each log entry captures days logged, description, phase, and the user who logged it. The system calculates progress percentages by comparing total days logged against the planned duration.

### D. Cross-Origin Resource Sharing (CORS)

During development, we encountered CORS issues when the frontend (running on a different port) tried to access the backend API. Flask-CORS was configured to allow all origins during development, with plans to restrict this to specific domains in production.

## VIII. Performance Considerations

### A. API Response Times

AI generation operations are inherently time-consuming, with design generation taking 10-30 seconds depending on image complexity and server load. To maintain a responsive user experience, the frontend implements loading states and progress indicators for long-running operations.

Material list generation and execution plan generation are faster but still require several seconds. The system uses optimistic UI updates where appropriate, showing intermediate states while waiting for API responses.

### B. Database Query Optimization

MongoDB's query performance proved adequate for the expected scale, but we implemented indexing on frequently queried fields (user_id, project_id, design_id) to ensure responsive performance as the data grows. The flexible schema also allowed us to add indexes as needed without schema migrations.

### C. Frontend Performance

React 19's performance improvements, combined with Vite's fast development server and optimized production builds, resulted in a responsive frontend experience. Code splitting and lazy loading are implemented for route-level components, reducing initial bundle size.

## IX. Security Considerations

### A. Authentication and Authorization

JWT-based authentication provides stateless, scalable security. Tokens are stored in localStorage on the frontend and included in API request headers. The backend validates tokens on each protected endpoint, ensuring that only authenticated users can access sensitive operations.

Role-based authorization is enforced at both the backend (through role checks in route handlers) and frontend (through conditional rendering based on user role).

### B. Data Validation

Input validation is implemented at multiple levels:
- Frontend form validation using HTML5 validation and custom validators
- Backend validation using Flask's request parsing and custom validation logic
- Database-level validation through schema constraints where applicable

### C. File Upload Security

File uploads are restricted to specific image formats (PNG, JPG, JPEG, WebP) and size limits (16MB maximum). Filenames are sanitized using Werkzeug's secure_filename function to prevent directory traversal attacks. Cloudinary provides additional security through access controls and automatic malware scanning.

## X. User Experience and Interface Design

### A. Role-Based Interfaces

The system presents different interfaces based on user roles. Regular users see project management, design generation, and progress tracking features. Suppliers see a portal focused on bid management and catalog maintenance. Administrators have access to system-wide analytics and user management.

### B. Responsive Design

The frontend is built with mobile responsiveness in mind using TailwindCSS's responsive utilities. This ensures that the system remains usable on tablets and smartphones, which is increasingly important for on-site project management.

### C. Error Handling and User Feedback

Comprehensive error handling ensures that users receive clear, actionable feedback when something goes wrong. API errors are caught and displayed to users with appropriate context. Loading states provide visual feedback during long-running operations.

## XI. Testing and Quality Assurance

### A. Unit Testing

Unit tests were implemented for critical backend functions, particularly the design service and markdown parsing utilities. These tests ensure that core functionality works as expected and provide a safety net for refactoring.

### B. Integration Testing

Integration tests verify that different components work together correctly. For example, tests verify that a complete workflow—from project creation through design generation to material listing—functions end-to-end.

### C. User Testing

Informal user testing with actual interior designers and contractors provided valuable feedback on usability and practical applicability. This feedback drove several UI improvements and feature refinements.

## XII. Limitations and Future Work

### A. Current Limitations

The system has several limitations that should be acknowledged:
- AI-generated designs, while impressive, may not always align perfectly with user preferences or practical constraints
- Material quantities are estimates and require professional verification
- The AR visualization module is currently a placeholder and not fully implemented
- Real-time collaboration features are absent, limiting multi-user workflows
- Payment gateway integration would be needed for complete commercial functionality

### B. Future Enhancements

Several areas present opportunities for future development:
- Full AR implementation using WebXR for immersive design visualization
- 3D model generation from 2D designs for more comprehensive visualization
- Real-time collaboration features allowing multiple users to work on projects simultaneously
- Mobile application development for on-site access and management
- Payment gateway integration for seamless commercial transactions
- Advanced analytics and reporting for business insights
- Multi-language support to expand the user base
- Dark mode implementation for user preference accommodation
- Export functionality to various formats (PDF, CAD) for professional integration

## XIII. Conclusion

This project demonstrates the significant potential of AI integration in interior design workflows. By automating design generation, material estimation, and execution planning, we can reduce the time and expertise required for interior design projects while improving accuracy and transparency.

The system's architecture, leveraging modern web technologies and Google's Gemini AI, provides a solid foundation for continued development and refinement. While current limitations exist, particularly around AI output consistency and the need for professional verification of estimates, the overall approach shows promise for transforming how interior design projects are conceived, planned, and executed.

The practical applications of this system extend beyond individual projects to potentially reshape industry practices. As AI capabilities continue to evolve and user adoption increases, we can expect to see further integration of intelligent automation in creative and technical domains traditionally reliant on human expertise.

## References

[1] Google, "Gemini API Documentation," 2024. [Online]. Available: https://ai.google.dev/docs

[2] Flask Project, "Flask Documentation," 2024. [Online]. Available: https://flask.palletsprojects.com/

[3] MongoDB Inc., "MongoDB Documentation," 2024. [Online]. Available: https://docs.mongodb.com/

[4] React Documentation, "React 19 Documentation," 2024. [Online]. Available: https://react.dev/

[5] Cloudinary, "Cloudinary API Documentation," 2024. [Online]. Available: https://cloudinary.com/documentation

## Appendix

### A. API Endpoint Summary

The system exposes the following main API endpoints:

**Authentication:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

**Projects:**
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id
- GET /api/projects/:id/milestones
- POST /api/projects/:id/milestones

**Design:**
- POST /api/design/generate
- GET /api/design/image/:id
- POST /api/design/:id/execution-plan
- GET /api/design/project/:id

**Suppliers:**
- GET /api/suppliers/materials
- POST /api/suppliers/bid
- GET /api/suppliers/bids/:materialId
- POST /api/suppliers/bid/:bidId/accept
- POST /api/suppliers/catalog
- GET /api/suppliers/catalog

**Dashboard:**
- GET /api/dashboard/overview
- GET /api/dashboard/project/:id/details
- GET /api/dashboard/project/:id/progress

### B. Database Schema Overview

**Users Collection:**
- _id, email, password_hash, name, role, company_name, phone, created_at

**Projects Collection:**
- _id, user_id, name, description, room_type, budget, status, progress, created_at, updated_at

**Designs Collection:**
- _id, project_id, design_name, original_image_url, generated_image_url, prompt, created_at

**Materials Collection:**
- _id, project_id, design_id, description, hsn_sac, quantity, unit, estimated_cost, category, status

**ExecutionPlans Collection:**
- _id, project_id, design_id, total_duration, project_summary, phases_json, labour_json, category_json, material_usage_json, site_notes, progress_logs, created_at, updated_at

**Milestones Collection:**
- _id, project_id, name, description, target_date, status, completed_at, created_at

**Bids Collection:**
- _id, material_id, design_id, category, supplier_id, price, estimated_delivery_days, notes, status, created_at

**Catalogs Collection:**
- _id, supplier_id, product_name, description, category, price, image_url, specifications, available, created_at

### C. Environment Variables

The system requires the following environment variables:

- GEMINI_API_KEY: Google Gemini API key for AI generation
- JWT_SECRET_KEY: Secret key for JWT token generation
- MONGO_URI: MongoDB connection string
- CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
- CLOUDINARY_API_KEY: Cloudinary API key
- CLOUDINARY_API_SECRET: Cloudinary API secret
- FLASK_ENV: Environment (development/production)

---

**Manuscript received:** May 29, 2026; **revised:** May 29, 2026.
