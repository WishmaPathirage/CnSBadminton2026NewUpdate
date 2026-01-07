export const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
    // Allows 10 digit numbers, optionally starting with +94
    // But for this specific app, we seem to strictly enforce 10 digits in other places
    // Let's allow simple 10 digit check or +94 followed by 9 digits
    const re = /^(?:0|94|\+94)?(?:7\d{8})$/;
    // However, the prompt specifically asked for "Strict 10 digits" in the plan.
    // Let's stick to the 10 digit requirement as per previous code style:
    const simpleRe = /^\d{10}$/;
    return simpleRe.test(phone);
};

export const validatePassword = (password) => {
    return password && password.length >= 6;
};

export const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email address is already registered.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/operation-not-allowed':
            return 'Login is currently disabled. Please contact support.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};
