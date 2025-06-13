// backend/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const YAML = require('js-yaml'); // Import js-yaml
const fs = require('fs');       // Import fs for file system operations
const path = require('path');   // Import path for path manipulation

// Path to your OpenAPI YAML file
const openApiSpecPath = path.resolve(__dirname, 'schemas.yaml'); // Make sure this path is correct

let openApiDocument;
try {
    // Load and parse the entire OpenAPI YAML file
    openApiDocument = YAML.load(fs.readFileSync(openApiSpecPath, 'utf8'));
} catch (e) {
    console.error('Error loading or parsing OpenAPI YAML file:', e);
    // It's crucial to handle this error, maybe exit the process or throw it
    process.exit(1);
}

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
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
            {
                url: 'https://api.eventplatform.com/v1',
                description: 'Production server',
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
            schemas: openApiDocument.components.schemas || {},
        },
        security: [{
            BearerAuth: [],
        }],
    },
    apis: ['/server.js'], // Path to your API routes
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};