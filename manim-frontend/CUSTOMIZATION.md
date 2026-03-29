# ⚙️ Customization Reference

## How to Customize Your Enhanced Landing Page

### 1. Change Accent Color

**File:** `App.css` - Line 8

```css
--accent: #22c55e; /* Change this hex color */
```

Common color options:

- Purple: `#a855f7`
- Pink: `#ec4899`
- Blue: `#3b82f6`
- Orange: `#f97316`
- Cyan: `#06b6d4`

---

### 2. Adjust Cursor Glow Size

**File:** `App.css` - Lines 27-28

```css
.cursor-glow {
  width: 30px; /* Increase/decrease size */
  height: 30px;
}
```

---

### 3. Modify Scramble Text Speed

**File:** `ScrambleText.js` - Lines 18, 30

```javascript
// Change from 30 to faster/slower:
// Faster (scrambles quicker): 15
// Slower (more dramatic): 50
intervalRef.current = setTimeout(scramble, 30);
```

---

### 4. Change Card Hover Lift Height

**File:** `App.css` - Line 119

```css
.card:hover {
  transform: translateY(-5px); /* More/less lift: -10px or -2px */
}
```

---

### 5. Adjust Progress Bar Color

**File:** `App.css` - Line 269

```css
.loader-bar-fill {
  background: linear-gradient(90deg, #22c55e, #10b981, #22c55e);
  /* Change the color codes */
}
```

---

### 6. Modify Button Hover Effect

**File:** `App.css` - Line 91

```css
.prompt-form button:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02); /* Adjust lift and scale */
}
```

---

### 7. Change Glow Intensity

**File:** `App.css` - Lines 34-39 (cursor glow box-shadow)

```css
box-shadow:
  0 0 20px rgba(34, 197, 94, 0.4),
  /* First blur larger/smaller */ 0 0 40px rgba(34, 197, 94, 0.2),
  /* Second blur */ inset 0 0 20px rgba(34, 197, 94, 0.1); /* Inset glow */
```

---

### 8. Adjust Animation Speed

**File:** `App.css` - Various locations

```css
/* Look for "transition:" properties */
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
/* Change 0.4s to: 0.2s (faster) or 0.8s (slower) */
```

---

### 9. Modify Title Gradient

**File:** `App.css` - Lines 54-57

```css
.app-header h1 {
  background: linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #22c55e 100%);
  /* Adjust angle (135deg), colors, and percentages */
}
```

---

### 10. Change Card Border Style

**File:** `App.css` - Lines 109-113

```css
.card {
  background:
    linear-gradient(135deg, #020617, #0a0817) padding-box,
    conic-gradient(...); /* The gradient pattern */
  border: 1.5px solid rgba(148, 163, 184, 0.2); /* Border thickness/color */
}
```

---

## Advanced Customizations

### Full Color Theme Change

Replace all color variables at the top of `App.css`:

```css
:root {
  --bg: #your-bg-color;
  --bg-card: #your-card-color;
  --accent: #your-accent-color;
  --accent-soft: rgba(your-accent-rgb, 0.16);
  --text: #your-text-color;
  --muted: #your-muted-color;
  --error: #your-error-color;
}
```

### Disable Cursor Glow

**File:** `App.css` - Line 24

```css
body {
  cursor: auto; /* Change from 'none' to 'auto' */
}
```

### Remove Title Scramble Effect

**File:** `App.js` - Line 107

```javascript
{/* <ScrambleText>Manim Video Generator</ScrambleText> */}
Manim Video Generator  {/* Just use plain text */}
```

### Change Shimmer Direction

**File:** `App.css` - Lines 273-285

```css
@keyframes shimmer {
  0% {
    left: -100%; /* Start position */
  }
  100% {
    left: 100%; /* End position */
  }
}
/* Change to right-to-left by reversing values */
```

---

## Quick Presets

### Dark Mode (Current)

Looks good as-is ✓

### Light Mode

Change `body` background and all colors to light variants:

```css
body {
  background: radial-gradient(
    circle at top left,
    #f3f4f6 0,
    #ffffff 55%,
    #f5f5f5 100%
  );
  color: #1f2937;
}
```

### Neon Mode

Use bright accent colors:

```css
--accent: #00ff41; /* Neon Green */
--text: #00ff41;
--bg: #0a0014; /* Deep purple */
```

---

## Testing Changes

After making a change:

1. Save the file
2. The browser will auto-reload (if using `npm start`)
3. Check your changes immediately
4. Adjust as needed

---

## Need More Help?

Check these files for implementation details:

- `useMouseGlow.js` - Cursor tracking logic
- `ScrambleText.js` - Text scrambling effect
- `App.css` - All styling and animations
- `ENHANCEMENTS.md` - Feature documentation
- `VISUAL_GUIDE.md` - Visual examples

**Happy customizing!** 🎨✨
