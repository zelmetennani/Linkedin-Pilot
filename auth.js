// Authentication and User Management
class AuthManager {
    constructor() {
        this.user = null;
        this.userData = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            this.user = user;
            if (user) {
                this.loadUserData();
                this.updateUI();
            } else {
                this.userData = null;
                this.updateUI();
            }
        });
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Sign-in error:', error);
            showError('Failed to sign in. Please try again.');
        }
    }

    async signOut() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    async loadUserData() {
        if (!this.user) return;

        try {
            const userDoc = await db.collection('users').doc(this.user.uid).get();
            
            if (userDoc.exists) {
                this.userData = userDoc.data();
            } else {
                // Create new user document
                this.userData = {
                    email: this.user.email,
                    name: this.user.displayName,
                    usageCount: 0,
                    plan: 'free',
                    createdAt: new Date(),
                    lastUsed: null
                };
                await this.saveUserData();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async saveUserData() {
        if (!this.user || !this.userData) return;

        try {
            await db.collection('users').doc(this.user.uid).set(this.userData);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    async incrementUsage() {
        if (!this.userData) return false;

        const limits = {
            free: 5,
            pro: 50,
            unlimited: 999999
        };

        const currentLimit = limits[this.userData.plan];
        
        if (this.userData.usageCount >= currentLimit) {
            return false; // Hit limit
        }

        this.userData.usageCount++;
        this.userData.lastUsed = new Date();
        await this.saveUserData();
        this.updateUI();
        return true;
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const userInfo = document.getElementById('userInfo');
        const usageInfo = document.getElementById('usageInfo');

        if (this.user) {
            // User is signed in
            authSection.innerHTML = `
                <div class="user-profile">
                    <img src="${this.user.photoURL || 'https://via.placeholder.com/40'}" alt="Profile" class="profile-pic">
                    <div class="user-details">
                        <span class="user-name">${this.user.displayName}</span>
                        <button onclick="authManager.signOut()" class="sign-out-btn">Sign Out</button>
                    </div>
                </div>
            `;

            if (this.userData) {
                const limits = { free: 5, pro: 50, unlimited: 999999 };
                const currentLimit = limits[this.userData.plan];
                const remaining = currentLimit - this.userData.usageCount;

                usageInfo.innerHTML = `
                    <div class="usage-stats">
                        <span class="usage-text">${this.userData.usageCount}/${currentLimit} generations used</span>
                        <span class="plan-badge ${this.userData.plan}">${this.userData.plan.toUpperCase()}</span>
                    </div>
                `;

                // Show upgrade button if on free plan and near limit
                if (this.userData.plan === 'free' && remaining <= 2) {
                    usageInfo.innerHTML += `
                        <button onclick="showUpgradeModal()" class="upgrade-btn">Upgrade to Pro</button>
                    `;
                }
            }
        } else {
            // User is signed out
            authSection.innerHTML = `
                <button onclick="authManager.signInWithGoogle()" class="google-signin-btn">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google">
                    Sign in with Google
                </button>
            `;
            usageInfo.innerHTML = '';
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager(); 