# RetailGen AI - Professional CSS Design System

## Overview

This is a comprehensive, production-ready CSS design system built for RetailGen AI. It provides a consistent, scalable, and maintainable styling foundation for the entire application.

## Architecture

### File Structure
```
src/styles/
├── globals.css      # Base styles, utilities, and global resets
├── theme.css        # Theme system with light/dark mode support
├── components.css   # Reusable component styles
├── pages.css        # Page-specific styles
├── designSystem.ts  # TypeScript design tokens (legacy)
├── VendorAssistant.css # Legacy component styles
└── README.md        # This documentation
```

### Design Principles

1. **Mobile-First**: All styles are designed mobile-first with progressive enhancement
2. **Accessibility**: WCAG 2.1 AA compliant with proper focus states and screen reader support
3. **Performance**: Optimized CSS with minimal redundancy and efficient selectors
4. **Maintainability**: Organized with clear naming conventions and modular structure
5. **Consistency**: Unified design tokens and spacing system throughout

## Design Tokens

### Color System
- **Primary**: Blue gradient (#3b82f6 to #2563eb)
- **Secondary**: Purple (#8b5cf6)
- **Accent**: Cyan (#06b6d4)
- **Semantic**: Success (green), Warning (amber), Error (red), Info (blue)

### Typography Scale
- **Font Family**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto')
- **Sizes**: xs (12px) to 6xl (60px) with responsive scaling
- **Weights**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing Scale
- **Base Unit**: 4px (0.25rem)
- **Scale**: 1-24 (4px to 96px) following 8-point grid system
- **Responsive**: Automatic scaling on mobile devices

### Border Radius
- **sm**: 4px, **md**: 6px, **lg**: 8px, **xl**: 12px, **2xl**: 16px, **full**: 9999px

### Shadows
- **Elevation System**: 5 levels from subtle to dramatic
- **Theme Aware**: Darker shadows in dark mode
- **Performance**: Hardware-accelerated with proper layering

## Theme System

### Light Theme (Default)
- Clean, minimal design with high contrast
- White backgrounds with subtle gray surfaces
- Professional color palette suitable for business use

### Dark Theme
- Modern dark interface with blue accents
- Reduced eye strain for extended use
- Maintains accessibility standards in low-light conditions

### Theme Switching
```css
[data-theme="light"] { /* Light theme styles */ }
[data-theme="dark"] { /* Dark theme styles */ }
```

## Component Library

### Buttons
```css
.btn                 /* Base button */
.btn-primary         /* Primary action button */
.btn-secondary       /* Secondary button */
.btn-outline         /* Outlined button */
.btn-ghost           /* Minimal button */
.btn-danger          /* Destructive action */
.btn-success         /* Success action */

/* Sizes */
.btn-sm              /* Small button */
.btn-lg              /* Large button */
.btn-xl              /* Extra large button */

/* States */
.btn-loading         /* Loading state with spinner */
.btn:disabled        /* Disabled state */
```

### Forms
```css
.form-input          /* Text input */
.form-textarea       /* Textarea */
.form-select         /* Select dropdown */
.form-checkbox       /* Checkbox */
.form-radio          /* Radio button */
.form-label          /* Form label */
.form-error          /* Error message */
.form-help           /* Help text */

/* Sizes */
.form-input-sm       /* Small input */
.form-input-lg       /* Large input */

/* States */
.form-input-error    /* Error state */
.form-input-success  /* Success state */
```

### Cards
```css
.card                /* Base card */
.card-header         /* Card header */
.card-body           /* Card body */
.card-footer         /* Card footer */
.card-title          /* Card title */
.card-subtitle       /* Card subtitle */

/* Variants */
.card-elevated       /* Elevated card with shadow */
.card-outlined       /* Outlined card */
.card-ghost          /* Minimal card */
```

### Navigation
```css
.navbar              /* Navigation bar */
.navbar-brand        /* Brand/logo */
.navbar-nav          /* Navigation list */
.navbar-item         /* Navigation item */
.navbar-link         /* Navigation link */

/* Dropdown */
.dropdown            /* Dropdown container */
.dropdown-toggle     /* Dropdown trigger */
.dropdown-menu       /* Dropdown menu */
.dropdown-item       /* Dropdown item */
```

### Modals
```css
.modal-backdrop      /* Modal backdrop */
.modal               /* Modal container */
.modal-header        /* Modal header */
.modal-title         /* Modal title */
.modal-body          /* Modal body */
.modal-footer        /* Modal footer */
.modal-close         /* Close button */
```

### Alerts & Status
```css
.alert               /* Base alert */
.alert-info          /* Info alert */
.alert-success       /* Success alert */
.alert-warning       /* Warning alert */
.alert-error         /* Error alert */

.badge               /* Base badge */
.badge-primary       /* Primary badge */
.badge-secondary     /* Secondary badge */
.badge-success       /* Success badge */
.badge-warning       /* Warning badge */
.badge-error         /* Error badge */
```

### Loading States
```css
.spinner             /* Loading spinner */
.spinner-sm          /* Small spinner */
.spinner-lg          /* Large spinner */

.skeleton            /* Skeleton loader */
.skeleton-text       /* Text skeleton */
.skeleton-avatar     /* Avatar skeleton */
.skeleton-button     /* Button skeleton */
```

## Utility Classes

### Layout
```css
.container           /* Max-width container */
.container-sm        /* Small container */
.container-md        /* Medium container */
.container-lg        /* Large container */
.container-xl        /* Extra large container */

.grid                /* CSS Grid */
.grid-cols-1         /* 1 column grid */
.grid-cols-2         /* 2 column grid */
.grid-cols-3         /* 3 column grid */
.grid-cols-4         /* 4 column grid */

.flex                /* Flexbox */
.flex-col            /* Flex column */
.items-center        /* Align items center */
.justify-center      /* Justify center */
.justify-between     /* Justify space between */
```

### Spacing
```css
.m-{size}            /* Margin all sides */
.mt-{size}           /* Margin top */
.mb-{size}           /* Margin bottom */
.ml-{size}           /* Margin left */
.mr-{size}           /* Margin right */
.mx-{size}           /* Margin horizontal */
.my-{size}           /* Margin vertical */

.p-{size}            /* Padding all sides */
.pt-{size}           /* Padding top */
.pb-{size}           /* Padding bottom */
.pl-{size}           /* Padding left */
.pr-{size}           /* Padding right */
.px-{size}           /* Padding horizontal */
.py-{size}           /* Padding vertical */
```

### Typography
```css
.text-xs             /* Extra small text */
.text-sm             /* Small text */
.text-base           /* Base text */
.text-lg             /* Large text */
.text-xl             /* Extra large text */
.text-2xl            /* 2x large text */
.text-3xl            /* 3x large text */
.text-4xl            /* 4x large text */

.font-normal         /* Normal weight */
.font-medium         /* Medium weight */
.font-semibold       /* Semibold weight */
.font-bold           /* Bold weight */

.text-left           /* Left align */
.text-center         /* Center align */
.text-right          /* Right align */

.text-primary        /* Primary text color */
.text-secondary      /* Secondary text color */
.text-tertiary       /* Tertiary text color */
```

### Colors
```css
.bg-primary          /* Primary background */
.bg-secondary        /* Secondary background */
.bg-tertiary         /* Tertiary background */

.text-gradient-primary   /* Primary gradient text */
.text-gradient-secondary /* Secondary gradient text */

.bg-gradient-primary     /* Primary gradient background */
.bg-gradient-secondary   /* Secondary gradient background */
```

### Effects
```css
.shadow-sm           /* Small shadow */
.shadow-md           /* Medium shadow */
.shadow-lg           /* Large shadow */
.shadow-xl           /* Extra large shadow */
.shadow-2xl          /* 2x large shadow */

.rounded-sm          /* Small border radius */
.rounded-md          /* Medium border radius */
.rounded-lg          /* Large border radius */
.rounded-xl          /* Extra large border radius */
.rounded-2xl         /* 2x large border radius */
.rounded-full        /* Full border radius */

.glass               /* Glassmorphism effect */
.glass-strong        /* Strong glassmorphism effect */
```

### Animations
```css
.animate-fade-in     /* Fade in animation */
.animate-fade-in-up  /* Fade in up animation */
.animate-slide-in-left  /* Slide in left animation */
.animate-slide-in-right /* Slide in right animation */
.animate-pulse       /* Pulse animation */
.animate-spin        /* Spin animation */
.animate-bounce      /* Bounce animation */
```

## Page-Specific Styles

### Landing Page
- Hero section with gradient backgrounds
- Feature cards with hover effects
- Testimonial grid layout
- Pricing cards with featured highlighting
- Responsive design for all screen sizes

### Dashboard
- Welcome section with gradient text
- Quick action cards with hover states
- Statistics grid with animated counters
- Professional layout with proper spacing

### Business Home
- Health status indicators
- Metrics grid with visual hierarchy
- Insight cards with icon integration
- Real-time data visualization support

### Vendor Assistant
- Chat interface with message bubbles
- Avatar system for user identification
- Input area with send button
- Responsive mobile-friendly design

## Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px - 1024px
- **Large**: > 1024px

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Readable font sizes (minimum 16px)
- Proper spacing for thumb navigation
- Optimized layouts for portrait orientation

## Accessibility Features

### Focus Management
- Visible focus indicators on all interactive elements
- Proper tab order throughout the application
- Skip links for keyboard navigation

### Color Contrast
- WCAG AA compliant color combinations
- High contrast mode support
- Color-blind friendly palette

### Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels and roles
- Screen reader only text where needed

### Motion Preferences
- Respects `prefers-reduced-motion` setting
- Optional animations that can be disabled
- Smooth transitions without causing motion sickness

## Performance Optimizations

### CSS Optimization
- Minimal redundancy in styles
- Efficient selectors for fast rendering
- Hardware acceleration for animations
- Optimized font loading

### Bundle Size
- Modular CSS architecture
- Tree-shakeable utility classes
- Compressed and minified output
- Critical CSS inlining support

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- Graceful degradation for older browsers
- Progressive enhancement approach
- Polyfills for critical features

## Migration Guide

### From Legacy Styles
1. Update import statements to use new CSS files
2. Replace old class names with new utility classes
3. Update theme variables to use new token system
4. Test components in both light and dark themes

### Breaking Changes
- Some legacy class names have been deprecated
- Color variables have been reorganized
- Spacing scale has been updated to 8-point grid

## Best Practices

### Class Naming
- Use semantic class names for components
- Prefer utility classes for spacing and layout
- Follow BEM methodology for complex components
- Keep specificity low for maintainability

### Theme Usage
- Always use CSS custom properties for colors
- Test components in both light and dark themes
- Provide fallbacks for unsupported browsers
- Use theme-aware utility classes

### Performance
- Minimize CSS bundle size
- Use efficient selectors
- Avoid deep nesting
- Leverage browser caching

## Contributing

### Adding New Components
1. Follow existing naming conventions
2. Include both light and dark theme support
3. Add responsive design considerations
4. Document new classes in this README

### Modifying Existing Styles
1. Test changes across all themes
2. Ensure backward compatibility
3. Update documentation as needed
4. Consider performance implications

## Support

For questions or issues with the design system, please:
1. Check this documentation first
2. Review existing component examples
3. Test in both light and dark themes
4. Ensure responsive design works properly

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: RetailGen AI Development Team