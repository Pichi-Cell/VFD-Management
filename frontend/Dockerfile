FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy configuration templates
RUN mkdir -p /etc/nginx/custom-templates
COPY nginx/nginx.http.conf /etc/nginx/custom-templates/nginx.http.conf.template
COPY nginx/nginx.ssl.conf /etc/nginx/custom-templates/nginx.ssl.conf.template

# Copy initialization script to check for SSL
COPY nginx/99-ssl-setup.sh /docker-entrypoint.d/99-ssl-setup.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/99-ssl-setup.sh && \
    chmod +x /docker-entrypoint.d/99-ssl-setup.sh

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
