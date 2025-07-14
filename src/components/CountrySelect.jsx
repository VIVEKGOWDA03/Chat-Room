// src/components/CountrySelect.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CountrySelect = ({ onChange, value }) => {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch country data (dial codes and names)
    const fetchCountries = async () => {
      try {
        // Fetch only necessary fields for efficiency
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,idd');
        const formattedCountries = response.data
          .filter(country => country.idd?.root && country.idd?.suffixes)
          .map(country => ({
            name: country.name.common,
            code: country.cca2,
            dialCode: `${country.idd.root}${country.idd.suffixes[0] || ''}`.replace(/-$/, '') // Clean up dial code
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
          
        setCountries(formattedCountries);
      } catch (error) {
        console.error("Error fetching country data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCountries();
  }, []);

  if (isLoading) {
    return <select className="w-full p-2 border rounded-md" disabled><option>Loading countries...</option></select>;
  }

  return (
    <select
      className="w-full p-2 border border-gray-300 rounded-md"
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      <option value="">Select Country</option>
      {countries.map((country) => (
        <option key={country.code} value={country.dialCode}>
          {country.name} ({country.dialCode})
        </option>
      ))}
    </select>
  );
};

export default CountrySelect;