# Stage 1: Build the application
# Use a stable LTS version of Node.js. 'alpine' images are smaller.
# The project uses Next.js 15, which requires Node.js 18.17+.
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
# This leverages Docker's layer caching. These files don't change often.
COPY package*.json ./

# Install dependencies using 'npm ci' which is faster and safer for builds
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
# The 'standalone' output mode in next.config.js creates a self-contained server.
RUN npm run build

# Stage 2: Create the production image
# Use the same small 'alpine' base image
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Create a non-root user 'nextjs' for security
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage.
# This includes the server, dependencies, and static assets.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Change ownership of the app directory to the non-root user
# This is crucial for security and proper file permissions.
RUN chown -R nextjs:nextjs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on. The default is 3000.
EXPOSE 3000

# Set the environment variable for the port.
ENV PORT 3000

# The command to start the standalone Next.js server.
CMD ["node", "server.js"]
