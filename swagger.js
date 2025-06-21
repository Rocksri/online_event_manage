const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config(); // loads .env

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
                url: process.env.BACKEND_URL + '/api',
                description: 'Current Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
