import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Divider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

function useDeviceType() {
  const [deviceType, setDeviceType] = useState({
    isMobile: window.innerWidth <= 768,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType({
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

const ContactInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [subject, setSubject] = useState('');

  // We get device information from the custom hook
  const { isMobile, isTablet } = useDeviceType();
  const isDesktop = !isMobile && !isTablet;

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Fetch inquiries from the backend
  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/contact/inquiries');
      if (!response || !response.data) throw new Error('Failed to fetch inquiries.');
      const data = response.data;
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      message.error(error.message || 'Failed to fetch inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const deleteInquiry = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this inquiry?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/contact/inquiries/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete inquiry.');
      message.success('Inquiry deleted successfully.');
      fetchInquiries();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      message.error(error.message || 'Failed to delete inquiry.');
    }
  };

  // Send reply to an inquiry
  const handleSendReply = async () => {
    if (!currentInquiry || !replyMessage) {
      message.error('Reply message cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/contact/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: currentInquiry._id,
          email: currentInquiry.email,
          subject: subject || `Reply to: ${currentInquiry.name}`,
          replyMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reply.');
      message.success('Reply sent successfully.');
      setReplyModalVisible(false);
      setReplyMessage('');
      setSubject('');
      fetchInquiries();
    } catch (error) {
      console.error('Error sending reply:', error);
      message.error(error.message || 'Failed to send reply.');
    }
  };

  // View reply details
  const handleViewReply = (record) => {
    if (!record.reply) {
      message.info('No reply has been sent for this inquiry.');
      return;
    }

    const sentAt = record.reply.sentAt ? new Date(record.reply.sentAt) : null;
    const formattedDate = sentAt && !isNaN(sentAt) ? sentAt.toLocaleString() : 'Invalid Date';

    Modal.info({
      title: `Reply to ${record.name}`,
      content: (
        <div>
          <p><strong>Subject:</strong> {record.reply.subject}</p>
          <p><strong>Message:</strong> {record.reply.message}</p>
          <p><strong>Sent On:</strong> {formattedDate}</p>
        </div>
      ),
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      align: 'center',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => {
        // If there's no reply, highlight the Reply button.
        const replyButtonStyle = !record.reply
          ? { backgroundColor: 'blue', color: '#fff' }
          : {};

        // If there's a reply, highlight the View Reply button.
        const viewReplyButtonStyle = record.reply
          ? { backgroundColor: 'blue', color: '#fff' }
          : {};

        return (
          <Space>
            <Button
              type="primary"
              style={replyButtonStyle}
              onClick={() => {
                setCurrentInquiry(record);
                setReplyModalVisible(true);
              }}
            >
              Reply
            </Button>
            <Button
              type="primary"
              style={viewReplyButtonStyle}
              onClick={() => handleViewReply(record)}
            >
              View Reply
            </Button>
            <Button
              icon={<DeleteOutlined />}
              style={{ border: '1px solid red', color: 'red' }}
              onClick={() => deleteInquiry(record._id)}
            />
          </Space>
        );
      },
    },
  ];

  // Render for mobile as cards
  const renderMobileCards = () => {
    return (
      <>
        {inquiries.map((inquiry) => {
          // Determine any style for the "Reply" or "View Reply" button.
          const replyButtonStyle = !inquiry.reply
            ? { backgroundColor: 'blue', color: '#fff' }
            : {};
          const viewReplyButtonStyle = inquiry.reply
            ? { backgroundColor: 'blue', color: '#fff' }
            : {};

          return (
            <Card
              key={inquiry._id}
              style={{ marginBottom: 16, backgroundColor: '#f0f0f0', paddingTop: 8 }}
              bodyStyle={{ padding: '0 24px 24px 24px' }}
              title={(
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span><strong>Name:</strong> {inquiry.name}</span>
                  <span><strong>Email:</strong> {inquiry.email}</span>
                </div>
              )}
            >
              <Divider style={{margin: '12px 0'}}></Divider>
              <p><strong>Message:</strong> {inquiry.message}</p>
              <Divider></Divider>
              <Space style={{ padding: '0 15%' }}>
                <Button
                  type="primary"
                  style={replyButtonStyle}
                  onClick={() => {
                    setCurrentInquiry(inquiry);
                    setReplyModalVisible(true);
                  }}
                >
                  Reply
                </Button>
                <Button
                  type="primary"
                  style={viewReplyButtonStyle}
                  onClick={() => handleViewReply(inquiry)}
                >
                  View Reply
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  style={{ border: '1px solid red', color: 'red' }}
                  onClick={() => deleteInquiry(inquiry._id)}
                />
              </Space>
            </Card>
          );
        })}
      </>
    );
  };

  return (
    <div>
      <h2 className="text-5xl font-bold text-center mb-8">Contact Inquiries</h2>
      <Button
        type="primary"
        onClick={fetchInquiries}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        {loading ? 'Reloading...' : 'Reload Inquiries'}
      </Button>

      {isDesktop ? (
        /* DESKTOP VIEW: Show Table */
        <Table
          dataSource={inquiries}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 6 }}
        />
      ) : (
        /* MOBILE VIEW: Show Card layout */
        renderMobileCards()
      )}

      <Modal
        title={`Reply to ${currentInquiry?.name}`}
        visible={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        onOk={handleSendReply}
        okText="Send Reply"
      >
        <Form layout="vertical">
          <Form.Item label="Subject">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject of the reply"
            />
          </Form.Item>
          <Form.Item label="Reply Message">
            <Input.TextArea
              rows={4}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply here..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContactInquiries;
