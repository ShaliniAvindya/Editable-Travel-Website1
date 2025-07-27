// src/components/NotificationPanel.js
import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

const NotificationPanel = () => {
  const [showNotification, setShowNotification] = useState(false);

  const handleToggleNotification = () => {
    setShowNotification(!showNotification);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My App
          </Typography>
          <Button variant="outline-light" onClick={handleToggleNotification}>
            Notifications
          </Button>
        </Toolbar>
      </AppBar>

      {showNotification && (
        <Alert variant="info" onClose={handleToggleNotification} dismissible>
          <Alert.Heading>Notification</Alert.Heading>
          <p>
            Sample notification content goes here.
          </p>
        </Alert>
      )}
    </div>
  );
};

export default NotificationPanel;
