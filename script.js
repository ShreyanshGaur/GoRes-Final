const API_URL = 'https://gores-backend-shreyansh.onrender.com'; // Your backend server URL

// --- Google Sign-In Handler ---
async function handleGoogleLogin(response) {
    try {
        const res = await fetch(`${API_URL}/api/users/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential, type: 'login' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userInfo', JSON.stringify({ 
            username: data.username, 
            email: data.email, 
            picture: data.picture // Store Google picture URL
        }));
        window.location.href = 'dashboard.html';
    } catch (error) {
        showFeedbackModal(error.message);
    }
}

async function handleGoogleSignup(response) {
    try {
        const res = await fetch(`${API_URL}/api/users/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential, type: 'signup' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userInfo', JSON.stringify({ 
            username: data.username, 
            email: data.email, 
            picture: data.picture // Store Google picture URL
        }));
        window.location.href = 'dashboard.html';
    } catch (error) {
        showFeedbackModal(error.message);
    }
}


// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // --- Logic for ALL protected dashboard pages ---
        if (document.querySelector('.dashboard-layout')) {
            initializeDashboardFramework();
        }

        // --- Page-Specific Initializers ---
        if (document.getElementById('signup-form')) initializeSignupPage();
        if (document.getElementById('login-form')) initializeLoginPage();
        if (document.getElementById('forgot-password-form')) initializeForgotPasswordPage();
        if (document.getElementById('generate-score-btn')) initializeAtsCheckerPage();
        if (document.getElementById('history-container')) initializeHistoryPage();
        if (document.getElementById('profile-form')) initializeProfilePage();
        if (document.getElementById('template-modal')) initializeTemplatesPage();
        if (document.getElementById('delete-account-btn')) initializeSettingsPage();
        if (document.getElementById('feedback-modal')) initializeFeedbackModal();

    } catch (error) {
        console.error("A critical error occurred on the page:", error);
    }
});


// --- INITIALIZER FUNCTIONS ---

function initializeDashboardFramework() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // Update username display
    const usernameDisplays = document.querySelectorAll('.user-profile span');
    if (usernameDisplays.length > 0 && userInfo && userInfo.username) {
        usernameDisplays.forEach(span => span.textContent = userInfo.username);
    }

    // Update profile icon
    const profileImg = document.getElementById('profile-img');
    const profileInitialsDiv = document.getElementById('profile-initials');

    if (profileImg && profileInitialsDiv) {
        if (userInfo && userInfo.picture) {
            // If user has a Google profile picture, show it
            profileImg.src = userInfo.picture;
            profileImg.classList.remove('hidden');
            profileInitialsDiv.classList.add('hidden');
        } else if (userInfo && userInfo.username) {
            // Otherwise, show initials
            const nameParts = userInfo.username.split(' ');
            let initials = nameParts[0].charAt(0);
            if (nameParts.length > 1) {
                initials += nameParts[nameParts.length - 1].charAt(0);
            }
            profileInitialsDiv.textContent = initials.toUpperCase();
            profileInitialsDiv.classList.remove('hidden');
            profileImg.classList.add('hidden');
        }
    }
    
    // Attach logout functionality
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
}

function initializeSignupPage() {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_URL}/api/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Something went wrong');
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify({ username: data.username, email: data.email, picture: null }));
            window.location.href = 'dashboard.html';
        } catch (error) {
            if (error.message.includes("already exists")) {
                showFeedbackModal("This email is already registered. Please try to log in instead.");
            } else {
                showFeedbackModal(error.message);
            }
        }
    });
}

function initializeLoginPage() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const res = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid credentials');
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify({ username: data.username, email: data.email, picture: null }));
            window.location.href = 'dashboard.html';
        } catch (error) {
            if (error.message.includes("Invalid")) {
                showFeedbackModal("This email is not registered. Please create an account first.");
            } else {
                showFeedbackModal(error.message);
            }
        }
    });
}

function initializeForgotPasswordPage() {
    const form = document.getElementById('forgot-password-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const feedbackElement = document.getElementById('form-feedback-message');
        const submitButton = form.querySelector('button');
        feedbackElement.textContent = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        try {
            const res = await fetch(`${API_URL}/api/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'An error occurred.');
            feedbackElement.textContent = data.message;
            feedbackElement.style.color = 'var(--primary-purple)';
        } catch (error) {
            feedbackElement.textContent = error.message;
            feedbackElement.style.color = '#ff4d4d';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send New Password';
        }
    });
}

function initializeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    const closeModalBtn = modal.querySelector('.modal-close');
    const closeModal = () => modal.classList.add('hidden');
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function showFeedbackModal(message) {
    const modal = document.getElementById('feedback-modal');
    const messageElement = document.getElementById('modal-message');
    if (modal && messageElement) {
        messageElement.textContent = message;
        modal.classList.remove('hidden');
    }
}

function initializeAtsCheckerPage() {
    const generateBtn = document.getElementById('generate-score-btn');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('resume-upload');
    const uploadText = uploadArea.querySelector('.upload-text');

    generateBtn.addEventListener('click', handleAtsCheck);
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) uploadText.textContent = `File: ${fileInput.files[0].name}`;
    });
}

async function handleAtsCheck() {
    const jobDescription = document.getElementById('job-description').value;
    const resumeFile = document.getElementById('resume-upload').files[0];
    const token = localStorage.getItem('userToken');
    const errorElement = document.getElementById('ats-error-message');
    const loader = document.getElementById('loader');
    const resultsArea = document.getElementById('results-area');
    const generateBtn = document.getElementById('generate-score-btn');

    errorElement.textContent = '';
    resultsArea.classList.add('hidden');

    if (!jobDescription.trim() || !resumeFile) {
        errorElement.textContent = 'Please provide both a job description and a resume file.';
        return;
    }

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    formData.append('resume', resumeFile);

    loader.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Analyzing...';

    try {
        const res = await fetch(`${API_URL}/api/ats/check`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'An error occurred during analysis.');
        displayAtsResults(data);
    } catch (error) {
        console.error("ATS Checker Error:", error);
        errorElement.textContent = error.message;
    } finally {
        loader.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Score & Suggestions';
    }
}

function displayAtsResults(data) {
    const resultsArea = document.getElementById('results-area');
    document.getElementById('score-value').textContent = `${data.score}%`;
    const keywordsList = document.getElementById('matched-keywords-list');
    keywordsList.innerHTML = '';
    if (data.matchedKeywords && data.matchedKeywords.length > 0) {
        data.matchedKeywords.forEach(k => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.textContent = k;
            keywordsList.appendChild(tag);
        });
    } else {
        keywordsList.innerHTML = '<p>No major keywords matched.</p>';
    }
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';
    data.suggestions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        suggestionsList.appendChild(li);
    });
    resultsArea.classList.remove('hidden');
}

function initializeHistoryPage() {
    const historyContainer = document.getElementById('history-container');
    const loader = document.getElementById('history-loader');
    const noHistoryMessage = document.getElementById('no-history-message');
    const token = localStorage.getItem('userToken');

    const fetchScanHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/ats/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Could not fetch history.');
            const historyData = await res.json();
            loader.classList.add('hidden');
            if (historyData.length === 0) {
                noHistoryMessage.classList.remove('hidden');
            } else {
                renderHistory(historyData);
            }
        } catch (error) {
            console.error(error);
            loader.innerHTML = `<p class="form-error">Error loading history.</p>`;
        }
    };

    const renderHistory = (scans) => {
        scans.forEach(scan => {
            const scanCard = document.createElement('div');
            scanCard.className = 'scan-card';
            const formattedDate = new Date(scan.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
            scanCard.innerHTML = `
                <div class="scan-card-header">
                    <div class="scan-score-badge" style="--score:${scan.score}">${scan.score}%</div>
                    <h4>Job: ${scan.jobDescription}</h4>
                </div>
                <p class="scan-date">Scanned on: ${formattedDate}</p>
                <div class="scan-details">
                    <h5>Matched Keywords:</h5>
                    <div class="keywords-list">${scan.matchedKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join('') || 'None'}</div>
                    <h5>Suggestions:</h5>
                    <ul>${scan.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>`;
            historyContainer.appendChild(scanCard);
        });
    };

    fetchScanHistory();
}

function initializeProfilePage() {
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    if (userInfo) {
        document.getElementById('profile-username').value = userInfo.username;
        document.getElementById('profile-email').value = userInfo.email;
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const profileMessage = document.getElementById('profile-message');
        profileMessage.textContent = '';
        const updatedData = { username: document.getElementById('profile-username').value };
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('userToken')}` },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update profile.');
            localStorage.setItem('userInfo', JSON.stringify({ username: data.username, email: data.email, picture: userInfo.picture })); // Preserve picture
            localStorage.setItem('userToken', data.token);
            profileMessage.textContent = 'Profile updated successfully!';
            profileMessage.style.color = 'var(--primary-purple)';
            document.querySelectorAll('.user-profile span').forEach(span => span.textContent = data.username);
        } catch (error) {
            profileMessage.textContent = error.message;
            profileMessage.style.color = '#ff4d4d';
        }
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passwordMessage = document.getElementById('password-message');
        const newPasswordInput = document.getElementById('new-password');
        passwordMessage.textContent = '';
        const newPassword = newPasswordInput.value;
        if (newPassword.length < 6) {
            passwordMessage.textContent = 'Password must be at least 6 characters long.';
            passwordMessage.style.color = '#ff4d4d';
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('userToken')}` },
                body: JSON.stringify({ password: newPassword })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to change password.');
            }
            passwordMessage.textContent = 'Password changed successfully!';
            passwordMessage.style.color = 'var(--primary-purple)';
            newPasswordInput.value = '';
        } catch (error) {
            passwordMessage.textContent = error.message;
            passwordMessage.style.color = '#ff4d4d';
        }
    });
}

function initializeTemplatesPage() {
    const templateModal = document.getElementById('template-modal');
    const templateCards = document.querySelectorAll('.template-card');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.querySelector('.modal-close');

    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            modalImage.src = card.querySelector('img').src;
            modalTitle.textContent = card.querySelector('h4').textContent;
            templateModal.classList.remove('hidden');
        });
    });

    const closeModal = () => templateModal.classList.add('hidden');
    closeModalBtn.addEventListener('click', closeModal);
    templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) closeModal();
    });
}

function initializeSettingsPage() {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const confirmationModal = document.getElementById('confirmation-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmUsernameInput = document.getElementById('confirm-username-input');

    deleteAccountBtn.addEventListener('click', () => confirmationModal.classList.remove('hidden'));

    const closeModal = () => confirmationModal.classList.add('hidden');
    cancelDeleteBtn.addEventListener('click', closeModal);
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) closeModal();
    });

    confirmUsernameInput.addEventListener('input', () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        confirmDeleteBtn.disabled = confirmUsernameInput.value !== userInfo.username;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete account.');
            }
            localStorage.clear();
            alert('Your account has been permanently deleted.');
            window.location.href = 'index.html';
        } catch (error) {
            alert(error.message);
            closeModal();
        }
    });
}