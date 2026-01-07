const Footer = () => {
    return (
        <footer style={{ padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4rem' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem', color: 'var(--primary-green)' }}>C & S Badminton Complex (PVT) Ltd</h3>
                <p style={{ color: 'gray' }}>Your premier destination for professional badminton.</p>
            </div>
            <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'gray' }}>
                    &copy; {new Date().getFullYear()} C & S Badminton Complex (PVT) Ltd. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
