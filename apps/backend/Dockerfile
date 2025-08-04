# Base image
FROM node:22
# working directory
WORKDIR /src
# Copy both package and package-lock files
COPY package*.json ./
# Install dependencies
RUN npm install
# copy source files
COPY . .
# Regenerate Prisma client with correct binary targets
RUN npx prisma generate
# set port
ENV PORT=3030
# expose port
EXPOSE 3030
# health checks
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "npm", "run", "healthcheck" ]
# run command
CMD ["npm", "start"]