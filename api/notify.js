import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize firebase-admin if not already initialized
if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin successfully initialized on Vercel.");
    } catch (e) {
        console.error("Firebase admin initialization failed:", e);
    }
}

const db = admin.apps.length ? admin.firestore() : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        let body = req.body;
        
        // Robust parser for different request body formats (Object, String, or Buffer)
        if (typeof body === 'string') {
            const params = new URLSearchParams(body);
            body = Object.fromEntries(params.entries());
        } else if (Buffer.isBuffer(body)) {
            const params = new URLSearchParams(body.toString());
            body = Object.fromEntries(params.entries());
        }

        const {
            merchant_id,
            order_id,
            payment_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = body;

        console.log(`Received Webhook payload for Order ID: ${order_id}, Status: ${status_code}, Payment ID: ${payment_id}`);

        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
        if (!merchantSecret) {
            console.error("PAYHERE_MERCHANT_SECRET environment variable is missing.");
            return res.status(500).json({ error: "Internal Configuration Error: Merchant secret missing." });
        }

        if (!db) {
            console.error("Firestore database connection is uninitialized.");
            return res.status(500).json({ error: "Database Connection Error" });
        }

        // 1. Verify MD5 signature
        // Formula: md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret))
        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const localSigSource = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret;
        const localSig = crypto.createHash('md5').update(localSigSource).digest('hex').toUpperCase();

        if (localSig !== md5sig) {
            console.warn(`MD5 signature verification failed! Received: ${md5sig}, Calculated: ${localSig}`);
            return res.status(400).json({ error: "MD5 signature mismatch. Unauthorized request." });
        }

        console.log(`MD5 signature verified successfully for Order: ${order_id}`);

        // 2. Query booking by order ID (check orderId or order_id key)
        const bookingsRef = db.collection('bookings');
        
        // Search by orderId (camelCase)
        let querySnapshot = await bookingsRef.where('orderId', '==', order_id).limit(1).get();
        
        // Fallback search by order_id (snake_case)
        if (querySnapshot.empty) {
            querySnapshot = await bookingsRef.where('order_id', '==', order_id).limit(1).get();
        }

        if (querySnapshot.empty) {
            console.error(`Booking not found in Firestore for Order ID: ${order_id}`);
            return res.status(404).json({ error: `Booking ${order_id} not found in database.` });
        }

        const docSnapshot = querySnapshot.docs[0];
        const docId = docSnapshot.id;
        const currentStatus = docSnapshot.data().status;

        // 3. Process payment status
        if (status_code === '2') {
            // SUCCESS
            if (currentStatus === 'confirmed') {
                console.log(`Booking ${docId} (Order ${order_id}) is already confirmed.`);
                return res.status(200).json({ status: "already_confirmed" });
            }

            await bookingsRef.doc(docId).update({
                status: 'confirmed',
                payherePaymentId: payment_id || null,
                payhereAmountPaid: payhere_amount || null,
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Booking ${docId} (Order ${order_id}) successfully updated to 'confirmed' status.`);
            return res.status(200).json({ status: "success", order_id });
        } else if (status_code === '-1' || status_code === '-2') {
            // CANCELLED or FAILED
            console.log(`Payment failed or cancelled with status_code: ${status_code} for Order: ${order_id}`);
            
            await bookingsRef.doc(docId).update({
                status: 'failed',
                failedReason: `PayHere checkout returned status_code: ${status_code}`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return res.status(200).json({ status: "failed_updated", order_id });
        } else {
            // PENDING or OTHER codes
            console.log(`Payment status code ${status_code} ignored for Order: ${order_id}`);
            return res.status(200).json({ status: "ignored_status", code: status_code });
        }

    } catch (error) {
        console.error("Critical error in PayHere webhook notify handler:", error);
        return res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
}
