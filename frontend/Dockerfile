FROM node:18-alpine

WORKDIR /app

# Install Dependencies
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Start the server
CMD ["npm", "start"]