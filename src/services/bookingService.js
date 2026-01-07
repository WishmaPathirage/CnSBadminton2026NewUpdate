import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';

const BOOKINGS_COL = 'bookings';

// Real-time subscription
export const subscribeToBookings = (callback) => {
    const q = collection(db, BOOKINGS_COL);
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(bookings);
    });
};

export const getBookings = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, BOOKINGS_COL));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
};

export const createBooking = async (bookingDetails) => {
    try {
        // Add new booking to Firestore
        const docRef = await addDoc(collection(db, BOOKINGS_COL), {
            ...bookingDetails,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Return the new booking with its generated ID
        return { id: docRef.id, ...bookingDetails, status: 'pending' };
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const updateBookingStatus = async (id, status) => {
    try {
        const bookingRef = doc(db, BOOKINGS_COL, id);
        await updateDoc(bookingRef, { status });
        // Return minimal updated object (or fetch full if needed)
        return { id, status };
    } catch (error) {
        console.error("Error updating booking:", error);
        throw error;
    }
};

export const deleteBooking = async (id) => {
    try {
        await deleteDoc(doc(db, BOOKINGS_COL, id));
        return true;
    } catch (error) {
        console.error("Error deleting booking:", error);
        throw error;
    }
};

// Returns only booked slots for privacy (no user names)
export const getAvailability = async (date) => {
    try {
        const q = query(
            collection(db, BOOKINGS_COL),
            where("date", "==", date)
        );
        const querySnapshot = await getDocs(q);

        const bookedSlots = querySnapshot.docs
            .map(doc => doc.data())
            .filter(b => b.status !== 'rejected')
            .map(b => ({
                startTime: b.startTime,
                duration: b.duration,
                courts: b.courts
            }));

        return bookedSlots;
    } catch (error) {
        console.error("Error checking availability:", error);
        return [];
    }
};

const sendWhatsAppNotification = (booking) => {
    // Mock WhatsApp API call (e.g. via Twilio or Meta Business API)
    console.log(`[WHATSAPP] Sending notification for booking ${booking.id}`);

    // Example integration logic:
    // const url = 'https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages';
    // fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: booking.userPhone,
    //     type: 'template',
    //     template: { name: 'booking_confirmation', language: { code: 'en_US' } }
    //   })
    // });
};
