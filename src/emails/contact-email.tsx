import * as React from 'react';

interface ContactEmailProps {
  email: string;
  subject: string;
  message: string;
}

const ContactEmail: React.FC<ContactEmailProps> = ({ email, subject, message }) => (
  <div style={{ fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1 style={{ fontSize: '24px', color: '#005a9c', borderBottom: '2px solid #005a9c', paddingBottom: '10px' }}>Nuevo Mensaje de Contacto</h1>
      <p style={{ fontSize: '16px' }}>Has recibido un nuevo mensaje desde la web de Ateaco.</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <p><strong>De:</strong> <a href={`mailto:${email}`} style={{ color: '#005a9c' }}>{email}</a></p>
        <p><strong>Asunto:</strong> {subject}</p>
      </div>

      <h2 style={{ fontSize: '20px', color: '#005a9c', marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Mensaje:</h2>
      <div style={{ whiteSpace: 'pre-wrap', padding: '10px 0', fontSize: '16px' }}>
        {message}
      </div>

      <footer style={{ marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '12px', color: '#777' }}>
        <p>Este correo ha sido enviado automáticamente desde el formulario de contacto de la web de Ateaco.</p>
      </footer>
    </div>
  </div>
);

export default ContactEmail;
