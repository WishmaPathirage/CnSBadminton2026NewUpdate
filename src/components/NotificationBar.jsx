import { motion } from 'framer-motion';

const NotificationBar = () => {
    return (
        <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{
                backgroundColor: 'transparent',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-light)',
                padding: '10px 0',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: '500',
                position: 'relative',
                zIndex: 1001,
                letterSpacing: '1px'
            }}
        >
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
                <motion.div
                    animate={{ x: ["100%", "-100%"] }}
                    transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear"
                    }}
                    style={{ display: 'inline-block' }}
                >
                    <span style={{ opacity: 0.9, paddingRight: '50px' }}>
                        Court Rental &nbsp; • &nbsp; Phone & Online Booking &nbsp; • &nbsp; Card & QR Payments &nbsp; • &nbsp; Racket Gutting &nbsp; • &nbsp; Equipment Shop &nbsp; • &nbsp; Juice Bar &nbsp; • &nbsp; Restaurant &nbsp; • &nbsp; Mini Mart
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default NotificationBar;
