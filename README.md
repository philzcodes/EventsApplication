# Events Platform

A modern, responsive event management platform built with React, TypeScript, and Firebase.

## Features

- **Event Creation & Management**
  - Create and manage multiple events
  - Custom event pages with unique URLs
  - Upload cover images
  - Set custom registration questions
  - Create event agendas

- **Registration System**
  - Customizable registration forms
  - Real-time form validation
  - Email notifications
  - Calendar integration
  - Export attendee data

- **Host Dashboard**
  - Overview of all events
  - Registration statistics
  - Attendee management
  - Email communication tools
  - Event analytics

## Tech Stack

- **Frontend**
  - React 18
  - TypeScript
  - Tailwind CSS
  - React Router
  - React Hook Form
  - Zod (validation)

- **Backend**
  - Firebase
    - Authentication
    - Firestore (database)
    - Storage (file uploads)
    - Cloud Functions (optional)

- **Deployment**
  - Vercel/Netlify

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/events-platform.git
   cd events-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable:
   - Authentication
   - Firestore Database
   - Storage

4. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/        # Configuration files
├── hooks/         # Custom React hooks
├── layouts/       # Page layouts
├── pages/         # Page components
└── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@eventsplatform.com or open an issue in the GitHub repository.

# Event Platform - Email Service Setup

## Option 1: Firebase Cloud Functions (Paid Service)

### Prerequisites
- Firebase project with Blaze plan (pay-as-you-go)
- Node.js and npm installed
- Firebase CLI installed

### Setup Steps
1. Install dependencies:
```bash
cd functions
npm install firebase-functions firebase-admin nodemailer
```

2. Configure email settings:
```bash
firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-specific-password"
```

3. Deploy the function:
```bash
firebase deploy --only functions
```

### Cost Considerations
- Firebase Functions has a free tier:
  - 2 million invocations/month
  - 400,000 GB-seconds of compute time
  - 200,000 CPU-seconds of compute time
- Beyond free tier, costs are:
  - $0.40 per million invocations
  - $0.00001 per GB-second
  - $0.00001 per CPU-second

## Option 2: Alternative Email Services (Recommended for Production)

### 1. SendGrid
- Free tier: 100 emails/day
- Easy integration
- Better deliverability
- Setup:
```bash
npm install @sendgrid/mail
```

### 2. Mailgun
- Free tier: 5,000 emails/month for 3 months
- Good for bulk emails
- Setup:
```bash
npm install mailgun-js
```

### 3. Amazon SES
- Free tier: 62,000 emails/month
- Very cost-effective
- Setup:
```bash
npm install aws-sdk
```

## Option 3: Self-hosted Solution

### Using Node.js with Express
1. Create a simple Express server
2. Use nodemailer directly
3. Deploy to your preferred hosting service

### Setup:
```bash
npm install express nodemailer
```

## Email Templates

The platform supports HTML email templates. You can customize the templates in the `functions/src/templates` directory.

## Monitoring and Logging

- Firebase Functions provides built-in logging
- For other solutions, consider:
  - Winston for logging
  - Sentry for error tracking
  - Custom monitoring dashboard

## Security Considerations

1. Never commit email credentials to version control
2. Use environment variables for sensitive data
3. Implement rate limiting
4. Validate email addresses
5. Use SPF and DKIM records

## Best Practices

1. Queue emails instead of sending immediately
2. Implement retry logic
3. Monitor bounce rates
4. Keep email templates responsive
5. Include unsubscribe links
6. Follow CAN-SPAM guidelines

## Troubleshooting

Common issues and solutions:
1. Email not sending
   - Check credentials
   - Verify SMTP settings
   - Check spam filters

2. High bounce rates
   - Validate email addresses
   - Clean email lists
   - Check domain reputation

3. Delivery delays
   - Check queue size
   - Monitor server load
   - Verify rate limits 