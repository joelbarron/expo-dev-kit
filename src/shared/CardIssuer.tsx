// @ts-nocheck
import { FontAwesome, Fontisto } from '@expo/vector-icons';
import React from 'react';

export const CardIssuer = ({ issuer, size = 40, color = 'white' }) => {
  if (issuer === 'VISA') {
    return <Fontisto name="visa" size={size} color={color} />;
  }

  if (issuer === 'MASTERCARD') {
    return <Fontisto name="mastercard" size={size} color={color} />;
  }

  if (issuer === 'AMEX') {
    return <Fontisto name="american-express" size={size} color={color} />;
  }

  if (issuer === 'CASH') {
    return <FontAwesome name="money" size={size} color={color} />;
  }

  return null;
};
