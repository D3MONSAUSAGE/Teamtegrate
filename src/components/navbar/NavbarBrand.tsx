
import React from 'react';
import { Link } from 'react-router-dom';

const NavbarBrand = () => {
  return (
    <div className="flex items-center space-x-4">
      <Link to="/" className="text-xl font-bold text-primary">TeamStream</Link>
    </div>
  );
};

export default NavbarBrand;
