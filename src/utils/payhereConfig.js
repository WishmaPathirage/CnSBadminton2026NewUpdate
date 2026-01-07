import md5 from 'crypto-js/md5';

// PayHere Sandbox Credentials
// REPLACE THESE WITH YOUR ACTUAL SANDBOX CREDENTIALS IF YOU HAVE THEM
export const PAYHERE_MERCHANT_ID = '1211149'; // Default Demo Merchant ID
export const PAYHERE_MERCHANT_SECRET = '4587498579485798457984759834759847598'; // Replace with real secret from PayHere Dashboard
export const PAYHERE_URL = 'https://sandbox.payhere.lk/pay/checkout';

/**
 * Generates the PayHere hash for the payment request.
 * Hash Format: custom_md5(merchant_id + order_id + amount + currency + status_code_upper_md5(secret))
 * Note: PayHere expects the amount to be formatted to 2 decimal places (e.g. 1000.00).
 */
export const generatePaymentHash = (orderId, amount, currency = 'LKR') => {
    const formattedAmount = parseFloat(amount).toFixed(2);
    const merchantSecret = PAYHERE_MERCHANT_SECRET;

    // 1. Hash the secret
    const hashedSecret = md5(merchantSecret).toString().toUpperCase();

    // 2. Create the string to hash
    const hashString = `${PAYHERE_MERCHANT_ID}${orderId}${formattedAmount}${currency}${hashedSecret}`;

    // 3. Generate final hash
    return md5(hashString).toString().toUpperCase();
};
