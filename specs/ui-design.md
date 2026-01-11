# UI/UX Design & Branding

## Brand Identity

### Name: removebackground

- Clear, descriptive name
- Instantly communicates purpose
- SEO-friendly

### Visual Tone

- Modern, clean, minimal
- Professional but approachable
- Fast, lightweight feel
- Privacy-focused messaging

## Design System

### Colors

Primary palette (to be refined with frontend-design skill):
- Primary: Vibrant accent color (blue/cyan family suggested)
- Background: Near-white with subtle warmth
- Surface: Pure white for cards/panels
- Text: Dark gray (not pure black)
- Success: Green for completion states
- Error: Red/coral for error states

### Typography

- Display font: Modern, clean sans-serif
- Body font: Highly readable sans-serif
- Monospace: For technical info (file sizes, dimensions)

### Spacing & Layout

- Generous whitespace
- Clear visual hierarchy
- Mobile-first responsive design
- Max content width: ~1200px centered

## Page Structure

### Hero Section

- Large, inviting headline
- Brief value proposition (100% client-side, private)
- Prominent upload zone
- Trust indicators (no server upload, works offline)

### Upload Zone

- Dashed border with rounded corners
- Icon + text prompt
- Hover/drag state animations
- Paste/drag instruction text

### Processing View

- Full-focus on the image
- Minimal chrome during processing
- Clear progress indication
- Cancel option visible

### Result View

- Image comparison takes center stage
- Download button prominent (primary CTA)
- Secondary actions: Copy, Start Over
- Optional: format selection

### Footer

- Privacy statement (we don't see your images)
- GitHub link (if open source)
- Made with ❤️ tagline

## Acceptance Criteria

- [ ] Design is distinctive — not generic AI aesthetics
- [ ] Responsive from 320px to 2560px viewport
- [ ] Dark mode support (respects system preference)
- [ ] Loading states for all async operations
- [ ] Smooth animations (60fps)
- [ ] Accessible color contrast (WCAG AA)
- [ ] Keyboard navigable throughout

## Microinteractions

- Upload zone pulse on hover
- Smooth progress bar animation
- Satisfying "complete" animation
- Button hover/active states
- Toast notifications slide in/out

## Mobile Considerations

- Touch-friendly tap targets (44x44px minimum)
- Swipe gestures for comparison slider
- Bottom-sheet for options (not dropdowns)
- Prevent accidental navigation during processing

## Privacy Messaging

Prominently display:
- "Your images never leave your device"
- "100% client-side processing"
- "Works offline after first load"
- "No account required"
