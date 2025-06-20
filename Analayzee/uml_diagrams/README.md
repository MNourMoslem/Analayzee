# Analayzee UML Diagrams

This directory contains comprehensive UML diagrams for the Analayzee data analysis platform. These diagrams provide a complete visual representation of the system's architecture, design, and behavior.

## Diagram Overview

### 1. Class Diagram (`class_diagram.puml`)
**Purpose**: Shows the static structure of the system, including classes, their attributes, methods, and relationships.

**Key Components**:
- **Django Framework**: AbstractUser base class
- **Accounts App**: User, SubscriptionType, SubscriptionHistory, UserSession models and forms
- **Main App**: DataAnalyzer, ChartGenerator, StatisticsCalculator, DataTableManager
- **Utils**: DataFrameStore, FileProcessor
- **Views**: All view classes and their relationships

**Relationships**:
- Inheritance: User extends AbstractUser
- Associations: User has SubscriptionHistory, UserSession
- Dependencies: Views use Models, Forms create/update Models
- Aggregation: DataAnalyzer uses DataFrameStore

### 2. Object Diagram (`object_diagram.puml`)
**Purpose**: Shows specific instances of classes and their relationships at a particular point in time.

**Key Instances**:
- **Subscription Types**: Free and Premium plans with actual values
- **Users**: John Doe (Premium) and Jane Smith (Free) with real data
- **Subscription History**: Actual subscription records
- **User Sessions**: Active and inactive session instances
- **Data Analysis Objects**: Sample DataFrame and analysis components
- **Form Objects**: Registration and login forms with sample data

**Value**: Demonstrates how the system would look with real data and shows the relationships between actual objects.

### 3. Sequence Diagram (`sequence_diagram.puml`)
**Purpose**: Shows the dynamic behavior and interaction between system components over time.

**Main Scenarios**:
1. **File Upload Process**: Complete flow from file upload to storage
2. **Analysis Page Loading**: How data is retrieved and displayed
3. **Data Analysis Process**: Column analysis workflow
4. **Chart Creation Process**: Chart generation and display
5. **Statistics Generation**: Statistical analysis workflow
6. **Data Table Operations**: Sorting, filtering, pagination
7. **Data Cleaning Process**: Premium feature access control
8. **Session Management**: User logout and cleanup

**Value**: Shows the complete user journey and system interactions.

### 4. Use Case Diagram (`use_case_diagram.puml`)
**Purpose**: Shows the system's functionality from the user's perspective.

**Actors**:
- **Guest User**: Can register, login, and upload files
- **Registered User**: Full access to basic features
- **Premium User**: Access to advanced features including data cleaning
- **Administrator**: System management capabilities

**Use Case Categories**:
- Authentication & User Management (8 use cases)
- File Management (5 use cases)
- Data Analysis (7 use cases)
- Column Analysis (5 use cases)
- Data Visualization (7 use cases)
- Statistical Analysis (6 use cases)
- Data Cleaning - Premium (7 use cases)
- System Management (4 use cases)

**Relationships**: Include and extend relationships show dependencies between use cases.

### 5. Activity Diagram (`activity_diagram.puml`)
**Purpose**: Shows the workflow and business processes in the system.

**Main Workflow**:
1. **User Access**: Authentication check and interface loading
2. **File Upload**: Validation, processing, and storage
3. **Analysis Interface**: Parallel processing of different analysis types
4. **Data Operations**: Table, chart, statistics, and cleaning operations
5. **User Interaction**: Continuous analysis and export
6. **Session Management**: Logout and cleanup

**Key Features**:
- Parallel processing with fork/join
- Decision points for user types and file validation
- Error handling and recovery paths
- Premium feature access control

### 6. Component Diagram (`component_diagram.puml`)
**Purpose**: Shows the system's architecture and component relationships.

**Architecture Layers**:
- **Web Interface Layer**: User-facing pages
- **Presentation Layer**: Templates, static files, JavaScript, CSS
- **Application Layer**: Controllers, forms, session management
- **Business Logic Layer**: Core analysis and processing components
- **Data Access Layer**: ORM, storage, caching
- **External Services**: Libraries and validation services
- **Database Layer**: Data storage and tables

**Interfaces**: API interfaces for different system components
**Dependencies**: Clear dependency relationships between components

### 7. State Diagram (`state_diagram.puml`)
**Purpose**: Shows the different states of the system and how it transitions between them.

**Main States**:
- **Guest State**: File upload and basic analysis
- **Authenticated State**: Full user experience with profile management
- **Data Analysis State**: Complex analysis workflows
- **Error States**: Error handling and recovery

**State Transitions**:
- User authentication flows
- File processing states
- Analysis workflow states
- Error recovery paths

## How to Use These Diagrams

### For Developers
1. **Class Diagram**: Understand the code structure and relationships
2. **Sequence Diagram**: Follow the data flow and component interactions
3. **Component Diagram**: Understand system architecture and dependencies

### For Stakeholders
1. **Use Case Diagram**: Understand system functionality and user roles
2. **Activity Diagram**: Understand business processes and workflows
3. **Object Diagram**: See how the system works with real data

### For System Design
1. **State Diagram**: Understand system behavior and state transitions
2. **Component Diagram**: Plan system architecture and integration
3. **Class Diagram**: Design data models and object relationships

## Tools for Viewing

These diagrams are written in PlantUML format and can be viewed using:

1. **PlantUML Online**: http://www.plantuml.com/plantuml/
2. **VS Code Extension**: PlantUML extension
3. **IntelliJ IDEA**: PlantUML plugin
4. **Draw.io**: Import PlantUML files
5. **Lucidchart**: Import PlantUML syntax

## Diagram Maintenance

When updating the system:
1. Update the class diagram when adding new models or changing relationships
2. Update the sequence diagram when changing workflows
3. Update the use case diagram when adding new features
4. Update the activity diagram when changing business processes
5. Update the component diagram when changing architecture
6. Update the state diagram when changing system behavior

## Benefits

These diagrams provide:
- **Complete System Understanding**: Visual representation of all aspects
- **Communication Tool**: Easy to explain system to stakeholders
- **Documentation**: Comprehensive system documentation
- **Design Validation**: Verify system design before implementation
- **Maintenance Guide**: Understand system structure for updates
- **Onboarding**: Help new developers understand the system quickly

## File Structure

```
uml_diagrams/
├── class_diagram.puml          # System structure and relationships
├── object_diagram.puml         # Specific instances and data
├── sequence_diagram.puml       # Dynamic behavior and interactions
├── use_case_diagram.puml       # System functionality from user perspective
├── activity_diagram.puml       # Business processes and workflows
├── component_diagram.puml      # System architecture and components
├── state_diagram.puml          # System states and transitions
└── README.md                   # This documentation
```

These diagrams collectively provide a complete visual representation of the Analayzee system, making it easier to understand, maintain, and extend the platform. 