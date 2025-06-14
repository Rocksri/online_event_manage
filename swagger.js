// backend/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const schemas = require('./schemas');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Management Platform API',
            version: '1.0.0',
            description: 'API for managing events, tickets, schedules, and analytics',
        },
        servers: [
            { url: 'http://localhost:5000/api', description: 'Development server' },
            { url: 'https://api.eventplatform.com/v1', description: 'Production server' },
        ],
        components: schemas.components,
        security: schemas.security
    },
    apis: ['./routes/*.js'], // Path to all route files
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/', swaggerUi.serve, swaggerUi.setup(specs));
};