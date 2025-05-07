import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">AirTrack</h3>
            <p className="text-blue-200">
              Making air quality tracking accessible for better travel decisions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white">Home</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Services</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Contact</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white">Air Quality Tracking</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Route Planning</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Real-time Alerts</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Travel Reports</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-blue-200">
              <li>Email: info@airtrack.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Air Street, Sky City, AC 12345</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-200">
          <p>&copy; {new Date().getFullYear()} AirTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;