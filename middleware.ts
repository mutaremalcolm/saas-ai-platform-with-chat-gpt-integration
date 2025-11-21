/* instabul ignore file */

import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook"]
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)',
     '/', '/(api|trpc)(.*)'],
};

