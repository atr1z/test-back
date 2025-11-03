# ESM Module Resolution Fix

## Problem

Node.js v22+ with `"type": "module"` requires explicit file extensions in ESM imports. TypeScript with `moduleResolution: "bundler"` doesn't add `.js` extensions, causing runtime errors:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/packages/core/dist/web-service'
imported from /app/packages/core/dist/index.js
```

## Solution: tsup Bundler

Instead of adding `.js` extensions to all imports, we use **tsup** (esbuild-based bundler) to properly bundle the package for ESM.

### Changes Made

1. **Installed tsup**

    ```json
    "devDependencies": {
      "tsup": "^8.3.5"
    }
    ```

2. **Created `tsup.config.ts`**
    - Bundles package with proper ESM resolution
    - Externalizes dependencies
    - Generates type declarations
    - Preserves decorator metadata

3. **Created `tsconfig.build.json`**
    - Separate config for tsup (without `composite`/`incremental`)
    - Maintains `tsconfig.json` with `composite: true` for project references

4. **Updated build script**
    ```json
    "scripts": {
      "build": "tsup",
      "dev": "tsup --watch"
    }
    ```

### Benefits

✅ **No source code changes** - Keep clean imports without `.js` extensions  
✅ **Proper ESM bundling** - All imports resolved correctly at runtime  
✅ **Fast builds** - esbuild is extremely fast (~300ms)  
✅ **Type safety** - Generates `.d.ts` files  
✅ **Project references** - Maintains TypeScript composite for other apps  
✅ **Production ready** - Works in Docker containers and production environments

### Build Output

```
ESM dist/index.js     494.08 KB
ESM dist/index.js.map 1.05 MB
ESM ⚡️ Build success in 334ms
DTS dist/index.d.ts 58.51 KB
```

### Alternative Solutions (Not Used)

1. **Add .js extensions everywhere** - Too invasive, requires changing all imports
2. **Use --experimental-specifier-resolution=node** - Deprecated in Node.js
3. **Switch to CommonJS** - Loses ESM benefits

## Verification

Test the fix by running:

```bash
pnpm build
node dist/index.js  # Should start without module errors
```
