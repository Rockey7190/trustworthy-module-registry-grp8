// JavaScript for forwarding credentials for authentication
document.addEventListener('DOMContentLoaded', () => {
    initializelogin_Form(); // Ensure this is executed after DOM content is loaded
});

function initializelogin_Form() {
    const login_Form = document.getElementById('login_Form');

    if (!login_Form) {
        console.error("ERROR! Login form not found!");
        return;
    }

    login_Form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('username').value.trim(); // Trim inputs for safety
        const password_hash = document.getElementById('password_hash').value.trim();

        if (!username || !password_hash) {
            alert('Please fill in both username and password.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/login', { // Update to match your backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password_hash }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.message || 'Login failed. Please try again.');
                return;
            }

            const data = await response.json();
            alert('Login successful!');
            window.location.href = 'home_page.html'; // Redirect on success
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while logging in. Please try again later.');
        }
    });
}
