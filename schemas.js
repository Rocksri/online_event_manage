// backend/schemas.js
module.exports = {
    openapi: '3.0.0',
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '5f8d0d55b54764421b7156c3' },
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    role: {
                        type: 'string',
                        enum: ['attendee', 'organizer', 'admin'],
                        example: 'attendee'
                    },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-08-15T10:30:00Z' }
                }
            },
            Event: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '5f8d0d55b54764421b7156c4' },
                    title: { type: 'string', example: 'Tech Conference 2023' },
                    description: { type: 'string', example: 'Annual technology conference' },
                    date: { type: 'string', format: 'date', example: '2023-10-15' },
                    time: { type: 'string', example: '09:00 AM' },
                    location: {
                        type: 'object',
                        properties: {
                            venue: { type: 'string', example: 'Convention Center' },
                            address: { type: 'string', example: '123 Main St' },
                            city: { type: 'string', example: 'New York' },
                            country: { type: 'string', example: 'USA' }
                        }
                    },
                    category: { type: 'string', example: 'Technology' },
                    images: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['image1.jpg', 'image2.jpg']
                    },
                    videos: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['video1.mp4']
                    },
                    organizer: { $ref: '#/components/schemas/User' },
                    status: {
                        type: 'string',
                        enum: ['draft', 'published', 'cancelled'],
                        example: 'published'
                    },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-08-01T08:15:00Z' }
                }
            },
            Ticket: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '5f8d0d55b54764421b7156c5' },
                    name: { type: 'string', example: 'VIP Pass' },
                    type: {
                        type: 'string',
                        enum: ['general', 'vip', 'premium', 'student'],
                        example: 'vip'
                    },
                    price: { type: 'number', example: 199.99 },
                    quantity: { type: 'integer', example: 100 },
                    sold: { type: 'integer', example: 75 },
                    validFrom: { type: 'string', format: 'date-time', example: '2023-09-01T00:00:00Z' },
                    validUntil: { type: 'string', format: 'date-time', example: '2023-10-14T23:59:59Z' }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '5f8d0d55b54764421b7156c6' },
                    user: { $ref: '#/components/schemas/User' },
                    event: { $ref: '#/components/schemas/Event' },
                    tickets: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ticketType: { $ref: '#/components/schemas/Ticket' },
                                quantity: { type: 'integer', example: 2 },
                                price: { type: 'number', example: 199.99 }
                            }
                        }
                    },
                    totalAmount: { type: 'number', example: 399.98 },
                    paymentStatus: {
                        type: 'string',
                        enum: ['pending', 'completed', 'failed', 'refunded'],
                        example: 'completed'
                    },
                    paymentMethod: { type: 'string', example: 'credit_card' },
                    transactionId: { type: 'string', example: 'ch_1JXqZ72eZvKYlo2C0ZJZzX0H' },
                    createdAt: { type: 'string', format: 'date-time', example: '2023-09-10T14:30:00Z' }
                }
            },
            Schedule: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '5f8d0d55b54764421b7156c7' },
                    event: { $ref: '#/components/schemas/Event' },
                    sessions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', example: 'Keynote Address' },
                                description: { type: 'string', example: 'Opening keynote by industry leader' },
                                startTime: { type: 'string', format: 'date-time', example: '2023-10-15T09:00:00Z' },
                                endTime: { type: 'string', format: 'date-time', example: '2023-10-15T10:30:00Z' },
                                speaker: { type: 'string', example: 'Jane Smith' },
                                location: { type: 'string', example: 'Main Hall' }
                            }
                        }
                    },
                    lastUpdated: { type: 'string', format: 'date-time', example: '2023-10-01T11:45:00Z' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string', example: 'Resource not found' },
                    message: { type: 'string', example: 'The requested resource was not found' }
                }
            }
        },
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{ BearerAuth: [] }]
};