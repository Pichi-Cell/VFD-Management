# Frontend Structure & State Management

## Component Hierarchy
- `App.jsx`: Main router and high-level provider setup.
- `Layout.jsx`: Main shell with Navbar and Sidebar. Contains logic for dynamic page titles.
- `KanbanBoard.jsx`: Visual representation of repairs by status.
- `RepairDetail.jsx`: Multi-tab interface for data entry and image review.
- `Settings.jsx`: Management interface for administrative entities.

## State Management
We use **TanStack Query (React Query)** to handle all server state.

### Core Query Keys
- `['repairs']`: List of all active and past repairs.
- `['repair', id]`: Detailed data for a single repair.
- `['clients']`, `['models']`, `['users']`: Management lists cached for Settings.

### Patterns
1. **Invalidation**: After a successful `mutation`, we invalidate the parent query key to trigger a background refetch.
2. **Context Events**: Custom DOM events are used for cross-component communication (e.g., `open-new-repair` to open the global New Repair modal from anywhere).

## UI System
- **Tailwind CSS**: Used for all styling.
- **Design System**: For detailed instructions on the "premium" aesthetic, colors, and components, see [styling_guidelines.md](file:///c:/Users/lucas/.gemini/antigravity/scratch/VFD/VFD-Management/context/styling_guidelines.md).
- **Key Tokens**:
    - `rounded-2xl/3xl`: Heavy use of large corner radii.
    - **Glassmorphism**: Subtle use of `backdrop-blur` in modals.
