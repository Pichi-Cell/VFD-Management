# Styling & Design System Guidelines

This document outlines the "Premium" visual identity of the VFD Management application. New components should adhere to these standards to maintain a cohesive user experience.

## Visual Philosophy
The application follows a **High-Contrast "Premium" Light Theme**. It prioritizes clarity, bold typography, and sophisticated use of space and depth.

### Key Visual Elements
1.  **Skewed Backgrounds**: High-level entry pages (Login, Setup) use a `-skew-y-6` background element in `bg-accent`.
2.  **Card-Based Layouts**: Use white cards with deep shadows (`shadow-2xl`) and very large corner radii (`rounded-[2.5rem]`).
3.  **Typography**: 
    - Use `font-black` for headings and primary action text.
    - Labels should be `text-[10px] uppercase tracking-widest font-black text-slate-400`.
4.  **Heavy Component Radii**: Use `rounded-2xl` for inputs and secondary buttons, and `rounded-[2.5rem]` for main containers.

## Design Tokens (Tailwind)

### Colors
- **Primary**: `bg-slate-50` (Main page backgrounds).
- **Cards**: `bg-white` (Form and content backgrounds).
- **Accent**: `bg-accent` (`#3b82f6`) for primary actions and brand identity.
- **Accent Hover**: `bg-accent-hover` (`#2563eb`).
- **Text**:
    - Headings: `text-slate-900`.
    - Body: `text-slate-600`.
    - Labels: `text-slate-400`.

### Shadows & Depth
- **Main Cards**: `shadow-2xl shadow-slate-200/50`.
- **Primary Buttons**: `shadow-xl shadow-accent/20`.
- **Icon Boxes**: High-contrast white background with `shadow-lg`.

## Preferred Tailwind Classes for Forms

### Input Fields
```html
<div className="group/input">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Label</label>
    <div className="relative">
        <input
            className="appearance-none block w-full px-5 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
        />
    </div>
</div>
```

### Primary Buttons
```html
<button className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-xl shadow-accent/20 font-black text-[10px] uppercase tracking-widest text-white bg-accent hover:bg-accent-hover transition-all active:scale-95">
    Action Text
</button>
```

## Icons
Use **Lucide-React** icons. For brand-focused icons, wrap them in a white `rounded-2xl` box with `shadow-lg` and `w-12 h-12`.
