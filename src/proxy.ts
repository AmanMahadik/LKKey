import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protect all admin pages and dashboard routes
const isProtectedRoute = createRouteMatcher([
  '/settings(.*)',
  '/datasets(.*)',
  '/uploads(.*)',
  '/api-keys(.*)',
  '/records(.*)',
  '/analytics(.*)',
  '/' // Root dashboard page
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)))(.*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk's auto-proxy path for authentication routing
    '/__clerk/:path*',
  ],
};
