# current node.js
FROM node:20

# working directory inside app
WORKDIR /app

# copy package.json to install dependencies
COPY package*.json ./

# installing dependencies
RUN npm install

# copying code into one container
COPY . .

# exposing port 4001
EXPOSE 4001

# start backend server
CMD ["npm", "start"]