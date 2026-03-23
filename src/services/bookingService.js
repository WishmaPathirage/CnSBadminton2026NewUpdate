import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDoc } from 'firebase/firestore';

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
            status: bookingDetails.status || 'pending',
            createdAt: new Date().toISOString()
        });

        // Return the new booking with its generated ID
        return { id: docRef.id, ...bookingDetails, status: bookingDetails.status || 'pending' };
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const holdSlot = async (bookingDetails) => {
    try {
        // A hold is just a booking with status 'held'
        const holdData = {
            ...bookingDetails,
            status: 'held',
            createdAt: new Date().toISOString(),
            holdExpiry: new Date(Date.now() + 10 * 60000).toISOString() // 10 minutes from now
        };
        const docRef = await addDoc(collection(db, BOOKINGS_COL), holdData);
        return { id: docRef.id, ...holdData };
    } catch (error) {
        console.error("Error holding slot:", error);
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

export const updateBooking = async (id, updatedData) => {
    try {
        const bookingRef = doc(db, BOOKINGS_COL, id);
        await updateDoc(bookingRef, updatedData);
        return { id, ...updatedData };
    } catch (error) {
        console.error("Error updating booking full data:", error);
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

export const getBookingByOrderId = async (orderId) => {
    try {
        const q = query(
            collection(db, BOOKINGS_COL),
            where("orderId", "==", orderId)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        // Assuming orderId is unique, return first match
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error("Error fetching booking by order ID:", error);
        return null;
    }
};

// Returns only booked slots for privacy (no user names)
export const getAvailability = async (date) => {
    try {
        // 1. Fetch Regular Bookings
        const q = query(
            collection(db, BOOKINGS_COL),
            where("date", "==", date)
        );
        const querySnapshot = await getDocs(q);

        const bookedSlots = querySnapshot.docs
            .map(doc => doc.data())
            .filter(b => {
                if (b.status === 'rejected') return false;
                // If held, check if it's expired
                if (b.status === 'held') {
                    const expiry = b.holdExpiry ? new Date(b.holdExpiry) : null;
                    if (expiry && expiry < new Date()) return false; // Expired
                }
                return true;
            })
            .map(b => ({
                startTime: b.startTime,
                duration: b.duration,
                courts: b.courts,
                type: b.status === 'held' ? 'held' : 'regular'
            }));

        // 2. Fetch Permanent Bookings for this Day of Week
        const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const permSnapshot = await getDocs(collection(db, 'permanent_bookings'));

        const permSlots = permSnapshot.docs
            .map(doc => doc.data())
            .filter(data => (data.dayOfWeek || '').toLowerCase() === dayOfWeek)
            .map(data => {
                return {
                    startTime: data.startTime,
                    duration: Number(data.duration),
                    courts: (data.courts || []).map(Number),
                    type: 'permanent' // Special flag for UI
                };
            });

        // Merge both
        return [...bookedSlots, ...permSlots];

    } catch (error) {
        console.error("Error checking availability:", error);
        return [];
    }
};

// Permanent Bookings (Admin Only)
export const subscribeToPermanentBookings = (callback) => {
    const q = collection(db, 'permanent_bookings');
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(bookings);
    }, (error) => {
        console.error("Error subscribing to permanent bookings:", error);
    });
};

export const createPermanentBooking = async (details) => {
    try {
        await addDoc(collection(db, 'permanent_bookings'), {
            ...details,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error creating permanent booking:", error);
        throw error;
    }
};

export const deletePermanentBooking = async (id) => {
    try {
        await deleteDoc(doc(db, 'permanent_bookings', id));
    } catch (error) {
        console.error("Error deleting permanent booking:", error);
        throw error;
    }
};

export const updatePermanentBooking = async (id, updatedData) => {
    try {
        const permRef = doc(db, 'permanent_bookings', id);
        await updateDoc(permRef, updatedData);
        return { id, ...updatedData };
    } catch (error) {
        console.error("Error updating permanent booking:", error);
        throw error;
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
    //   })
    // });
};

// Check if user is blacklisted
export const checkUserBlacklist = async (uid) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().isBlacklisted) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking blacklist:", error);
        return false;
    }
};
