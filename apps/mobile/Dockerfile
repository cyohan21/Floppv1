# Base image
FROM node:22
# working directory
WORKDIR /app
# Copy both package and package-lock files
COPY package.json ./
# Install dependencies
RUN npm install
# copy source files
COPY . .
# set port (web is set to 8081)
ENV PORT=8081
# expose port
EXPOSE 8081
# health checks
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "npm", "run", "healthcheck" ]
# run command
CMD ["npx", "expo", "start"]