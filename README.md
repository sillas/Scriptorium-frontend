# Scriptorium Editor
**A modern writing platform designed specifically for book and eBook authors.**

<img width="1365" height="548" alt="Tela do editor" src="https://github.com/user-attachments/assets/9174293e-7229-4d37-9637-9d9a4325ba44" />

**Right panel reserved for AI agent functions**
<img width="1365" height="560" alt="image" src="https://github.com/user-attachments/assets/232bfe21-8d8f-44e3-b483-234a625432ea" />

Scriptorium Editor provides a distraction-free environment for long-form writing with intelligent chapter and paragraph management, offline-first architecture.

> **⚠️ Development Status**: This project is currently in active development. The current backend is provisional. Development efforts are focused on front-end features, usability, UX improvements, and offline-first capabilities. AI-powered features (planned for the right panel) and the robust backend integration will be implemented in future iterations.

## ✨ Key Features

### For Writers

- **Intuitive Document Structure**: Organize your work with titles, chapters, and paragraphs in a hierarchical format
- **Seamless Writing Experience**: Focus on your content with keyboard-optimized navigation and editing
- **Offline-First**: Write anywhere, anytime—your work is automatically saved locally and synced when you're back online
- **Smart Navigation**: Move between paragraphs and chapters effortlessly using keyboard shortcuts
- **Focus Mode**: Hide all controls and immerse yourself in pure writing (press F1 to temporarily show controls)
- **Auto-Save**: Your work is continuously saved in the background—never lose your progress

### Current Capabilities

- **Chapter Management**: Create, edit, and organize chapters with ease
- **Paragraph Management**: Write and structure content with full keyboard control
- **Offline Support**: Full editing capabilities even without an internet connection
- **Background Sync**: Automatic synchronization with cloud storage when online
- **Drag & Drop**: Reorder paragraphs visually to restructure your narrative

### Planned Features (Roadmap)

- **AI-Powered Writing Assistant** _(to be integrated in the left panel with backend support)_:
  - Character development and arc consistency checking
  - Style analysis and rewriting suggestions
  - Redundant theme detection
  - Advanced grammar and style checking
  - Writing tips and best practices
- **Version History**: Track changes and restore previous versions
- **Export Options**: PDF, EPUB, DOCX, and other popular formats
- **Cloud Backup**: Automatic backups with version control

## 📝 Quick Start Guide

### Document Structure

Your work is organized as: **Title** → **Chapters** → **Paragraphs**

### Basic Workflow

1. **Starting a New Document**
   - Add your main title
   - Press `TAB` to add an optional subtitle
   - Press `ENTER` to confirm

2. **Creating Chapters**
   - A first chapter is created automatically
   - Add chapter title and optional subtitle
   - Use chapter controls to manage and organize

3. **Writing Content**
   - Click on a paragraph to start writing
   - Press `ENTER` to create a new paragraph below
   - Press `CTRL+ENTER` for a line break within the same paragraph
   - Use `↑` / `↓` arrow keys or `(CTRL+) TAB` to navigate between paragraphs

4. **Organizing Content**
   - Use `CTRL`+ `↑` / `↓` to reorder paragraphs
   - Use chapter controls to remove or manage chapters
   - Right-click paragraphs for additional options

5. **Focus Mode**
   - Toggle Focus Mode to hide all controls
   - Press `F1` to show controls temporarily (3 seconds)

### Keyboard Shortcuts

| Shortcut     | Action                                                  |
|--------------|---------------------------------------------------------|
| `TAB`        | Move to next element                                    |
| `CTRL+TAB`   | Move to previous element                                |
| `ENTER`      | Create new paragraph (if on the last paragraph)         |
| `CTRL+ENTER` | New line in current paragraph                           |
| `ESC`        | Delete empty paragraph or deselect current paragraph    |
| `↑` / `↓`    | Navigate between paragraphs                             |
| `CTRL+S`     | Force sync (when online)                                |
| `BACKSPACE`  | Delete text empty paragraph (move to previous ones)     |

## 🚀 Local Development

### Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose
- npm, yarn, pnpm, or bun

### Setup Instructions

1. **Start MongoDB Container**
   ```bash
   docker compose -f .docker/docker-compose.yml up -d
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

5. **Stop MongoDB** (when needed)
   ```bash
   docker compose -f .docker/docker-compose.yml down
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:clear` - Clear database (development only)

---

## 🏗️ Architecture Overview (For Developers)

### Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB (production) + IndexedDB (local/offline)
- **Icons**: Lucide React

### Project Structure

```
editor/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── chapters/         # Chapter CRUD endpoints
│   │   ├── documents/        # Document CRUD endpoints
│   │   ├── paragraphs/       # Paragraph CRUD endpoints
│   │   └── users/            # User management
│   ├── editor/               # Editor pages
│   │   └── [id]/             # Dynamic document routes
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
│
├── components/               # React Components
│   ├── editor/               # Editor-specific components
│   │   ├── clientEditor.tsx  # Main editor component (client-side)
│   │   ├── DocumentForm.tsx  # Document creation form
│   │   ├── Header.tsx        # Editor header with controls
│   │   ├── SyncIndicator.tsx # Sync status indicator
│   │   ├── editorComponents/ # Atomic editor components
│   │   │   ├── AddButton.tsx      # Add paragraph button
│   │   │   ├── Chapter.tsx        # Chapter component
│   │   │   ├── Contents.tsx       # Table of contents
│   │   │   ├── EditableHeading.tsx # Editable heading component
│   │   │   ├── LeftColumn.tsx     # Left sidebar column
│   │   │   ├── Paragraph.tsx      # Paragraph component
│   │   │   ├── RightAside.tsx     # Right sidebar panel
│   │   │   └── Title.tsx          # Document title component
│   │   ├── styles/           # Component-specific styles
│   │   │   ├── editable-heading.ts # Heading styles
│   │   │   └── paragraph.ts       # Paragraph styles
│   │   └── types/            # TypeScript type definitions
│   │       └── index.ts      # Shared types
│   ├── OnlineStatusProvider.tsx # Online/offline detection
│   └── UserForm.tsx          # User form component
│
├── hooks/                    # Custom React Hooks
│   ├── editor/               # Editor-specific hooks
│   │   ├── useSyncBackground.ts    # Background sync management
│   │   ├── useNavigation.ts        # Keyboard navigation
│   │   ├── SYNC_BACKGROUND.md      # Sync documentation
│   │   └── paragraphs/             # Paragraph-specific hooks
│   │       ├── useActionButtons.ts        # Paragraph action buttons
│   │       ├── useParagraphContent.ts     # Content management
│   │       ├── useParagraphContextMenu.ts # Context menu logic
│   │       ├── useParagraphCursor.ts      # Cursor management
│   │       ├── useParagraphEditing.ts     # Editing operations
│   │       ├── useParagraphNavigation.ts  # Navigation logic
│   │       └── useParagraphPersistence.ts # Save/sync logic
│   ├── useOnlineStatus.ts    # Online/offline detection
│   ├── useDebounceTimer.ts   # Debounced operations
│   └── useLocalStorage.ts    # Local storage utilities
│
├── lib/                      # Core Libraries & Utilities
│   ├── indexedDB.ts          # IndexedDB wrapper for offline storage
│   ├── mongodb.ts            # MongoDB connection and utilities
│   ├── sync.ts               # Synchronization logic
│   ├── loadUnsyncedData.ts   # Load unsynced data from IndexedDB
│   ├── slug-helpers.ts       # URL slug utilities
│   └── editor/               # Editor utilities
│       ├── constants.ts      # Editor constants
│       ├── conversions.ts    # Data format conversions
│       ├── formatting.ts     # Text formatting utilities
│       ├── myersDiff.ts      # Myers diff algorithm
│       ├── paragraph-helpers.ts  # Paragraph operations
│       ├── selection.ts      # Text selection utilities
│       └── text-utils.ts     # Text manipulation utilities
│
├── public/                   # Static assets
│
└── scripts/                  # Utility Scripts
    ├── clear-db.ts           # Database cleanup tool
    └── README.md             # Scripts documentation
```

### Core Concepts

#### Synchronization System

The editor implements an **offline-first architecture** with automatic background synchronization:

- **IndexedDB**: Local storage for documents, chapters, and paragraphs
- **Sync Queue**: Tracks pending changes when offline
- **Background Sync**: Automatically syncs to MongoDB when online
- **Conflict Resolution**: Smart merging of local and remote changes

#### Component Architecture

- **Client-Side Rendering**: Main editor is client-side for performance
- **Server-Side API**: RESTful endpoints for data persistence
- **Atomic Components**: Each UI element is an independent, reusable component
- **Custom Hooks**: Business logic separated into specialized hooks

#### Data Flow

1. **User Input** → Local State Update (immediate)
2. **Local State** → IndexedDB (debounced, 500ms)
3. **IndexedDB** → Sync Queue (if changes detected)
4. **Sync Queue** → MongoDB (background, when online)

#### State Management

- **React State**: UI and editing state
- **IndexedDB**: Persistent local storage
- **MongoDB**: Cloud persistence and backup

### Key Files for Developers

| File | Purpose |
|------|---------|
| `components/editor/clientEditor.tsx` | Main editor component and orchestration |
| `lib/indexedDB.ts` | Offline storage and sync queue management |
| `lib/sync.ts` | Synchronization logic between local and remote |
| `hooks/editor/useSyncBackground.ts` | Background sync hooks |
| `hooks/editor/paragraphs/useParagraphPersistence.ts` | Paragraph save/sync logic |
| `app/api/*` | MongoDB REST API endpoints |

### Contributing

When contributing to the codebase:

1. **Follow existing patterns**: Use custom hooks for business logic
2. **Maintain offline-first**: All features must work offline
3. **Add proper TypeScript types**: See `components/editor/types/`
4. **Test sync behavior**: Ensure offline → online sync works correctly
5. **Update documentation**: Keep README current

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For questions, issues, or feature requests, please contact the development team.
