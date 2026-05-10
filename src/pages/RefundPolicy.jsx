import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="policy-page" style={{ padding: '120px 20px 60px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-gray)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Refund Policy</h1>
        
        <div style={{ lineHeight: '1.8' }}>
          <p>Thank you for shopping at C & S Badminton Complex. We value your satisfaction and strive to provide you with the best online shopping experience possible. If, for any reason, you are not completely satisfied with your purchase, we are here to help.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Returns</h3>
          <p>We accept returns within 14 days from the date of purchase. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Refunds</h3>
          <p>Once we receive your return and inspect the item, we will notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment. Please note that the refund amount will exclude any shipping charges incurred during the initial purchase.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Exchanges</h3>
          <p>If you would like to exchange your item for a different size, color, or style, please contact our customer support team within 14 days of receiving your order. We will provide you with further instructions on how to proceed with the exchange.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Non-Returnable Items</h3>
          <p>Certain items are non-returnable and non-refundable. These include:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '1rem' }}>
            <li>Gift cards</li>
            <li>Downloadable software products</li>
            <li>Personalized or custom-made items</li>
            <li>Perishable goods</li>
          </ul>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Damaged or Defective Items</h3>
          <p>In the unfortunate event that your item arrives damaged or defective, please contact us immediately. We will arrange for a replacement or issue a refund, depending on your preference and product availability.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Return Shipping</h3>
          <p>You will be responsible for paying the shipping costs for returning your item unless the return is due to our error (e.g., wrong item shipped, defective product). In such cases, we will provide you with a prepaid shipping label.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Processing Time</h3>
          <p>Refunds and exchanges will be processed within 5-7 business days after we receive your returned item. Please note that it may take additional time for the refund to appear in your account, depending on your payment provider.</p>

          <h3 style={{ color: 'white', marginTop: '2rem', marginBottom: '1rem' }}>Contact Us</h3>
          <p>If you have any questions or concerns regarding our refund policy, please contact our customer support team. We are here to assist you and ensure your shopping experience with us is enjoyable and hassle-free.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RefundPolicy;
