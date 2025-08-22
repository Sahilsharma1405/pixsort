import React from 'react';
import './PaymentModal.css';

function PaymentModal({ isOpen, onClose, onSubmit, isProcessing }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Secure Payment</h2>
                <p className="payment-disclaimer">This is a demo form.</p>
                
                <form onSubmit={onSubmit} className="payment-form">
                    <div className="form-group">
                        <label htmlFor="cardName">Name on Card</label>
                        <input type="text" id="cardName" placeholder="Enter Name as per card" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input type="text" id="cardNumber" placeholder="1234 5678 9101 1121" required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="expiry">Expiry Date</label>
                            <input type="text" id="expiry" placeholder="MM / YY" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cvv">CVV</label>
                            <input type="text" id="cvv" placeholder="123" required />
                        </div>
                    </div>
                    <button type="submit" className="pay-button" disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PaymentModal;