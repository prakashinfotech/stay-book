<!-- ---
description: React development best practices for client application
globs: client/src/**/*
alwaysApply: false
--- -->

# REACT DEVELOPMENT RULES

## Component Structure

### File Organization

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.type.ts`
- Services: `camelCase.service.ts`

### Component Pattern

- Functional components only (no class components)
- Use TypeScript for all components
- Define prop interfaces explicitly
- Export component as default

---

## Performance Optimization

### Memoization Strategy

**When to use:**

- `React.memo` - Components with stable props and expensive rendering
- `useMemo` - Expensive calculations (avoid for cheap operations)
- `useCallback` - Stabilize function references passed to memoized children

**Don't over-memoize:**

- Simple components with primitive props
- Components that render quickly (<16ms)
- Values that change frequently (defeats purpose)

### Code Splitting

- Route-based splitting with `React.lazy()`
- Lazy load heavy components below the fold
- Use `Suspense` boundaries for loading states
- Preload critical resources
- Split large libraries when possible

---

## State Management

### Local State First

- Keep state as local as possible
- Lift state only when sharing between siblings
- Use context sparingly (causes re-renders of all consumers)
- Avoid prop drilling (max 2-3 levels)

### State Placement Rules

1. Component-specific data → local state (`useState`)
2. Shared sibling data → lift to parent
3. Deep prop drilling → context or compound components
4. Global app state → Redux Toolkit

---

## Redux Toolkit

### Store Setup

- Use `configureStore` from `@reduxjs/toolkit`
- Implement `redux-persist` for state persistence
- Configure persistence for auth and user preferences
- Export typed hooks: `useAppDispatch`, `useAppSelector`

### Slice Best Practices

- Create slices with `createSlice` (reducer + actions together)
- Use `createAsyncThunk` for API calls
- Keep slices focused on single domain
- Use `extraReducers` for async thunk handling
- Use `createSelector` for derived/computed state
- Handle loading/error states in slice

### When to Use Redux

- Authentication state (user, token, permissions)
- Global UI state (theme, language preference)
- Shared data across many unrelated components
- Complex state with many update patterns
- State that needs persistence

### When NOT to Use Redux

- Server data (use React Query or RTK Query instead)
- Local component state
- Form state (use Formik/React Hook Form)
- Derived state (use `useMemo` instead)

### Redux Pattern

```typescript
// Slice
export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      });
  },
});

// Component usage
const user = useAppSelector((state) => state.user.currentUser);
const dispatch = useAppDispatch();
```

---

## Hooks Best Practices

### Rules of Hooks

- Only call at top level (no conditionals/loops)
- Only call from React functions (components/custom hooks)
- Always specify dependency arrays (no missing deps)
- Use ESLint plugin for hooks validation

### Common Patterns

- `useState` - Component-local state
- `useEffect` - Sync with external systems only (not for derived state)
- `useMemo` - Derived state from props/state
- `useCallback` - Stable function references
- `useRef` - DOM access and mutable values (no re-renders)
- `useContext` - Access context value
- Custom hooks - Reusable stateful logic

### useEffect Guidelines

- Use for side effects only (API calls, subscriptions, DOM manipulation)
- Always clean up subscriptions/timers
- Don't use for derived state (use `useMemo`)
- Include all dependencies in array
- Avoid object/array dependencies (causes infinite loops)

---

## API Integration

### Axios Configuration

- Use axios instance from `common/axiosInstance.ts`
- Implement request interceptors (add token)
- Implement response interceptors (handle errors, refresh token)
- Set base URL from environment variable
- Handle token refresh automatically on 401

### API Call Pattern

```typescript
try {
  setLoading(true);
  const response = await apiService.getData();
  setData(response.data);
  setError(null);
} catch (error) {
  setError(error.message);
  toast.error("Operation failed");
} finally {
  setLoading(false);
}
```

### Best Practices

- Show loading states during requests
- Display error messages from API responses
- Implement request cancellation (AbortController)
- Handle network errors gracefully
- Cache responses when appropriate
- Implement optimistic updates for better UX

---

## Anti-Patterns to Avoid

**Never do:**

1. Create objects/arrays in render (causes re-renders)
2. Define functions inside render (unless using `useCallback`)
3. Use `useEffect` for derived state (use `useMemo`)
4. Forget dependency arrays in hooks
5. Mutate props or state directly
6. Use index as key for dynamic lists
7. Fetch data in render (use `useEffect`)
8. Use inline arrow functions in JSX props (unless necessary)

---

## Error Handling

### Error Boundaries

- Wrap route components with error boundaries
- Provide fallback UIs for errors
- Log errors to monitoring service
- Don't catch errors in event handlers (use try-catch)
- Reset error boundary on navigation

### Error Boundary Placement

- Route level for page errors
- Feature level for feature isolation
- Component level for critical widgets
- Don't overuse (degrades UX)

### User Feedback

- Use toast notifications for operations
- Show inline errors for forms
- Provide retry mechanisms
- Display meaningful error messages
- Never show technical errors to users

---

## Forms & Validation

### Formik Integration

- Use Formik for complex forms
- Validate with Yup schemas
- Show validation errors inline
- Disable submit during submission
- Show loading state on submit button
- Clear form after successful submission

### Validation Rules

- Validate on blur and submit (not on change)
- Show specific error messages
- Required fields marked visually
- Implement client-side and server-side validation
- Handle server validation errors

---

## Routing

### React Router

- Use declarative routing
- Implement protected routes (AuthWrapper)
- Handle 404 pages
- Implement route-based code splitting
- Use nested routes for layouts
- Pass state through navigation

### Navigation Patterns

- Use `useNavigate` hook for programmatic navigation
- Use `<Link>` for declarative navigation
- Pass state: `navigate('/path', { state: { data } })`
- Prevent navigation with guards
- Handle back button appropriately

---

## TypeScript Best Practices

### Type Definitions

- Define prop interfaces for all components
- Use types for service responses
- Avoid `any` type (use `unknown` if needed)
- Use union types for variants
- Define enums for constants
- Export shared types from `types/` directory

### Component Props

```typescript
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className,
}) => {
  // component logic
};
```

---

## Styling

### SCSS Modules

- Use CSS/SCSS modules for component styles
- Follow BEM naming convention
- Keep styles scoped to components
- Use variables for colors/spacing (SCSS variables)
- Import global styles from `assets/styles/`

### Styling Best Practices

- Mobile-first approach
- Use responsive units (rem, em, %)
- Implement dark mode support if needed
- Follow design system consistently
- Minimize inline styles

---

## Testing Requirements

### Component Tests

- Test user interactions, not implementation
- Use React Testing Library
- Mock API calls and external dependencies
- Test accessibility (aria labels, keyboard navigation)
- Test error states and loading states

### Test Patterns

- Render component
- Find elements by role/label (not test IDs)
- Simulate user actions
- Assert expected outcomes
- Clean up after tests

---

## Accessibility

### Required Practices

- Use semantic HTML elements
- Provide alt text for images
- Use aria labels for icons/buttons
- Implement keyboard navigation
- Ensure sufficient color contrast
- Test with screen readers
- Support keyboard-only navigation
- Provide focus indicators

---

## Performance Monitoring

### Web Vitals

- Monitor Core Web Vitals (LCP, FID, CLS)
- Use `reportWebVitals.ts` for tracking
- Optimize images (lazy load, proper formats)
- Minimize bundle size
- Implement service worker for caching
- Monitor runtime performance

---
