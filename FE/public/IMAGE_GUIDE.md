# Image Asset Guide

This guide explains where to place images for the MemeBattle game.

## 📁 Directory Structure

```
public/
├── characters/          # Character portraits
├── cards/              # Card artwork
├── avatars/            # User profile pictures
└── favicon.ico         # Site favicon
```

## 🌐 Environment Configuration

**IMPORTANT**: Images are ALWAYS stored in the `public/` folder (cards/, characters/, avatars/).

The image system uses environment variables for flexible deployment:

**`.env` file:**
```bash
# Development (leave empty - uses relative paths)
VITE_ASSETS_BASE_URL=

# Production (set to your frontend server URL)
VITE_ASSETS_BASE_URL=https://meme-blood.ddns.net:8443
```

**How it works:**
- **Development**: `/cards/my-card.png` → served from `public/cards/my-card.png`
- **Production**: `https://meme-blood.ddns.net:8443/cards/my-card.png` → served from `public/cards/my-card.png`

**Deployment Steps:**
1. Copy all images to `public/` folder on your server
2. Set `VITE_ASSETS_BASE_URL` to your frontend server URL
3. Build and deploy - images will load from the correct location

This allows you to:
- Use relative paths during local development
- Use full URLs in production for CORS/CDN compatibility
- Keep images in the same `public/` folder structure everywhere

## 🎨 Character Images

**Location:** `/public/characters/`

**Database path format:** `/characters/character-name.png`

**Naming convention:** Use kebab-case (lowercase with hyphens)

**Examples:**
```
/characters/shadow-tactician.png
/characters/fire-mage.png
/characters/ice-warrior.png
/characters/dragon-knight.png
```

**Recommended specs:**
- Format: PNG (for transparency) or JPG
- Size: 512x512px or 1024x1024px (square)
- File size: < 500KB
- Transparent background recommended

**Database example:**
```json
{
  "name": "Shadow Tactician",
  "characterPic": "/characters/shadow-tactician.png",
  "rarity": "rare"
}
```

---

## 🃏 Card Images

**Location:** `/public/cards/`

**Database path format:** `/cards/card-name.png`

**Naming convention:** Use kebab-case (lowercase with hyphens)

**Examples:**
```
/cards/dragon-strike.png
/cards/fireball.png
/cards/ice-shield.png
/cards/lightning-bolt.png
```

**Recommended specs:**
- Format: PNG or JPG
- Aspect ratio: 3:4 (portrait, e.g., 600x800px or 900x1200px)
- File size: < 300KB
- Can have any background (will be overlaid with stats)

**Database example:**
```json
{
  "name": "Dragon Strike",
  "cardImage": "/cards/dragon-strike.png",
  "power": 15,
  "rarity": "legendary"
}
```

---

## 👤 Avatar/Profile Images

**Location:** `/public/avatars/`

**Database path format:** `/avatars/username.png` or `/avatars/default.png`

**Examples:**
```
/avatars/default.png        # Default avatar for new users
/avatars/user-123.png       # User-specific avatar
/avatars/profile-1.png      # Preset avatar options
```

**Recommended specs:**
- Format: PNG or JPG
- Size: 256x256px (square)
- File size: < 200KB

---

## 🔄 Fallback Behavior

If an image is not found, the system will display:

### Cards
- Shows 🃏 emoji
- Displays "No picture yet" text
- No broken image icon (memory leak prevented)

### Characters
- Shows default character silhouette or emoji
- Graceful fallback handling

### Avatars
- Shows 👤 emoji
- Default placeholder

---

## 📝 Adding New Images

### Step 1: Prepare your image
- Follow the specs above for the image type
- Use appropriate naming (kebab-case)
- Optimize file size

### Step 2: Place in correct directory
```bash
# For cards
cp my-new-card.png public/cards/

# For characters
cp my-new-character.png public/characters/

# For avatars
cp my-avatar.png public/avatars/
```

### Step 3: Update database
Update the corresponding MongoDB document with the correct path:

**For cards:**
```javascript
{
  "cardImage": "/cards/my-new-card.png"
}
```

**For characters:**
```javascript
{
  "characterPic": "/characters/my-new-character.png"
}
```

**For users:**
```javascript
{
  "profilePic": "/avatars/my-avatar.png"
}
```

---

## ⚠️ Important Notes

1. **Always use forward slashes** (`/`) in paths, even on Windows
2. **Paths must start with `/`** - e.g., `/cards/card.png` not `cards/card.png`
3. **Keep file sizes small** - Large images slow down the game
4. **Use consistent naming** - kebab-case for all files
5. **Avoid spaces** in filenames - use hyphens instead
6. **Test in-game** after adding new images to ensure they load correctly

---

## 🖼️ Image Optimization Tips

### Compress images before uploading:
- Use [TinyPNG](https://tinypng.com/) for PNG compression
- Use [Squoosh](https://squoosh.app/) for advanced optimization
- Use [ImageOptim](https://imageoptim.com/) (Mac) or similar tools

### Quick resize commands:
```bash
# Using ImageMagick (if installed)
convert input.png -resize 512x512 output.png
convert card.png -resize 600x800 card-optimized.png
```

---

## 📊 Current Image Counts

Run this command to see how many images you have:

```bash
cd public
echo "Characters: $(ls characters/ 2>/dev/null | wc -l)"
echo "Cards: $(ls cards/ 2>/dev/null | wc -l)"
echo "Avatars: $(ls avatars/ 2>/dev/null | wc -l)"
```

---

## 🎯 Example Workflow

Adding a new legendary card called "Meteor Storm":

1. **Create/obtain artwork** (600x800px PNG)
2. **Name it:** `meteor-storm.png`
3. **Place it:** `public/cards/meteor-storm.png`
4. **Update database:**
   ```javascript
   db.board_game_db.cards.updateOne(
     { name: "Meteor Storm" },
     { $set: { cardImage: "/cards/meteor-storm.png" } }
   )
   ```
5. **Test in-game** - Check inventory and gacha pulls

---

## 🆘 Troubleshooting

### Image not showing?
1. Check the file path is correct (case-sensitive!)
2. Verify the file exists in the correct directory
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for 404 errors
5. Ensure path starts with `/` in database

### Images loading slowly?
1. Compress/optimize images
2. Reduce image dimensions
3. Use WebP format for better compression

### Broken images causing issues?
- The CardDisplay component now prevents infinite loading loops
- Missing images will show emoji fallbacks instead
- No more memory leaks from failed image loads!

---

## 🚀 Deployment Guide

### Local Development Setup
```bash
# 1. Images are in public/ folder
public/
├── cards/dragon-strike.png
├── characters/shadow-tactician.png
└── avatars/default-avatar.png

# 2. .env configuration
VITE_ASSETS_BASE_URL=    # Empty = relative paths

# 3. Images load as: /cards/dragon-strike.png
```

### Production Deployment
```bash
# 1. Copy entire public/ folder to production server
scp -r public/ user@server:/var/www/memebattle/public/

# 2. Update .env for production
VITE_ASSETS_BASE_URL=https://meme-blood.ddns.net:8443

# 3. Build and deploy
npm run build
# Images load as: https://meme-blood.ddns.net:8443/cards/dragon-strike.png

# 4. Ensure web server serves public/ folder correctly
# - public/cards/ → accessible at /cards/
# - public/characters/ → accessible at /characters/
# - public/avatars/ → accessible at /avatars/
```

### Database Image Paths
**IMPORTANT**: Database paths should ALWAYS use relative paths starting with `/`:

✅ **Correct:**
```javascript
{ "cardImage": "/cards/dragon-strike.png" }
{ "characterPic": "/characters/shadow-tactician.png" }
{ "profilePic": "/avatars/user-123.png" }
```

❌ **Wrong:**
```javascript
{ "cardImage": "cards/dragon-strike.png" }  // Missing leading /
{ "cardImage": "http://localhost/cards/..." }  // Hard-coded domain
{ "cardImage": "public/cards/..." }  // Don't include 'public'
```

The environment variable `VITE_ASSETS_BASE_URL` will automatically prepend the correct base URL.

---

Happy designing! 🎨✨
