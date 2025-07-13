// Stripe Payments Integration
class PaymentManager {
    constructor() {
        this.stripe = Stripe('your-publishable-key-here'); // Replace with your Stripe publishable key
        this.prices = {
            pro: 'price_pro_monthly_id', // Replace with your Stripe price IDs
            unlimited: 'price_unlimited_monthly_id'
        };
    }

    async createCheckoutSession(plan) {
        try {
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: plan,
                    userId: authManager.user.uid,
                    email: authManager.user.email
                })
            });

            const session = await response.json();
            
            if (session.error) {
                throw new Error(session.error);
            }

            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Payment error:', error);
            showError('Payment failed. Please try again.');
        }
    }

    showUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        modal.style.display = 'block';
    }

    hideUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        modal.style.display = 'none';
    }

    async handleUpgrade(plan) {
        await this.createCheckoutSession(plan);
    }
}

// Initialize payment manager
const paymentManager = new PaymentManager();

// Global function for upgrade modal
function showUpgradeModal() {
    paymentManager.showUpgradeModal();
}

function hideUpgradeModal() {
    paymentManager.hideUpgradeModal();
}

function handleUpgrade(plan) {
    paymentManager.handleUpgrade(plan);
} 