# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source code inside the container
COPY . .

# Expose the app's port (default for Express is 3000)
EXPOSE 8000

# Command to start the app
CMD ["npm", "start"]
