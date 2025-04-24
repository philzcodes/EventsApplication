// import * as functions from 'firebase-functions'
// import * as admin from 'firebase-admin'
// import * as nodemailer from 'nodemailer'

// admin.initializeApp()

// // Configure email transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: functions.config().email.user,
//     pass: functions.config().email.pass,
//   },
// })

// export const processEmailTasks = functions.firestore
//   .document('emailTasks/{taskId}')
//   .onCreate(async (snap, context) => {
//     const task = snap.data()
//     const { eventId, subject, body, recipients, status } = task

//     if (status !== 'pending') return

//     try {
//       // Get event details
//       const eventDoc = await admin.firestore().collection('events').doc(eventId).get()
//       const event = eventDoc.data()

//       // Process each recipient
//       const emailPromises = recipients.map(async (email: string) => {
//         const mailOptions = {
//           from: `"${event?.title}" <${functions.config().email.user}>`,
//           to: email,
//           subject: subject,
//           html: `
//             <h1>${subject}</h1>
//             <p>${body}</p>
//             <hr>
//             <p>Event Details:</p>
//             <p>Title: ${event?.title}</p>
//             <p>Date: ${new Date(event?.startDate).toLocaleDateString()}</p>
//             <p>Location: ${event?.location}</p>
//           `,
//         }

//         return transporter.sendMail(mailOptions)
//       })

//       await Promise.all(emailPromises)

//       // Update task status
//       await snap.ref.update({
//         status: 'completed',
//         completedAt: admin.firestore.FieldValue.serverTimestamp(),
//       })
//     } catch (error) {
//       console.error('Error processing email task:', error)
//       await snap.ref.update({
//         status: 'failed',
//         error: error.message,
//         failedAt: admin.firestore.FieldValue.serverTimestamp(),
//       })
//     }
//   }) 