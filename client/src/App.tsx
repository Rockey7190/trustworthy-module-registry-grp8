import React from 'react';
import './App.css';
import Login from '@react-login-page/page9';
import logo from './img/logo.jpg'; 

const CustomLogo = () => {
    return (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
                src={logo} // Use the imported logo
                alt="Custom Logo"
                style={{
                    width: '150px',
                    height: 'auto',
                    // display: 'block',
                    // margin: '0 auto',
                }}
            />
        </div>
    );
};

function App() {
  return (
    <div>
      <Login>
        <Login.Logo>
          <CustomLogo />{logo}
        </Login.Logo>
      </Login>
    </div>
  );
}

export default App;
