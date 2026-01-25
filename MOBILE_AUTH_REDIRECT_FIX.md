# Mobile App Auth Redirect Fix

## Problem
The app was not automatically redirecting to the welcome page when receiving 401 Unauthorized errors from the API.

## Solution
Implemented a multi-layered approach to ensure immediate redirect on authentication failure:

### 1. Auth Error Handler ✅
**File:** `apps/mobile/utils/api.ts`
- Added `setAuthErrorHandler` function to register a callback
- When 401 occurs:
  - Clears token from SecureStore
  - Calls registered handler immediately
  - Handler updates auth state and triggers navigation

**File:** `apps/mobile/context/auth.tsx`
- Registers auth error handler on mount
- Handler:
  - Sets `isAuthenticated = false`
  - Uses `setTimeout` for reliable navigation
  - Calls `router.replace('/welcome')`

### 2. Component-Level Auth Checks ✅
**Files Modified:**
- `apps/mobile/app/(tabs)/index.tsx` - Home screen
- `apps/mobile/app/(tabs)/explore.tsx` - Explore screen
- `apps/mobile/app/(tabs)/profile.tsx` - Profile screen

**Implementation:**
- Added `useAuth()` hook to get `isAuthenticated`
- Added `useEffect` that checks auth before loading data
- If not authenticated, immediately redirects to `/welcome`
- Prevents API calls when not authenticated

### 3. Error Handling ✅
**All Components:**
- Catch 401 errors specifically
- Don't set error state on 401 (prevents UI blocking)
- Stop loading states
- Let auth handler redirect
- Return early to prevent further processing

### 4. Auth State Monitoring ✅
**File:** `apps/mobile/context/auth.tsx`
- `useEffect` watches `isAuthenticated` state
- When state changes to `false`:
  - Checks current route
  - Redirects to `/welcome` if on protected route
- Multiple layers ensure redirect happens

## How It Works

### When 401 Error Occurs:

1. **API Client** (`api.ts`):
   ```
   Response 401 → clearAuthToken() → onAuthError() → throw error
   ```

2. **Auth Handler** (registered in `auth.tsx`):
   ```
   onAuthError() → setIsAuthenticated(false) → router.replace('/welcome')
   ```

3. **Auth Context** (`auth.tsx` useEffect):
   ```
   isAuthenticated changes → check route → redirect if needed
   ```

4. **Component Level** (backup):
   ```
   useEffect detects !isAuthenticated → router.replace('/welcome')
   ```

### Multiple Layers:
- ✅ **Layer 1:** API client calls handler immediately
- ✅ **Layer 2:** Auth context monitors state changes
- ✅ **Layer 3:** Components check auth before loading
- ✅ **Layer 4:** Components handle 401 errors gracefully

## Testing

To test the fix:

1. **Start the app** (should be signed out)
2. **Try to access protected routes** - should redirect to welcome
3. **Sign in** - should work normally
4. **Manually clear token** or wait for 401:
   ```javascript
   // In dev console or test
   await SecureStore.deleteItemAsync('jwt');
   // Then try to load feed - should redirect
   ```

## Files Modified

1. `apps/mobile/utils/api.ts`
   - Added `setAuthErrorHandler` function
   - Modified 401 handling to call handler

2. `apps/mobile/context/auth.tsx`
   - Registers auth error handler
   - Enhanced useEffect for state monitoring
   - Added router to dependencies

3. `apps/mobile/app/(tabs)/index.tsx`
   - Added `useAuth()` hook
   - Added auth check in useEffect
   - Enhanced error handling for 401

4. `apps/mobile/app/(tabs)/explore.tsx`
   - Added `useAuth()` hook
   - Added auth check in useEffect
   - Enhanced error handling for 401

5. `apps/mobile/app/(tabs)/profile.tsx`
   - Added `useAuth()` hook
   - Added auth check in useEffect
   - Enhanced error handling for 401

## Status

✅ **FIXED - App now automatically redirects to welcome on 401 errors**

The app has multiple layers of protection to ensure users are always redirected when not authenticated.
