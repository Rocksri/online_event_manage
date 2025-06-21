// backend/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const schemas = require('./schemas');
require('dotenv').config();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Management Platform API',
            version: '1.0.0',
            description: 'API for managing events, tickets, schedules, and analytics',
        },
        servers: [
            {
                url: process.env.BACKEND_URL,
                description: 'Current Server',
            },
        ],
        security: [{ BearerAuth: [] }]
    },
    apis: ['./routes/*.js'], // Path to all route files
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};